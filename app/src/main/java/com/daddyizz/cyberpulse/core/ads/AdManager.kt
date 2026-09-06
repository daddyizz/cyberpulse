package com.daddyizz.cyberpulse.core.ads

import android.content.Context
import com.daddyizz.cyberpulse.core.billing.EntitlementRepository
import com.google.android.gms.ads.MobileAds
import com.google.android.gms.ads.RequestConfiguration
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch
import java.util.concurrent.atomic.AtomicBoolean

/**
 * Centralized AdMob manager and authoritative Ad Gatekeeper for CyberPulse Music.
 */
class AdManager(
    private val context: Context,
    private val entitlementRepository: EntitlementRepository,
    private val consentManager: ConsentManager,
    private val coroutineScope: CoroutineScope = CoroutineScope(Dispatchers.Main)
) {

    private val isMobileAdsInitialized = AtomicBoolean(false)

    // Remote-configurable placement registry (future Remote Config integration)
    private val enabledPlacements = mutableSetOf(
        AdPlacement.HOME_FEED,
        AdPlacement.EXPLORE_FEED,
        AdPlacement.SEARCH_RESULTS,
        AdPlacement.PROFILE
    )

    init {
        // Observe consent and entitlement: initialize SDK only once consent is allowed
        coroutineScope.launch {
            consentManager.canRequestAds.collectLatest { canRequest ->
                if (canRequest && !entitlementRepository.isPro.value) {
                    initializeMobileAdsSafely()
                }
            }
        }
    }

    /**
     * Initializes Google Mobile Ads SDK safely without duplicate initialization.
     */
    fun initializeMobileAdsSafely() {
        if (isMobileAdsInitialized.compareAndSet(false, true)) {
            MobileAds.initialize(context) { status ->
                // AdMob initialized
            }

            // Configure test devices if needed
            val configuration = RequestConfiguration.Builder()
                .setTestDeviceIds(listOf(AdRequest.DEVICE_ID_EMULATOR))
                .build()
            MobileAds.setRequestConfiguration(configuration)
        }
    }

    /**
     * Authoritative Ad Gatekeeper.
     *
     * Rules:
     * - Must have user consent (consentManager.canRequestAds)
     * - Must NOT be CyberPulse Pro (!isPro)
     * - Must be a permitted placement
     * - Must NOT be an Android Auto surface (!isAndroidAutoSurface)
     */
    fun shouldShowAds(
        placement: AdPlacement,
        isAndroidAutoSurface: Boolean = false
    ): Boolean {
        // 1. Android Auto rule: ABSOLUTE ZERO ADS ON CAR SCREENS
        if (isAndroidAutoSurface) return false

        // 2. CyberPulse Pro rule: PRO USERS GET ZERO CYBERPULSE ADS
        if (entitlementRepository.isPro.value) return false

        // 3. User consent rule: UMP must permit requesting ads
        if (!consentManager.canRequestAds.value) return false

        // 4. Placement rule: verify placement is enabled in policy
        if (!enabledPlacements.contains(placement)) return false

        return true
    }

    /**
     * Toggles ad placement availability (e.g. from Remote Config).
     */
    fun setPlacementEnabled(placement: AdPlacement, enabled: Boolean) {
        if (enabled) {
            enabledPlacements.add(placement)
        } else {
            enabledPlacements.remove(placement)
        }
    }
}
