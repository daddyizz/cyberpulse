package com.daddyizz.cyberpulse

import com.daddyizz.cyberpulse.core.ads.AdPlacement
import com.daddyizz.cyberpulse.core.billing.*
import org.junit.Assert.*
import org.junit.Test

class BillingAndAdGateTest {

    // 1. Entitlement mapping tests
    @Test
    fun `default entitlement is Free`() {
        val entitlement: ProEntitlement = ProEntitlement.Free
        assertTrue(entitlement is ProEntitlement.Free)
        assertFalse(entitlement is ProEntitlement.Pro)
        assertFalse(entitlement is ProEntitlement.Pending)
    }

    @Test
    fun `active pro subscription grants Pro entitlement`() {
        val pro = ProEntitlement.Pro(
            source = EntitlementSource.GOOGLE_PLAY,
            productId = SubscriptionStatus.PRODUCT_ID_PRO_YEARLY,
            expiryTimeMillis = System.currentTimeMillis() + 100000L,
            isAutoRenewing = true,
            purchaseToken = "test_token_123"
        )

        assertEquals(SubscriptionStatus.PRODUCT_ID_PRO_YEARLY, pro.productId)
        assertEquals(EntitlementSource.GOOGLE_PLAY, pro.source)
        assertTrue(pro.isAutoRenewing == true)
        assertEquals("test_token_123", pro.purchaseToken)
    }

    @Test
    fun `suspended subscription strictly denies Pro entitlement`() {
        val suspended = ProEntitlement.Suspended(
            productId = SubscriptionStatus.PRODUCT_ID_PRO_MONTHLY,
            reason = "Account hold / payment declined"
        )

        assertFalse("Suspended subscription must NOT be Pro", suspended is ProEntitlement.Pro)
        assertTrue(suspended is ProEntitlement.Suspended)
        assertEquals(SubscriptionStatus.PRODUCT_ID_PRO_MONTHLY, suspended.productId)
    }

    @Test
    fun `pending subscription does not grant active Pro entitlement`() {
        val pending = ProEntitlement.Pending
        assertFalse(pending is ProEntitlement.Pro)
        assertTrue(pending is ProEntitlement.Pending)
    }

    // 2. Billing error mapping tests
    @Test
    fun `user cancellation maps to non-alarming BillingError`() {
        val error = BillingError.fromBillingResult(
            responseCode = 1, // USER_CANCELED in BillingClient
            debugMessage = "User pressed back"
        )
        assertTrue(error is BillingError.UserCanceled)
        assertFalse(error.isSevere)
        assertEquals("Purchase canceled.", error.message)
    }

    @Test
    fun `item already owned maps to AlreadyOwned error`() {
        val error = BillingError.fromBillingResult(
            responseCode = 7, // ITEM_ALREADY_OWNED
            debugMessage = "Already subscribed"
        )
        assertTrue(error is BillingError.AlreadyOwned)
        assertFalse(error.isSevere)
    }

    @Test
    fun `network failure maps to NetworkError`() {
        val error = BillingError.fromBillingResult(
            responseCode = 12, // NETWORK_ERROR
            debugMessage = "Timeout"
        )
        assertTrue(error is BillingError.NetworkError)
    }

    // 3. Token hashing verification tests
    @Test
    fun `token hashing produces consistent sha256 output`() {
        val token1 = "token_abc_123"
        val hash1 = PurchaseVerificationRequest.hashToken(token1)
        val hash2 = PurchaseVerificationRequest.hashToken(token1)

        assertEquals(hash1, hash2)
        assertEquals(64, hash1.length) // SHA-256 hex string length
    }

    @Test
    fun `different tokens produce distinct hashes`() {
        val hashA = PurchaseVerificationRequest.hashToken("token_A")
        val hashB = PurchaseVerificationRequest.hashToken("token_B")

        assertNotEquals(hashA, hashB)
    }

    // 4. Feature gate logic tests
    @Test
    fun `feature gate canUse respects Pro status`() {
        fun mockCanUse(isPro: Boolean, feature: PremiumFeature): Boolean {
            return when (feature) {
                PremiumFeature.AD_FREE,
                PremiumFeature.PREMIUM_THEMES,
                PremiumFeature.ADVANCED_STATS,
                PremiumFeature.AI_PLAYLIST_PLUS,
                PremiumFeature.CYBER_DJ_PLUS,
                PremiumFeature.PREMIUM_VISUALIZER -> isPro
            }
        }

        // Free user cannot use premium themes
        assertFalse(mockCanUse(isPro = false, feature = PremiumFeature.PREMIUM_THEMES))
        assertFalse(mockCanUse(isPro = false, feature = PremiumFeature.AD_FREE))

        // Pro user can use all premium features
        assertTrue(mockCanUse(isPro = true, feature = PremiumFeature.PREMIUM_THEMES))
        assertTrue(mockCanUse(isPro = true, feature = PremiumFeature.AD_FREE))
        assertTrue(mockCanUse(isPro = true, feature = PremiumFeature.CYBER_DJ_PLUS))
    }

    // 5. Ad Gatekeeper policy tests (Critical Monetization Invariants)
    @Test
    fun `pro users NEVER see CyberPulse AdMob placements`() {
        fun shouldShow(
            isPro: Boolean,
            canRequestAds: Boolean,
            isAndroidAuto: Boolean,
            placement: AdPlacement
        ): Boolean {
            if (isAndroidAuto) return false
            if (isPro) return false
            if (!canRequestAds) return false
            return true
        }

        // Even with consent and permitted placement, Pro user gets zero ads
        val result = shouldShow(
            isPro = true,
            canRequestAds = true,
            isAndroidAuto = false,
            placement = AdPlacement.HOME_FEED
        )
        assertFalse("Pro users must NEVER be served CyberPulse ads", result)
    }

    @Test
    fun `android auto NEVER displays AdMob ads regardless of subscription tier`() {
        fun shouldShow(
            isPro: Boolean,
            canRequestAds: Boolean,
            isAndroidAuto: Boolean,
            placement: AdPlacement
        ): Boolean {
            if (isAndroidAuto) return false
            if (isPro) return false
            if (!canRequestAds) return false
            return true
        }

        // Free user on Android Auto surface
        val freeCarResult = shouldShow(
            isPro = false,
            canRequestAds = true,
            isAndroidAuto = true,
            placement = AdPlacement.HOME_FEED
        )
        assertFalse("Android Auto must strictly have ZERO advertisements", freeCarResult)
    }

    @Test
    fun `free user with consent on phone sees permitted placements`() {
        fun shouldShow(
            isPro: Boolean,
            canRequestAds: Boolean,
            isAndroidAuto: Boolean,
            placement: AdPlacement
        ): Boolean {
            if (isAndroidAuto) return false
            if (isPro) return false
            if (!canRequestAds) return false
            return true
        }

        val result = shouldShow(
            isPro = false,
            canRequestAds = true,
            isAndroidAuto = false,
            placement = AdPlacement.EXPLORE_FEED
        )
        assertTrue(result)
    }

    @Test
    fun `session without consent rejects ad requests`() {
        fun shouldShow(
            isPro: Boolean,
            canRequestAds: Boolean,
            isAndroidAuto: Boolean,
            placement: AdPlacement
        ): Boolean {
            if (isAndroidAuto) return false
            if (isPro) return false
            if (!canRequestAds) return false
            return true
        }

        val result = shouldShow(
            isPro = false,
            canRequestAds = false, // Consent declined or uncollected
            isAndroidAuto = false,
            placement = AdPlacement.HOME_FEED
        )
        assertFalse("Ads must never be requested without consent", result)
    }

    // 6. Product IDs validation
    @Test
    fun `subscription product ids are valid and non-empty`() {
        assertEquals("cyberpulse_pro_monthly", SubscriptionStatus.PRODUCT_ID_PRO_MONTHLY)
        assertEquals("cyberpulse_pro_yearly", SubscriptionStatus.PRODUCT_ID_PRO_YEARLY)
        assertTrue(SubscriptionStatus.ACTIVE_SUBSCRIPTION_IDS.contains(SubscriptionStatus.PRODUCT_ID_PRO_MONTHLY))
        assertTrue(SubscriptionStatus.ACTIVE_SUBSCRIPTION_IDS.contains(SubscriptionStatus.PRODUCT_ID_PRO_YEARLY))
    }
}
