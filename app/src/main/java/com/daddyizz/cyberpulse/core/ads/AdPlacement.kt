package com.daddyizz.cyberpulse.core.ads

/**
 * Permitted visual ad placements within the CyberPulse Phone UI.
 *
 * CRITICAL POLICY:
 * - NO ads on Android Auto (isAndroidAutoSurface == false always for ads)
 * - NO ads inside Now Playing or overlaying playback controls
 * - NO ads anchored to Mini Player
 * - NO ads inside lock screen or system notifications
 * - NO ads overlaying YouTube video/audio surfaces
 */
enum class AdPlacement {
    HOME_FEED,
    EXPLORE_FEED,
    SEARCH_RESULTS,
    PROFILE
}
