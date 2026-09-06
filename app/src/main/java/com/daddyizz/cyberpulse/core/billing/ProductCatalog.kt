package com.daddyizz.cyberpulse.core.billing

import com.android.billingclient.api.ProductDetails

/**
 * UI representation of a subscription plan derived dynamically from Google Play ProductDetails.
 */
data class CyberPulsePlan(
    val productId: String,
    val title: String,
    val description: String,
    val localizedPrice: String,
    val billingPeriod: String,
    val formattedSavings: String? = null,
    val isRecommended: Boolean = false,
    val offerToken: String = "",
    val productDetails: ProductDetails? = null
)

object ProductCatalog {

    /**
     * Extracts a CyberPulsePlan from official Google Play ProductDetails.
     */
    fun fromProductDetails(productDetails: ProductDetails): CyberPulsePlan {
        val subDetails = productDetails.subscriptionOfferDetails
        val primaryOffer = subDetails?.firstOrNull()
        val pricingPhase = primaryOffer?.pricingPhases?.pricingPhaseList?.firstOrNull()

        val localizedPrice = pricingPhase?.formattedPrice ?: "Price in Play Store"
        val billingPeriod = when (pricingPhase?.billingPeriod) {
            "P1M" -> "/ month"
            "P1Y" -> "/ year"
            else -> ""
        }

        val isYearly = productDetails.productId == SubscriptionStatus.PRODUCT_ID_PRO_YEARLY

        return CyberPulsePlan(
            productId = productDetails.productId,
            title = if (isYearly) "CyberPulse Pro Yearly" else "CyberPulse Pro Monthly",
            description = productDetails.description,
            localizedPrice = localizedPrice,
            billingPeriod = billingPeriod,
            formattedSavings = if (isYearly) "Best Value" else null,
            isRecommended = isYearly,
            offerToken = primaryOffer?.offerToken ?: "",
            productDetails = productDetails
        )
    }

    /**
     * Fallback plans used ONLY in debug/mock preview if BillingClient is disconnected or testing offline.
     * Clearly marked as placeholder prices; production prices are authoritative from Google Play.
     */
    val DEFAULT_PLANS = listOf(
        CyberPulsePlan(
            productId = SubscriptionStatus.PRODUCT_ID_PRO_MONTHLY,
            title = "CyberPulse Pro Monthly",
            description = "Flexible monthly subscription. Cancel anytime in Google Play.",
            localizedPrice = "Fetching...",
            billingPeriod = "/ month",
            formattedSavings = null,
            isRecommended = false
        ),
        CyberPulsePlan(
            productId = SubscriptionStatus.PRODUCT_ID_PRO_YEARLY,
            title = "CyberPulse Pro Yearly",
            description = "Full 12-month access. Save over monthly billing.",
            localizedPrice = "Fetching...",
            billingPeriod = "/ year",
            formattedSavings = "Recommended",
            isRecommended = true
        )
    )
}
