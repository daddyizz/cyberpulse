package com.daddyizz.cyberpulse.core.billing

import com.android.billingclient.api.BillingClient

/**
 * Mapped Billing errors providing user-friendly UI messages and failure classification.
 */
sealed class BillingError(val message: String, val isSevere: Boolean = false) {
    data object ServiceDisconnected : BillingError("Billing service is temporarily disconnected. Reconnecting...")
    data object ItemUnavailable : BillingError("The requested subscription is currently unavailable.")
    data object UserCanceled : BillingError("Purchase canceled.") // Non-alarming
    data object NetworkError : BillingError("Network issue encountered while connecting to Google Play.")
    data object AlreadyOwned : BillingError("You already own this subscription. Restoring your entitlement...")
    data object DeveloperError : BillingError("Configuration error. Please verify Google Play setup.", isSevere = true)
    data class Unknown(val rawCode: Int, val rawMessage: String) : BillingError("Billing error ($rawCode): $rawMessage")

    companion object {
        fun fromBillingResult(responseCode: Int, debugMessage: String = ""): BillingError {
            return when (responseCode) {
                BillingClient.BillingResponseCode.SERVICE_DISCONNECTED -> ServiceDisconnected
                BillingClient.BillingResponseCode.USER_CANCELED -> UserCanceled
                BillingClient.BillingResponseCode.SERVICE_UNAVAILABLE,
                BillingClient.BillingResponseCode.NETWORK_ERROR -> NetworkError
                BillingClient.BillingResponseCode.BILLING_UNAVAILABLE,
                BillingClient.BillingResponseCode.ITEM_UNAVAILABLE -> ItemUnavailable
                BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED -> AlreadyOwned
                BillingClient.BillingResponseCode.DEVELOPER_ERROR -> DeveloperError
                else -> Unknown(responseCode, debugMessage)
            }
        }
    }
}
