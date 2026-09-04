package com.daddyizz.cyberpulse.core.model

/**
 * Supported stream protocol / container types for internet radio playback in Media3.
 */
enum class RadioStreamType {
    HLS,
    MP3,
    AAC,
    PROGRESSIVE
}

/**
 * Domain model representing a public, legal internet radio broadcast station.
 */
data class RadioStation(
    val id: String,
    val name: String,
    val streamUrl: String,
    val artworkUrl: String? = null,
    val genre: String? = null,
    val country: String? = null,
    val language: String? = null,
    val homepageUrl: String? = null,
    val streamType: RadioStreamType = RadioStreamType.PROGRESSIVE,
    val isVerified: Boolean = false,
    val isFavorite: Boolean = false,
    val bitrateKbps: Int? = null,
    val description: String? = null,
    val currentProgram: String? = null,
    val currentTrackTitle: String? = null
) {
    /**
     * Converts a RadioStation into a unified CyberPulse Track for playback queue integration.
     */
    fun toTrack(): Track = Track(
        id = id,
        title = name,
        artist = currentTrackTitle ?: genre ?: "Live Radio",
        album = currentProgram ?: country ?: "Cyber Radio Broadcast",
        artworkUrl = artworkUrl,
        placeholderArtworkKey = "cyber_radio",
        durationSeconds = 0L,
        source = MusicSource.RADIO,
        sourceId = streamUrl,
        contentUri = streamUrl,
        isLiked = isFavorite,
        isLiveStream = true,
        pulseScore = 95,
        playbackCapability = PlaybackCapability(
            mode = PlaybackMode.SUPPORTED_OFFICIAL,
            streamBitrateKbps = bitrateKbps ?: 192,
            notice = "Live internet radio stream powered by Media3 direct playback"
        )
    )
}
