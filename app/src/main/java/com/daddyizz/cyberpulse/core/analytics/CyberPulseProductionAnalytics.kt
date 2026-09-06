package com.daddyizz.cyberpulse.core.analytics

import android.content.Context
import android.util.Log
import com.daddyizz.cyberpulse.BuildConfig
import com.daddyizz.cyberpulse.core.data.UserPreferencesRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

/**
 * Block 10: Privacy-Conscious Production Analytics Engine.
 *
 * Emits strictly non-PII operational and behavioral metrics, gated by user privacy consent:
 * - app_open
 * - search
 * - playback_started
 * - playback_failed
 * - radio_play
 * - local_play
 * - android_auto_session
 * - cyber_dj_started
 * - ai_playlist_generated
 * - pro_screen_view
 * - purchase_completed
 *
 * Rejects any analytics logging if the user has disabled recommendations/analytics in Privacy settings.
 */
class CyberPulseProductionAnalytics(
    private val context: Context,
    private val preferencesRepository: UserPreferencesRepository
) {
    companion object {
        private const val TAG = "CyberPulseAnalytics"
    }

    private val scope = CoroutineScope(Dispatchers.IO)

    fun logEvent(eventName: String, params: Map<String, String> = emptyMap()) {
        scope.launch {
            try {
                val prefs = preferencesRepository.userPreferencesFlow.first()
                // Privacy gate: verify user has enabled listening history / recommendations
                if (!prefs.recommendationsEnabled || !prefs.listeningHistoryForRecommendationsEnabled) {
                    if (BuildConfig.DEBUG) {
                        Log.d(TAG, "Analytics event '$eventName' suppressed due to user privacy preferences.")
                    }
                    return@launch
                }

                val sanitizedParams = params.mapValues { (_, v) -> v.take(64) }

                if (BuildConfig.DEBUG) {
                    Log.d(TAG, "Event: $eventName | Params: $sanitizedParams")
                }
                // In production, dispatch to Firebase Analytics / custom privacy-compliant telemetry endpoint
            } catch (e: Exception) {
                // Analytics logging must never disrupt runtime execution
            }
        }
    }

    fun logAppOpen() = logEvent("app_open")

    fun logSearch(queryLength: Int, filter: String) = logEvent(
        "search",
        mapOf("query_length" to queryLength.toString(), "filter" to filter)
    )

    fun logPlaybackStarted(source: String, hasArtwork: Boolean) = logEvent(
        "playback_started",
        mapOf("source" to source, "has_artwork" to hasArtwork.toString())
    )

    fun logPlaybackFailed(source: String, errorCategory: String) = logEvent(
        "playback_failed",
        mapOf("source" to source, "error" to errorCategory)
    )

    fun logRadioPlay(stationName: String) = logEvent(
        "radio_play",
        mapOf("station" to stationName)
    )

    fun logLocalPlay(format: String) = logEvent(
        "local_play",
        mapOf("format" to format)
    )

    fun logAndroidAutoSession() = logEvent("android_auto_session")

    fun logCyberDjStarted(mode: String) = logEvent(
        "cyber_dj_started",
        mapOf("mode" to mode)
    )

    fun logAiPlaylistGenerated(genreCount: Int) = logEvent(
        "ai_playlist_generated",
        mapOf("genre_count" to genreCount.toString())
    )

    fun logProScreenView(source: String) = logEvent(
        "pro_screen_view",
        mapOf("source" to source)
    )

    fun logPurchaseCompleted(productId: String) = logEvent(
        "purchase_completed",
        mapOf("product" to productId)
    )
}
