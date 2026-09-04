package com.daddyizz.cyberpulse.core.player

import android.net.Uri
import android.os.Bundle
import androidx.media3.common.MediaItem
import androidx.media3.common.MediaMetadata
import androidx.media3.common.MimeTypes
import com.daddyizz.cyberpulse.core.model.Artwork
import com.daddyizz.cyberpulse.core.model.MusicSource
import com.daddyizz.cyberpulse.core.model.PlaybackCapability
import com.daddyizz.cyberpulse.core.model.PlaybackMode
import com.daddyizz.cyberpulse.core.model.Track

/**
 * MediaItemMapper
 *
 * Bidirectional transformation between CyberPulse Track domain model
 * and AndroidX Media3 MediaItem.
 *
 * Enforces strict security: MediaItem URI is only set if a legitimate
 * direct, local, or radio playback source exists.
 */
object MediaItemMapper {

    private const val EXTRA_SOURCE_NAME = "cyberpulse.source"
    private const val EXTRA_SOURCE_ID = "cyberpulse.sourceId"
    private const val EXTRA_DURATION_SEC = "cyberpulse.durationSeconds"
    private const val EXTRA_PLACEHOLDER_KEY = "cyberpulse.placeholderKey"
    private const val EXTRA_IS_LIKED = "cyberpulse.isLiked"
    private const val EXTRA_PULSE_SCORE = "cyberpulse.pulseScore"
    private const val EXTRA_CONTENT_URI = "cyberpulse.contentUri"
    private const val EXTRA_IS_LIVE = "cyberpulse.isLiveStream"
    private const val EXTRA_TRACK_NUMBER = "cyberpulse.trackNumber"
    private const val EXTRA_YEAR = "cyberpulse.year"

    /**
     * Maps CyberPulse Track to Media3 MediaItem.
     * URI is populated strictly when PlaybackSource is legitimate.
     */
    fun toMediaItem(track: Track, source: PlaybackSource = PlaybackSourceResolver.resolveSource(track)): MediaItem {
        val extras = Bundle().apply {
            putString(EXTRA_SOURCE_NAME, track.source.name)
            putString(EXTRA_SOURCE_ID, track.sourceId)
            putLong(EXTRA_DURATION_SEC, track.durationSeconds)
            putString(EXTRA_PLACEHOLDER_KEY, track.placeholderArtworkKey)
            putBoolean(EXTRA_IS_LIKED, track.isLiked)
            putInt(EXTRA_PULSE_SCORE, track.pulseScore)
            putString(EXTRA_CONTENT_URI, track.contentUri)
            putBoolean(EXTRA_IS_LIVE, track.isLiveStream)
            track.trackNumber?.let { putInt(EXTRA_TRACK_NUMBER, it) }
            track.year?.let { putInt(EXTRA_YEAR, it) }
        }

        val metadataBuilder = MediaMetadata.Builder()
            .setTitle(track.title)
            .setDisplayTitle(track.title)
            .setArtist(track.artist)
            .setSubtitle(track.artist)
            .setAlbumTitle(track.album)
            .setExtras(extras)

        if (track.trackNumber != null) {
            metadataBuilder.setTrackNumber(track.trackNumber)
        }
        if (track.year != null) {
            metadataBuilder.setRecordingYear(track.year)
        }

        val artUrl = track.artworkUrl ?: track.artwork?.url
        if (!artUrl.isNullOrBlank()) {
            try {
                metadataBuilder.setArtworkUri(Uri.parse(artUrl))
            } catch (_: Exception) {
                // Ignore invalid uri strings
            }
        }

        val itemMediaUri: Uri? = when (source) {
            is PlaybackSource.DirectUri -> Uri.parse(source.uri)
            is PlaybackSource.LocalUri -> Uri.parse(source.uri)
            is PlaybackSource.RadioStream -> Uri.parse(source.uri)
            is PlaybackSource.ExternalPlayer,
            is PlaybackSource.Unavailable -> null
        }

        val isPlayable = itemMediaUri != null
        metadataBuilder.setIsPlayable(isPlayable)

        val mediaItemBuilder = MediaItem.Builder()
            .setMediaId(track.id)
            .setMediaMetadata(metadataBuilder.build())

        if (itemMediaUri != null) {
            mediaItemBuilder.setUri(itemMediaUri)

            // Resolve explicit stream MIME types for Radio HLS or audio streams
            val uriString = itemMediaUri.toString().lowercase()
            if (track.source == MusicSource.RADIO) {
                if (uriString.contains(".m3u8") || uriString.contains("hls")) {
                    mediaItemBuilder.setMimeType(MimeTypes.APPLICATION_M3U8)
                } else if (uriString.endsWith(".aac")) {
                    mediaItemBuilder.setMimeType(MimeTypes.AUDIO_AAC)
                } else if (uriString.endsWith(".mp3")) {
                    mediaItemBuilder.setMimeType(MimeTypes.AUDIO_MPEG)
                }
            }
        }

        return mediaItemBuilder.build()
    }

    /**
     * Maps Media3 MediaItem back to CyberPulse Track domain model.
     * Respects live stream / ICY metadata updates delivered through MediaMetadata.
     */
    fun toTrack(mediaItem: MediaItem): Track {
        val meta = mediaItem.mediaMetadata
        val extras = meta.extras

        val sourceName = extras?.getString(EXTRA_SOURCE_NAME)
        val musicSource = try {
            if (sourceName != null) MusicSource.valueOf(sourceName) else MusicSource.LOCAL_DEMO
        } catch (_: Exception) {
            MusicSource.LOCAL_DEMO
        }

        val artUrl = meta.artworkUri?.toString()
        val placeholder = extras?.getString(EXTRA_PLACEHOLDER_KEY) ?: if (musicSource == MusicSource.RADIO) "cyber_radio" else "neon_horizon"
        val isLive = extras?.getBoolean(EXTRA_IS_LIVE) ?: (musicSource == MusicSource.RADIO)
        val contentUri = extras?.getString(EXTRA_CONTENT_URI) ?: mediaItem.localConfiguration?.uri?.toString()

        val trackNumber = if (extras?.containsKey(EXTRA_TRACK_NUMBER) == true) {
            extras.getInt(EXTRA_TRACK_NUMBER)
        } else {
            meta.trackNumber
        }

        val year = if (extras?.containsKey(EXTRA_YEAR) == true) {
            extras.getInt(EXTRA_YEAR)
        } else {
            meta.recordingYear
        }

        return Track(
            id = mediaItem.mediaId,
            title = meta.title?.toString() ?: "Unknown Track",
            artist = meta.artist?.toString() ?: "Unknown Artist",
            album = meta.albumTitle?.toString() ?: if (musicSource == MusicSource.RADIO) "Cyber Radio" else "CyberPulse Album",
            artworkUrl = artUrl,
            artwork = Artwork(url = artUrl, placeholderKey = placeholder),
            durationSeconds = if (isLive) 0L else (extras?.getLong(EXTRA_DURATION_SEC) ?: 0L),
            source = musicSource,
            sourceId = extras?.getString(EXTRA_SOURCE_ID) ?: mediaItem.mediaId,
            contentUri = contentUri,
            isLiked = extras?.getBoolean(EXTRA_IS_LIKED) ?: false,
            pulseScore = extras?.getInt(EXTRA_PULSE_SCORE) ?: 85,
            isLiveStream = isLive,
            trackNumber = trackNumber,
            year = year,
            playbackCapability = PlaybackCapability(
                mode = PlaybackMode.SUPPORTED_OFFICIAL,
                supportsLossless = (musicSource == MusicSource.LOCAL),
                supportsOffline = (musicSource == MusicSource.LOCAL)
            )
        )
    }
}

