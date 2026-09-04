package com.daddyizz.cyberpulse.core.player

import com.daddyizz.cyberpulse.core.model.Artwork
import com.daddyizz.cyberpulse.core.model.MusicSource
import com.daddyizz.cyberpulse.core.model.Track

/**
 * CYBERPULSE_TEST_MEDIA
 *
 * Dedicated test catalog for Block 3A media playback engine verification.
 * Tracks use stable, legally permitted public domain sample media streams
 * to verify AndroidX Media3 / ExoPlayer infrastructure without copyright pretension.
 */
object CyberPulseTestMedia {

    const val TEST_CATALOG_TAG = "CYBERPULSE_TEST_MEDIA"

    // High-reliability, royalty-free sample streams maintained for ExoPlayer validation
    private const val SAMPLE_STREAM_1 = "https://storage.googleapis.com/exoplayer-test-media-1/mp3/dethroned.mp3"
    private const val SAMPLE_STREAM_2 = "https://storage.googleapis.com/exoplayer-test-media-1/mp3/test.mp3"
    private const val SAMPLE_STREAM_3 = "https://storage.googleapis.com/exoplayer-test-media-1/mp3/audio-with-embedded-artwork.mp3"
    private const val SAMPLE_STREAM_4 = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4"
    private const val SAMPLE_STREAM_5 = "https://storage.googleapis.com/exoplayer-test-media-1/mp3/dethroned.mp3"

    val TRACK_NEON_HORIZON = Track(
        id = "cp_test_01",
        title = "Neon Horizon",
        artist = "CyberPulse Lab",
        album = "Synthesizer Test Session Vol. 1",
        artworkUrl = null,
        artwork = Artwork(url = null, placeholderKey = "neon_horizon"),
        durationSeconds = 214,
        source = MusicSource.LOCAL_DEMO,
        sourceId = "test_media_neon_horizon",
        isLiked = true,
        pulseScore = 98,
        lyricsPreview = "Neon veins across the concrete grid..."
    )

    val TRACK_MIDNIGHT_CIRCUIT = Track(
        id = "cp_test_02",
        title = "Midnight Circuit",
        artist = "CyberPulse Lab",
        album = "Synthesizer Test Session Vol. 1",
        artworkUrl = null,
        artwork = Artwork(url = null, placeholderKey = "purple_pulse"),
        durationSeconds = 188,
        source = MusicSource.LOCAL_DEMO,
        sourceId = "test_media_midnight_circuit",
        isLiked = false,
        pulseScore = 94,
        lyricsPreview = "Clock ticks down on the digital line..."
    )

    val TRACK_ELECTRIC_DRIFT = Track(
        id = "cp_test_03",
        title = "Electric Drift",
        artist = "CyberPulse Lab",
        album = "Synthesizer Test Session Vol. 1",
        artworkUrl = null,
        artwork = Artwork(url = null, placeholderKey = "cyber_grid"),
        durationSeconds = 230,
        source = MusicSource.LOCAL_DEMO,
        sourceId = "test_media_electric_drift",
        isLiked = true,
        pulseScore = 91,
        lyricsPreview = "Frequencies align in the midnight glow..."
    )

    val TRACK_SYNTHETIC_RAIN = Track(
        id = "cp_test_04",
        title = "Synthetic Rain",
        artist = "CyberPulse Lab",
        album = "Ambient Test Lab",
        artworkUrl = null,
        artwork = Artwork(url = null, placeholderKey = "neon_horizon"),
        durationSeconds = 195,
        source = MusicSource.LOCAL_DEMO,
        sourceId = "test_media_synthetic_rain",
        isLiked = false,
        pulseScore = 89,
        lyricsPreview = "Drops of light falling through the smog..."
    )

    val TRACK_NIGHT_PROTOCOL = Track(
        id = "cp_test_05",
        title = "Night Protocol",
        artist = "CyberPulse Lab",
        album = "Ambient Test Lab",
        artworkUrl = null,
        artwork = Artwork(url = null, placeholderKey = "purple_pulse"),
        durationSeconds = 222,
        source = MusicSource.LOCAL_DEMO,
        sourceId = "test_media_night_protocol",
        isLiked = true,
        pulseScore = 96,
        lyricsPreview = "Initialize sequence under darkened skies..."
    )

    val ALL_TEST_TRACKS = listOf(
        TRACK_NEON_HORIZON,
        TRACK_MIDNIGHT_CIRCUIT,
        TRACK_ELECTRIC_DRIFT,
        TRACK_SYNTHETIC_RAIN,
        TRACK_NIGHT_PROTOCOL
    )

    private val TEST_STREAM_MAP = mapOf(
        TRACK_NEON_HORIZON.id to SAMPLE_STREAM_1,
        TRACK_MIDNIGHT_CIRCUIT.id to SAMPLE_STREAM_2,
        TRACK_ELECTRIC_DRIFT.id to SAMPLE_STREAM_3,
        TRACK_SYNTHETIC_RAIN.id to SAMPLE_STREAM_4,
        TRACK_NIGHT_PROTOCOL.id to SAMPLE_STREAM_5
    )

    fun getTestStreamUri(trackId: String): String? {
        return TEST_STREAM_MAP[trackId]
    }

    fun isTestTrack(trackId: String): Boolean {
        return TEST_STREAM_MAP.containsKey(trackId)
    }
}
