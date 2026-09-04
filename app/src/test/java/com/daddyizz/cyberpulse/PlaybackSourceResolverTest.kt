package com.daddyizz.cyberpulse

import com.daddyizz.cyberpulse.core.model.Artwork
import com.daddyizz.cyberpulse.core.model.MusicSource
import com.daddyizz.cyberpulse.core.model.Track
import com.daddyizz.cyberpulse.core.player.CyberPulseTestMedia
import com.daddyizz.cyberpulse.core.player.PlaybackCapability
import com.daddyizz.cyberpulse.core.player.PlaybackSource
import com.daddyizz.cyberpulse.core.player.PlaybackSourceResolver
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Unit tests verifying PlaybackSourceResolver and compliance with external provider policies.
 */
class PlaybackSourceResolverTest {

    @Test
    fun testMediaCatalogTracks_resolveToDirectUri_andSupportedOfficial() {
        val testTrack = CyberPulseTestMedia.TRACK_NEON_HORIZON

        val source = PlaybackSourceResolver.resolveSource(testTrack)
        val capability = PlaybackSourceResolver.getCapability(testTrack)

        assertTrue("Test track must resolve to DirectUri", source is PlaybackSource.DirectUri)
        val directUri = (source as PlaybackSource.DirectUri).uri
        assertTrue("Test track URI must be non-empty", directUri.isNotBlank())
        assertEquals("Test track capability must be SUPPORTED_OFFICIAL", PlaybackCapability.SUPPORTED_OFFICIAL, capability)
        assertTrue("Test track must be directly playable", PlaybackSourceResolver.isDirectlyPlayable(testTrack))
    }

    @Test
    fun allBlock3ATestCatalogTracks_areDirectlyPlayable() {
        CyberPulseTestMedia.ALL_TEST_TRACKS.forEach { track ->
            val capability = PlaybackSourceResolver.getCapability(track)
            assertEquals("Track ${track.title} should be SUPPORTED_OFFICIAL", PlaybackCapability.SUPPORTED_OFFICIAL, capability)
            val uri = CyberPulseTestMedia.getTestStreamUri(track.id)
            assertNotNull("Track ${track.title} must have test stream URI", uri)
        }
    }

    /**
     * CRITICAL POLICY COMPLIANCE TEST:
     * A YouTube metadata Track with no permitted playback source must NOT receive a direct playback URI.
     */
    @Test
    fun youtubeMetadataTrack_mustNeverResolveToDirectUri() {
        val youtubeTrack = Track(
            id = "yt_video_12345",
            title = "Synthwave Live Session",
            artist = "Retro Synth Artist",
            album = "YouTube Discovery",
            artworkUrl = "https://i.ytimg.com/vi/12345/hqdefault.jpg",
            artwork = Artwork(url = "https://i.ytimg.com/vi/12345/hqdefault.jpg", placeholderKey = "neon_horizon"),
            durationSeconds = 300,
            source = MusicSource.YOUTUBE,
            sourceId = "12345",
            isLiked = false,
            pulseScore = 80
        )

        val source = PlaybackSourceResolver.resolveSource(youtubeTrack)
        val capability = PlaybackSourceResolver.getCapability(youtubeTrack)

        assertFalse("YouTube track must NEVER resolve to DirectUri", source is PlaybackSource.DirectUri)
        assertFalse("YouTube track must NEVER resolve to RadioStream", source is PlaybackSource.RadioStream)
        assertFalse("YouTube track must NEVER resolve to LocalUri", source is PlaybackSource.LocalUri)

        assertEquals("YouTube track must resolve to ExternalPlayer", PlaybackSource.ExternalPlayer, source)
        assertEquals("YouTube track capability must be EXTERNAL_PLAYER", PlaybackCapability.EXTERNAL_PLAYER, capability)
        assertFalse("YouTube track must not be directly playable inside ExoPlayer", PlaybackSourceResolver.isDirectlyPlayable(youtubeTrack))
    }

    @Test
    fun unknownOrBlankTrack_resolvesToUnavailable() {
        val unplayableTrack = Track(
            id = "unknown_blank_track",
            title = "Unknown",
            artist = "Unknown",
            album = "Unknown",
            durationSeconds = 0,
            source = MusicSource.LOCAL_STORAGE,
            sourceId = "", // blank path
            isLiked = false,
            pulseScore = 0
        )

        val source = PlaybackSourceResolver.resolveSource(unplayableTrack)
        val capability = PlaybackSourceResolver.getCapability(unplayableTrack)

        assertEquals(PlaybackSource.Unavailable, source)
        assertEquals(PlaybackCapability.UNAVAILABLE, capability)
        assertFalse(PlaybackSourceResolver.isDirectlyPlayable(unplayableTrack))
    }
}
