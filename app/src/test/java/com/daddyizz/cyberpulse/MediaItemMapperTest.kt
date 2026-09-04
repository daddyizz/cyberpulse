package com.daddyizz.cyberpulse

import com.daddyizz.cyberpulse.core.model.Artwork
import com.daddyizz.cyberpulse.core.model.MusicSource
import com.daddyizz.cyberpulse.core.model.Track
import com.daddyizz.cyberpulse.core.player.CyberPulseTestMedia
import com.daddyizz.cyberpulse.core.player.MediaItemMapper
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Unit tests verifying MediaItemMapper.
 */
class MediaItemMapperTest {

    @Test
    fun testTrack_mapsToMediaItem_withValidUriAndMetadata() {
        val track = CyberPulseTestMedia.TRACK_NEON_HORIZON
        val mediaItem = MediaItemMapper.toMediaItem(track)

        assertEquals(track.id, mediaItem.mediaId)
        assertNotNull(mediaItem.requestMetadata)
        val uri = mediaItem.requestMetadata.mediaUri
        assertNotNull(uri)
        assertTrue(uri.toString().contains("cyberpulse"))

        assertEquals(track.title, mediaItem.mediaMetadata.title.toString())
        assertEquals(track.artist, mediaItem.mediaMetadata.artist.toString())
        assertEquals(track.album, mediaItem.mediaMetadata.albumTitle.toString())
    }

    @Test
    fun youtubeMetadataTrack_mapsToMediaItem_withNullUri() {
        val youtubeTrack = Track(
            id = "yt_test_vid",
            title = "YouTube Video Title",
            artist = "Channel Name",
            album = "YouTube Discovery",
            durationSeconds = 180,
            source = MusicSource.YOUTUBE,
            sourceId = "dQw4w9WgXcQ",
            isLiked = false,
            pulseScore = 75
        )

        val mediaItem = MediaItemMapper.toMediaItem(youtubeTrack)

        assertEquals("yt_test_vid", mediaItem.mediaId)
        // CRITICAL POLICY VERIFICATION: mediaUri must be NULL for YouTube tracks
        assertNull("YouTube mediaItem must NOT have direct playable URI", mediaItem.requestMetadata.mediaUri)
    }

    @Test
    fun testTrack_roundTripThroughMediaItem() {
        val track = CyberPulseTestMedia.TRACK_MIDNIGHT_CIRCUIT
        val mediaItem = MediaItemMapper.toMediaItem(track)
        val reconstructedTrack = MediaItemMapper.fromMediaItem(mediaItem)

        assertEquals(track.id, reconstructedTrack.id)
        assertEquals(track.title, reconstructedTrack.title)
        assertEquals(track.artist, reconstructedTrack.artist)
        assertEquals(track.album, reconstructedTrack.album)
    }
}
