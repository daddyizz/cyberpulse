package com.daddyizz.cyberpulse.core.ads

/**
 * AdMob configuration keys and official Google test Ad Unit IDs.
 *
 * NOTE: For debug and testing builds, official Google sample Ad Units are used
 * to strictly prevent invalid traffic penalties on production ad accounts.
 */
object AdConfig {
    // Production AdMob App ID
    const val PRODUCTION_ADMOB_APP_ID = "ca-app-pub-4110950503958596~8125437952"

    // Official Google sample App ID (for debug builds to prevent invalid traffic penalties)
    const val TEST_ADMOB_APP_ID = "ca-app-pub-3940256099942544~3347511713"

    // Official Google sample Banner Ad Unit ID
    const val TEST_BANNER_AD_UNIT_ID = "ca-app-pub-3940256099942544/6300978111"

    // Official Google sample Native Ad Unit ID
    const val TEST_NATIVE_AD_UNIT_ID = "ca-app-pub-3940256099942544/2247696110"

    /**
     * Resolves the active banner ad unit ID based on build mode and configuration.
     */
    fun getBannerAdUnitId(): String {
        // In release builds with configured production units, this can point to BuildConfig.ADMOB_BANNER_ID
        return TEST_BANNER_AD_UNIT_ID
    }
}
