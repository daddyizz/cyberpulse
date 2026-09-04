package com.daddyizz.cyberpulse.core.player

/**
 * PlaybackSource defines legitimate media source endpoints for CyberPulse.
 *
 * NOTE: Block 3A strictly adheres to source platform policies.
 * No unofficial audio extraction or scraping from YouTube is supported.
 */
sealed interface PlaybackSource {

    data class DirectUri(
        val uri: String
    ) : PlaybackSource

    data class LocalUri(
        val uri: String
    ) : PlaybackSource

    data class RadioStream(
        val uri: String
    ) : PlaybackSource

    data object ExternalPlayer : PlaybackSource

    data object Unavailable : PlaybackSource
}
