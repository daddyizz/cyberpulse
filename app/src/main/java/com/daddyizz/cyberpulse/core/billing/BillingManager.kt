package com.daddyizz.cyberpulse.core.billing

import android.app.Activity
import android.content.Context
import com.android.billingclient.api.*
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow

sealed class BillingConnectionState {
    data object Disconnected : BillingConnectionState()
    data object Connecting : BillingConnectionState()
    data object Connected : BillingConnectionState()
    data class Error(val error: BillingError) : BillingConnectionState()
}

/**
 * Manages official Google Play BillingClient lifecycle, connection re-tries,
 * product queries, and purchases listener according to current Billing Library standards.
 */
class BillingManager(
    private val context: Context,
    private val coroutineScope: CoroutineScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
) : PurchasesUpdatedListener, BillingClientStateListener {

    private val _connectionState = MutableStateFlow<BillingConnectionState>(BillingConnectionState.Disconnected)
    val connectionState: StateFlow<BillingConnectionState> = _connectionState.asStateFlow()

    private val _productDetailsMap = MutableStateFlow<Map<String, ProductDetails>>(emptyMap())
    val productDetailsMap: StateFlow<Map<String, ProductDetails>> = _productDetailsMap.asStateFlow()

    private val _purchasesFlow = MutableStateFlow<List<Purchase>>(emptyList())
    val purchasesFlow: StateFlow<List<Purchase>> = _purchasesFlow.asStateFlow()

    private val _billingErrorEvent = MutableSharedFlow<BillingError>()
    val billingErrorEvent: SharedFlow<BillingError> = _billingErrorEvent.asSharedFlow()

    private var billingClient: BillingClient = buildBillingClient()
    private var retryCount = 0
    private val maxRetries = 3

    private fun buildBillingClient(): BillingClient {
        return BillingClient.newBuilder(context)
            .setListener(this)
            .enablePendingPurchases(
                PendingPurchasesParams.newBuilder()
                    .enableOneTimeProducts()
                    .enablePrepaidPlans()
                    .build()
            )
            .build()
    }

    /**
     * Start connection to Google Play Billing service.
     */
    fun startConnection() {
        if (_connectionState.value is BillingConnectionState.Connected ||
            _connectionState.value is BillingConnectionState.Connecting
        ) {
            return
        }
        _connectionState.value = BillingConnectionState.Connecting
        try {
            billingClient.startConnection(this)
        } catch (e: Exception) {
            _connectionState.value = BillingConnectionState.Error(
                BillingError.Unknown(-1, e.message ?: "Failed to start connection")
            )
        }
    }

    override fun onBillingSetupFinished(billingResult: BillingResult) {
        if (billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
            _connectionState.value = BillingConnectionState.Connected
            retryCount = 0
            queryProductDetails()
            queryActivePurchases()
        } else {
            val error = BillingError.fromBillingResult(billingResult.responseCode, billingResult.debugMessage)
            _connectionState.value = BillingConnectionState.Error(error)
            retryConnectionWithBackoff()
        }
    }

    override fun onBillingServiceDisconnected() {
        _connectionState.value = BillingConnectionState.Disconnected
        retryConnectionWithBackoff()
    }

    private fun retryConnectionWithBackoff() {
        if (retryCount < maxRetries) {
            retryCount++
            val delayMs = (1000L * (1 shl retryCount)).coerceAtMost(8000L)
            coroutineScope.launch {
                delay(delayMs)
                startConnection()
            }
        }
    }

    /**
     * Queries available subscriptions configured in ProductCatalog.
     */
    fun queryProductDetails() {
        if (!billingClient.isReady) {
            startConnection()
            return
        }

        val productList = SubscriptionStatus.ACTIVE_SUBSCRIPTION_IDS.map { productId ->
            QueryProductDetailsParams.Product.newBuilder()
                .setProductId(productId)
                .setProductType(BillingClient.ProductType.SUBS)
                .build()
        }

        val params = QueryProductDetailsParams.newBuilder()
            .setProductList(productList)
            .build()

        billingClient.queryProductDetailsAsync(params) { billingResult, queryProductDetailsList ->
            if (billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
                val detailsMap = queryProductDetailsList.associateBy { it.productId }
                _productDetailsMap.value = detailsMap
            } else {
                val error = BillingError.fromBillingResult(billingResult.responseCode, billingResult.debugMessage)
                coroutineScope.launch {
                    _billingErrorEvent.emit(error)
                }
            }
        }
    }

    /**
     * Queries existing active purchases for subscription restoration and status sync.
     */
    fun queryActivePurchases(onComplete: ((List<Purchase>) -> Unit)? = null) {
        if (!billingClient.isReady) {
            onComplete?.invoke(emptyList())
            return
        }

        val params = QueryPurchasesParams.newBuilder()
            .setProductType(BillingClient.ProductType.SUBS)
            .build()

        billingClient.queryPurchasesAsync(params) { billingResult, purchases ->
            if (billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
                _purchasesFlow.value = purchases
                onComplete?.invoke(purchases)
            } else {
                onComplete?.invoke(emptyList())
                val error = BillingError.fromBillingResult(billingResult.responseCode, billingResult.debugMessage)
                coroutineScope.launch {
                    _billingErrorEvent.emit(error)
                }
            }
        }
    }

    /**
     * Handles updates from Google Play purchase sheet.
     */
    override fun onPurchasesUpdated(billingResult: BillingResult, purchases: List<Purchase>?) {
        when (billingResult.responseCode) {
            BillingClient.BillingResponseCode.OK -> {
                if (purchases != null) {
                    _purchasesFlow.value = purchases
                }
            }
            BillingClient.BillingResponseCode.USER_CANCELED -> {
                coroutineScope.launch {
                    _billingErrorEvent.emit(BillingError.UserCanceled)
                }
            }
            BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED -> {
                queryActivePurchases()
                coroutineScope.launch {
                    _billingErrorEvent.emit(BillingError.AlreadyOwned)
                }
            }
            else -> {
                val error = BillingError.fromBillingResult(billingResult.responseCode, billingResult.debugMessage)
                coroutineScope.launch {
                    _billingErrorEvent.emit(error)
                }
            }
        }
    }

    /**
     * Launches the Google Play subscription purchase flow.
     */
    fun launchPurchaseFlow(activity: Activity, productDetails: ProductDetails, offerToken: String): BillingResult {
        val productDetailsParamsList = listOf(
            BillingFlowParams.ProductDetailsParams.newBuilder()
                .setProductDetails(productDetails)
                .setOfferToken(offerToken)
                .build()
        )

        val billingFlowParams = BillingFlowParams.newBuilder()
            .setProductDetailsParamsList(productDetailsParamsList)
            .build()

        return billingClient.launchBillingFlow(activity, billingFlowParams)
    }

    /**
     * Acknowledges a verified purchase as required by Google Play within 3 days.
     */
    suspend fun acknowledgePurchase(purchaseToken: String): Boolean = withContext(Dispatchers.IO) {
        if (!billingClient.isReady) return@withContext false

        val params = AcknowledgePurchaseParams.newBuilder()
            .setPurchaseToken(purchaseToken)
            .build()

        var success = false
        val deferred = CompletableDeferred<Boolean>()

        billingClient.acknowledgePurchase(params) { billingResult ->
            success = billingResult.responseCode == BillingClient.BillingResponseCode.OK
            deferred.complete(success)
        }

        return@withContext try {
            deferred.await()
        } catch (e: Exception) {
            false
        }
    }

    /**
     * Release client resources.
     */
    fun destroy() {
        if (billingClient.isReady) {
            billingClient.endConnection()
        }
    }
}
