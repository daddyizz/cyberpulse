package com.daddyizz.cyberpulse.core.player

import com.daddyizz.cyberpulse.core.model.Artwork
import com.daddyizz.cyberpulse.core.model.MusicSource
import com.daddyizz.cyberpulse.core.model.Track

/**
 * CYBERPULSE_TEST_MEDIA
 *
 * Curated high-fidelity audio streams for AndroidX Media3 / ExoPlayer playback.
 * All tracks are updated to reflect the latest modern electronic & synthwave catalog.
 */
object CyberPulseTestMedia {

    const val TEST_CATALOG_TAG = "CYBERPULSE_TEST_MEDIA"

    // Real studio preview audio streams for ExoPlayer validation & background playback
    private const val SAMPLE_STREAM_1 = "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/08/fe/de/08fede6c-762e-b24f-f4ff-a9e51bbde1cc/mzaf_6048815850106316934.plus.aac.p.m4a"
    private const val SAMPLE_STREAM_2 = "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/d2/45/fb/d245fbf9-8570-fdc0-5e6b-aa528c130486/mzaf_11947081694159530687.plus.aac.p.m4a"
    private const val SAMPLE_STREAM_3 = "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/8d/a4/4e/8da44e8f-9705-6182-686c-332714c54671/mzaf_17406318046701183138.plus.aac.p.m4a"
    private const val SAMPLE_STREAM_4 = "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/24/09/79/2409794c-3d5d-af26-580e-7dc00ee4f207/mzaf_369629549966021675.plus.aac.p.m4a"
    private const val SAMPLE_STREAM_5 = "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/72/ae/a2/72aea230-30e7-4452-0d87-21ce81bd10f2/mzaf_8745873185334459416.plus.aac.p.m4a"

    val TRACK_BLINDING_LIGHTS = Track(
        id = "trk_01",
        title = "Blinding Lights",
        artist = "The Weeknd",
        album = "After Hours",
        artworkUrl = "https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36",
        artwork = Artwork(
            url = "https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36",
            placeholderKey = "neon_horizon"
        ),
        durationSeconds = 200,
        source = MusicSource.DEMO,
        sourceId = "spotify_0VjIjW4GlUZAMYd2vXMi3b",
        isLiked = true,
        artistId = "art_01",
        albumId = "alb_01",
        pulseScore = 99,
        year = 2020,
        lyricsPreview = "I've been on my own for long enough, maybe you can show me how to love..."
    )

    val TRACK_NIGHTCALL = Track(
        id = "trk_02",
        title = "Nightcall",
        artist = "Kavinsky",
        album = "OutRun",
        artworkUrl = "https://i.scdn.co/image/ab67616d0000b273d6d8c2eaa1f9031b62f7a3f7",
        artwork = Artwork(
            url = "https://i.scdn.co/image/ab67616d0000b273d6d8c2eaa1f9031b62f7a3f7",
            placeholderKey = "purple_pulse"
        ),
        durationSeconds = 259,
        source = MusicSource.DEMO,
        sourceId = "spotify_0rufH17G1jM1tHdrLd6j8Y",
        isLiked = true,
        artistId = "art_02",
        albumId = "alb_02",
        pulseScore = 96,
        year = 2013,
        lyricsPreview = "I'm giving you a night call to tell you how I feel..."
    )

    val TRACK_HARDER_BETTER_FASTER = Track(
        id = "trk_03",
        title = "Harder, Better, Faster, Stronger",
        artist = "Daft Punk",
        album = "Discovery",
        artworkUrl = "https://i.scdn.co/image/ab67616d0000b2731e81bff9807a9e629fce5ade",
        artwork = Artwork(
            url = "https://i.scdn.co/image/ab67616d0000b2731e81bff9807a9e629fce5ade",
            placeholderKey = "cyber_grid"
        ),
        durationSeconds = 224,
        source = MusicSource.DEMO,
        sourceId = "spotify_5W3cjX2J3tjhG8theYzFRZ",
        isLiked = true,
        artistId = "art_03",
        albumId = "alb_03",
        pulseScore = 98,
        year = 2001,
        lyricsPreview = "Work it harder, make it better, do it faster, makes us stronger..."
    )

    val TRACK_MIDNIGHT_CITY = Track(
        id = "trk_04",
        title = "Midnight City",
        artist = "M83",
        album = "Hurry Up, We're Dreaming",
        artworkUrl = "https://i.scdn.co/image/ab67616d0000b27362100064780b1d919a95fcf4",
        artwork = Artwork(
            url = "https://i.scdn.co/image/ab67616d0000b27362100064780b1d919a95fcf4",
            placeholderKey = "neon_horizon"
        ),
        durationSeconds = 243,
        source = MusicSource.DEMO,
        sourceId = "spotify_1eyzqe2QqGZUmfcPZtrIyt",
        isLiked = false,
        artistId = "art_04",
        albumId = "alb_04",
        pulseScore = 95,
        year = 2011,
        lyricsPreview = "Waiting in a car, waiting for a ride in the dark..."
    )

    val TRACK_TURBO_KILLER = Track(
        id = "trk_05",
        title = "Turbo Killer",
        artist = "Carpenter Brut",
        album = "Trilogy",
        artworkUrl = "https://i.scdn.co/image/ab67616d0000b27341eec7d9a101b0f5b9d31d45",
        artwork = Artwork(
            url = "https://i.scdn.co/image/ab67616d0000b27341eec7d9a101b0f5b9d31d45",
            placeholderKey = "purple_pulse"
        ),
        durationSeconds = 208,
        source = MusicSource.DEMO,
        sourceId = "spotify_10AgvV3H2c2oF0bBvQ08jP",
        isLiked = true,
        artistId = "art_05",
        albumId = "alb_05",
        pulseScore = 97,
        year = 2015,
        lyricsPreview = "Revving engines through the synthetic horizon..."
    )

    val TRACK_STARBOY = Track(
        id = "trk_06",
        title = "Starboy",
        artist = "The Weeknd ft. Daft Punk",
        album = "Starboy",
        artworkUrl = "https://i.scdn.co/image/ab67616d0000b2734718e2b124f79258be7bc452",
        artwork = Artwork(
            url = "https://i.scdn.co/image/ab67616d0000b2734718e2b124f79258be7bc452",
            placeholderKey = "cyber_grid"
        ),
        durationSeconds = 230,
        source = MusicSource.DEMO,
        sourceId = "spotify_7MXVkk9YM5IZxh0WSlVIh0",
        isLiked = true,
        artistId = "art_01",
        albumId = "alb_06",
        pulseScore = 97,
        year = 2016,
        lyricsPreview = "Look what you've done, I'm a motherf***ing starboy..."
    )

    // Backward compatibility aliases for legacy references if any
    val TRACK_NEON_HORIZON = TRACK_BLINDING_LIGHTS
    val TRACK_MIDNIGHT_CIRCUIT = TRACK_NIGHTCALL
    val TRACK_ELECTRIC_DRIFT = TRACK_HARDER_BETTER_FASTER
    val TRACK_SYNTHETIC_RAIN = TRACK_MIDNIGHT_CITY
    val TRACK_NIGHT_PROTOCOL = TRACK_TURBO_KILLER

    val ALL_TEST_TRACKS = listOf(
        TRACK_BLINDING_LIGHTS,
        TRACK_NIGHTCALL,
        TRACK_HARDER_BETTER_FASTER,
        TRACK_MIDNIGHT_CITY,
        TRACK_TURBO_KILLER,
        TRACK_STARBOY
    )

    private val TEST_STREAM_MAP = mapOf(
        TRACK_BLINDING_LIGHTS.id to SAMPLE_STREAM_1,
        TRACK_NIGHTCALL.id to SAMPLE_STREAM_2,
        TRACK_HARDER_BETTER_FASTER.id to SAMPLE_STREAM_3,
        TRACK_MIDNIGHT_CITY.id to SAMPLE_STREAM_4,
        TRACK_TURBO_KILLER.id to SAMPLE_STREAM_5,
        TRACK_STARBOY.id to SAMPLE_STREAM_1,
        // Legacy IDs mapped to reliable streams
        "cp_test_01" to SAMPLE_STREAM_1,
        "cp_test_02" to SAMPLE_STREAM_2,
        "cp_test_03" to SAMPLE_STREAM_3,
        "cp_test_04" to SAMPLE_STREAM_4,
        "cp_test_05" to SAMPLE_STREAM_5
    )

    fun getTestStreamUri(trackId: String): String? {
        return TEST_STREAM_MAP[trackId] ?: SAMPLE_STREAM_1
    }

    fun isTestTrack(trackId: String): Boolean {
        return TEST_STREAM_MAP.containsKey(trackId)
    }
}
