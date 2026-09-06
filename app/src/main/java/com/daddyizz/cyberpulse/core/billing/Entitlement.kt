package com.daddyizz.cyberpulse.core.billing

/**
 * Origin of the verified entitlement.
 */
enum class EntitlementSource {
    GOOGLE_PLAY,
    BACKEND_VERIFIED,
    LOCAL_CACHE
}

/**
 * Granular premium feature gates for future monetization expansion.
 */
enum class PremiumFeature {
    AD_FREE,
    PREMIUM_THEMES,
    ADVANCED_STATS,
    AI_PLAYLIST_PLUS,
    CYBER_DJ_PLUS,
    PREMIUM_VISUALIZER
}

/**
 * Single authoritative entitlement model for CyberPulse.
 *
 * CyberPulse UI queries entitlementRepository.isPro or entitlementRepository.canUse(feature)
 * rather than checking raw purchases independently across screens.
 */
sealed interface ProEntitlement {

    /**
     * Standard Free tier with AdMob phone ads and core CyberPulse functionality.
     */
    data object Free : ProEntitlement

    /**
     * Active CyberPulse Pro tier.
     * Removes CyberPulse AdMob ads and unlocks premium personalization & themes.
     */
    data class Pro(
        val source: EntitlementSource,
        val productId: String,
        val expiryTimeMillis: Long?,
        val isAutoRenewing: Boolean?,
        val purchaseToken: String? = null
    ) : ProEntitlement

    /**
     * Pending transaction state (e.g. slow payment method, awaiting bank authorization).
     * Does not grant permanent Pro access until finalized and acknowledged.
     */
    data object Pending : ProEntitlement

    /**
     * Suspended state (e.g. Google Play Account Hold, payment method declined, paused subscription).
     * Strictly does NOT grant Pro access until resolved in Google Play.
     */
    data class Suspended(
        val productId: String,
        val reason: String = "Subscription on hold / payment required"
    ) : ProEntitlement
}
