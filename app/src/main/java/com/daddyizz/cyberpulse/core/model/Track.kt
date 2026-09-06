package com.daddyizz.cyberpulse.core.model

/**
 * Source-agnostic music track model.
 * Designed to cleanly support future providers without exposing third-party audio stream hacks.
 */
data class Track(
    val id: String,
    val title: String,
    val artist: String,
    val album: String,
    val artworkUrl: String? = null,
    val placeholderArtworkKey: String = "default",
    val durationSeconds: Long = 0L,
    val source: MusicSource = MusicSource.DEMO,
    val sourceId: String = id,
    val isLiked: Boolean = false,
    val playsCount: Long = 0L,
    val artistId: String? = null,
    val albumId: String? = null,
    val artwork: Artwork? = null,
    val playbackCapability: PlaybackCapability = PlaybackCapability(),
    val pulseScore: Int = 85,
    val lyricsPreview: String? = null,
    val contentUri: String? = null,
    val trackNumber: Int? = null,
    val year: Int? = null,
    val isLiveStream: Boolean = false,
    val isAvailable: Boolean = true,
    val dateAdded: Long = 0L,
    val folderName: String? = null,
    val spotifyUri: String? = null,
    val externalUrl: String? = null
) {
    val formattedDuration: String
        get() {
            if (durationSeconds <= 0L) return "--:--"
            val minutes = durationSeconds / 60
            val seconds = durationSeconds % 60
            return "%d:%02d".format(minutes, seconds)
        }
}
