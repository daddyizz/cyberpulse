package com.daddyizz.cyberpulse.core.billing

/**
 * Authoritative Product ID definitions for CyberPulse subscriptions and in-app items.
 *
 * NOTE: Production pricing is never hardcoded. Google Play Billing retrieves
 * localized currency, regional pricing, base plans, and promotional offers directly
 * from the Google Play Developer Console.
 */
object SubscriptionStatus {
    // Primary subscription product IDs configured in Google Play Console
    const val PRODUCT_ID_PRO_MONTHLY = "cyberpulse_pro_monthly"
    const val PRODUCT_ID_PRO_YEARLY = "cyberpulse_pro_yearly"

    // Optional future one-time product, architected but gated behind feature flag
    const val PRODUCT_ID_PRO_LIFETIME = "cyberpulse_pro_lifetime"
    const val FEATURE_FLAG_LIFETIME_ENABLED = false

    // List of active subscription IDs queried from Play Billing
    val ACTIVE_SUBSCRIPTION_IDS: List<String> = listOf(
        PRODUCT_ID_PRO_MONTHLY,
        PRODUCT_ID_PRO_YEARLY
    )

    // All available product IDs including one-time if enabled
    val ALL_PRODUCT_IDS: List<String> = buildList {
        addAll(ACTIVE_SUBSCRIPTION_IDS)
        if (FEATURE_FLAG_LIFETIME_ENABLED) {
            add(PRODUCT_ID_PRO_LIFETIME)
        }
    }
}
