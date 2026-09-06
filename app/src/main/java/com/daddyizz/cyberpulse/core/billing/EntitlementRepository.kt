package com.daddyizz.cyberpulse.core.billing

import android.content.Context
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.longPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.android.billingclient.api.Purchase
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*

private val Context.billingDataStore by preferencesDataStore(name = "cyberpulse_billing_entitlements")

/**
 * Authoritative Single Source of Truth for CyberPulse user entitlements.
 *
 * Manages Pro subscriptions, purchase acknowledgement, pending states, offline caching,
 * and restore operations.
 */
class EntitlementRepository(
    private val context: Context,
    private val billingManager: BillingManager,
    private val purchaseVerifier: PurchaseVerifier = DefaultPurchaseVerifier(),
    private val coroutineScope: CoroutineScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
) {

    private object EntitlementKeys {
        val IS_PRO_CACHED = booleanPreferencesKey("is_pro_cached")
        val CACHED_PRODUCT_ID = stringPreferencesKey("cached_product_id")
        val CACHED_EXPIRY_MILLIS = longPreferencesKey("cached_expiry_millis")
        val CACHED_AUTO_RENEW = booleanPreferencesKey("cached_auto_renew")
    }

    private val _entitlement = MutableStateFlow<ProEntitlement>(ProEntitlement.Free)
    val entitlement: StateFlow<ProEntitlement> = _entitlement.asStateFlow()

    val isPro: StateFlow<Boolean> = _entitlement.map { it is ProEntitlement.Pro }
        .stateIn(coroutineScope, SharingStarted.Eagerly, false)

    val isPending: StateFlow<Boolean> = _entitlement.map { it is ProEntitlement.Pending }
        .stateIn(coroutineScope, SharingStarted.Eagerly, false)

    init {
        // 1. Read cached entitlement immediately to ensure smooth offline startup
        loadCachedEntitlement()

        // 2. Observe active purchases stream from Play Billing
        coroutineScope.launch {
            billingManager.purchasesFlow.collectLatest { purchases ->
                processPurchases(purchases)
            }
        }
    }

    private fun loadCachedEntitlement() {
        coroutineScope.launch {
            context.billingDataStore.data.firstOrNull()?.let { prefs ->
                val isCachedPro = prefs[EntitlementKeys.IS_PRO_CACHED] ?: false
                val expiry = prefs[EntitlementKeys.CACHED_EXPIRY_MILLIS] ?: 0L
                val now = System.currentTimeMillis()

                if (isCachedPro && (expiry == 0L || expiry > now)) {
                    val productId = prefs[EntitlementKeys.CACHED_PRODUCT_ID] ?: SubscriptionStatus.PRODUCT_ID_PRO_MONTHLY
                    val autoRenew = prefs[EntitlementKeys.CACHED_AUTO_RENEW] ?: true
                    _entitlement.value = ProEntitlement.Pro(
                        source = EntitlementSource.LOCAL_CACHE,
                        productId = productId,
                        expiryTimeMillis = if (expiry > 0) expiry else null,
                        isAutoRenewing = autoRenew
                    )
                }
            }
        }
    }

    /**
     * Evaluates a purchase list from Google Play and updates the authoritative entitlement.
     */
    suspend fun processPurchases(purchases: List<Purchase>) {
        if (purchases.isEmpty()) {
            // Check if existing Pro has expired
            val current = _entitlement.value
            if (current is ProEntitlement.Pro && current.source != EntitlementSource.LOCAL_CACHE) {
                _entitlement.value = ProEntitlement.Free
                clearCachedEntitlement()
            }
            return
        }

        // Search for active CyberPulse subscription purchases
        val proPurchase = purchases.firstOrNull { purchase ->
            purchase.products.any { it in SubscriptionStatus.ALL_PRODUCT_IDS }
        }

        if (proPurchase == null) {
            _entitlement.value = ProEntitlement.Free
            clearCachedEntitlement()
            return
        }

        when (proPurchase.purchaseState) {
            Purchase.PurchaseState.PURCHASED -> {
                val productId = proPurchase.products.firstOrNull { it in SubscriptionStatus.ALL_PRODUCT_IDS }
                    ?: SubscriptionStatus.PRODUCT_ID_PRO_MONTHLY

                // Verify purchase token securely with backend architecture
                val verificationRequest = PurchaseVerificationRequest(
                    packageName = context.packageName,
                    productId = productId,
                    purchaseToken = proPurchase.purchaseToken,
                    userId = null
                )

                val verification = purchaseVerifier.verifyPurchase(verificationRequest)

                if (verification.isSuspended) {
                    _entitlement.value = ProEntitlement.Suspended(
                        productId = productId,
                        reason = verification.message.ifBlank { "Subscription on hold in Google Play" }
                    )
                    clearCachedEntitlement()
                } else if (verification.isValid && verification.isEntitled) {
                    // Acknowledge purchase if needed (must occur within 3 days or Google revokes)
                    if (!proPurchase.isAcknowledged) {
                        billingManager.acknowledgePurchase(proPurchase.purchaseToken)
                    }

                    val updatedEntitlement = ProEntitlement.Pro(
                        source = verification.verificationSource,
                        productId = productId,
                        expiryTimeMillis = verification.expiryTimeMillis,
                        isAutoRenewing = verification.isAutoRenewing,
                        purchaseToken = proPurchase.purchaseToken
                    )

                    _entitlement.value = updatedEntitlement
                    persistCachedEntitlement(updatedEntitlement)
                } else {
                    _entitlement.value = ProEntitlement.Free
                    clearCachedEntitlement()
                }
            }
            Purchase.PurchaseState.PENDING -> {
                // Transaction in progress; show pending UI but do NOT grant full Pro access yet
                _entitlement.value = ProEntitlement.Pending
            }
            else -> {
                _entitlement.value = ProEntitlement.Free
                clearCachedEntitlement()
            }
        }
    }

    /**
     * Triggered by the user in Settings -> Restore Purchases.
     */
    suspend fun restorePurchases(): RestoreResult {
        val completer = CompletableDeferred<RestoreResult>()
        billingManager.queryActivePurchases { purchases ->
            coroutineScope.launch {
                val relevant = purchases.filter { p ->
                    p.products.any { it in SubscriptionStatus.ALL_PRODUCT_IDS }
                }
                if (relevant.isNotEmpty()) {
                    processPurchases(relevant)
                    completer.complete(RestoreResult.Restored)
                } else {
                    _entitlement.value = ProEntitlement.Free
                    clearCachedEntitlement()
                    completer.complete(RestoreResult.NoPurchasesFound)
                }
            }
        }
        return try {
            completer.await()
        } catch (e: Exception) {
            RestoreResult.Error(e.message ?: "Failed to query Google Play purchases")
        }
    }

    /**
     * Checks if a specific feature is unlocked under the current entitlement.
     */
    fun canUse(feature: PremiumFeature): Boolean {
        return when (feature) {
            PremiumFeature.AD_FREE,
            PremiumFeature.PREMIUM_THEMES,
            PremiumFeature.ADVANCED_STATS,
            PremiumFeature.AI_PLAYLIST_PLUS,
            PremiumFeature.CYBER_DJ_PLUS,
            PremiumFeature.PREMIUM_VISUALIZER -> isPro.value
        }
    }

    private suspend fun persistCachedEntitlement(pro: ProEntitlement.Pro) {
        context.billingDataStore.edit { prefs ->
            prefs[EntitlementKeys.IS_PRO_CACHED] = true
            prefs[EntitlementKeys.CACHED_PRODUCT_ID] = pro.productId
            prefs[EntitlementKeys.CACHED_EXPIRY_MILLIS] = pro.expiryTimeMillis ?: 0L
            prefs[EntitlementKeys.CACHED_AUTO_RENEW] = pro.isAutoRenewing ?: true
        }
    }

    private suspend fun clearCachedEntitlement() {
        context.billingDataStore.edit { prefs ->
            prefs[EntitlementKeys.IS_PRO_CACHED] = false
            prefs[EntitlementKeys.CACHED_PRODUCT_ID] = ""
            prefs[EntitlementKeys.CACHED_EXPIRY_MILLIS] = 0L
            prefs[EntitlementKeys.CACHED_AUTO_RENEW] = false
        }
    }
}

sealed interface RestoreResult {
    data object Restored : RestoreResult
    data object NoPurchasesFound : RestoreResult
    data class Error(val message: String) : RestoreResult
}
