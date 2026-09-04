package com.daddyizz.cyberpulse.core.model

/**
 * Compliance-safe capability descriptor for future audio playback (Block 3).
 * Explains playback modality without attempting unauthorized audio extraction.
 */
enum class PlaybackMode {
    SUPPORTED_OFFICIAL,
    EXTERNAL_PLAYER,
    UNAVAILABLE,
    UNKNOWN
}

data class PlaybackCapability(
    val mode: PlaybackMode = PlaybackMode.UNKNOWN,
    val supportsLossless: Boolean = false,
    val supportsOffline: Boolean = false,
    val supportsLyrics: Boolean = true,
    val streamBitrateKbps: Int = 256,
    val notice: String = "Playback engine scheduled for Block 3 (Official Media3/Embed architecture)"
)
