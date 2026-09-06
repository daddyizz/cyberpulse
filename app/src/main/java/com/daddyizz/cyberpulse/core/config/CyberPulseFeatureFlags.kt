package com.daddyizz.cyberpulse.core.config

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * Block 10: Authoritative Feature Flags and Provider Kill Switch Engine.
 *
 * Supports safe runtime and remote toggling of major subsystems:
 * - YOUTUBE_DISCOVERY
 * - SPOTIFY_INTEGRATION
 * - CYBER_RADIO
 * - LOCAL_MUSIC
 * - ANDROID_AUTO
 * - AI_PLAYLIST
 * - CYBER_DJ
 * - LYRICS
 * - VISUALIZER
 * - STATS
 * - REPLAY
 * - ADMOB
 * - PRO
 *
 * Provider Failure Isolation: If Spotify API, YouTube quota, or Lyrics provider fails,
 * the corresponding flag can be safely toggled off without disrupting core playback or local music.
 */
object CyberPulseFeatureFlags {

    private val _flags = MutableStateFlow(
        mapOf(
            Feature.YOUTUBE_DISCOVERY to true,
            Feature.SPOTIFY_INTEGRATION to true,
            Feature.CYBER_RADIO to true,
            Feature.LOCAL_MUSIC to true,
            Feature.ANDROID_AUTO to true,
            Feature.AI_PLAYLIST to true,
            Feature.CYBER_DJ to true,
            Feature.LYRICS to true,
            Feature.VISUALIZER to true,
            Feature.STATS to true,
            Feature.REPLAY to true,
            Feature.ADMOB to true,
            Feature.PRO to true
        )
    )
    val flags: StateFlow<Map<Feature, Boolean>> = _flags.asStateFlow()

    enum class Feature {
        YOUTUBE_DISCOVERY,
        SPOTIFY_INTEGRATION,
        CYBER_RADIO,
        LOCAL_MUSIC,
        ANDROID_AUTO,
        AI_PLAYLIST,
        CYBER_DJ,
        LYRICS,
        VISUALIZER,
        STATS,
        REPLAY,
        ADMOB,
        PRO
    }

    fun isEnabled(feature: Feature): Boolean {
        return _flags.value[feature] ?: true
    }

    fun setFeatureEnabled(feature: Feature, enabled: Boolean) {
        val updated = HashMap(_flags.value)
        updated[feature] = enabled
        _flags.value = updated
    }

    /**
     * Kill switch trigger when external services encounter critical quota exhaustion or 5xx outages.
     */
    fun triggerKillSwitch(feature: Feature, reason: String) {
        android.util.Log.w("FeatureFlags", "Kill switch engaged for $feature: $reason")
        setFeatureEnabled(feature, false)
    }

    /**
     * Reset all feature flags to default production baseline.
     */
    fun resetToDefaults() {
        _flags.value = Feature.values().associateWith { true }
    }
}
