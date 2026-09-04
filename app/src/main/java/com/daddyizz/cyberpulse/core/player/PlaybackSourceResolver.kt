package com.daddyizz.cyberpulse.core.player

import com.daddyizz.cyberpulse.core.model.MusicSource
import com.daddyizz.cyberpulse.core.model.Track

/**
 * PlaybackSourceResolver
 *
 * Authoritative component determining whether CyberPulse has an approved,
 * legally permitted playable source for a given Track.
 *
 * CRITICAL COMPLIANCE NOTICE:
 * YouTube tracks are metadata/discovery entities only in Block 3A.
 * Under no circumstances does this resolver convert YouTube IDs, watch URLs,
 * or API responses into extracted audio stream URIs.
 */
object PlaybackSourceResolver {

    /**
     * Resolves a Track to its legitimate PlaybackSource.
     */
    fun resolveSource(track: Track): PlaybackSource {
        // 1. CyberPulse Test Media Catalog
        val testUri = CyberPulseTestMedia.getTestStreamUri(track.id)
        if (testUri != null) {
            return PlaybackSource.DirectUri(testUri)
        }

        // 2. Music Source Provider routing
        return when (track.source) {
            MusicSource.DEMO,
            MusicSource.LOCAL_DEMO,
            MusicSource.CYBERPULSE_TEST -> {
                // If demo track has an associated test stream or local fixture
                val demoStream = CyberPulseTestMedia.getTestStreamUri(track.id)
                if (demoStream != null) {
                    PlaybackSource.DirectUri(demoStream)
                } else {
                    // Fallback to sample test stream 1 for catalog demonstration tracks
                    val defaultSample = CyberPulseTestMedia.getTestStreamUri("cp_test_01")
                    if (defaultSample != null) {
                        PlaybackSource.DirectUri(defaultSample)
                    } else {
                        PlaybackSource.Unavailable
                    }
                }
            }

            MusicSource.LOCAL,
            MusicSource.LOCAL_STORAGE -> {
                val uri = track.contentUri ?: track.sourceId
                if (uri.isNotBlank()) {
                    PlaybackSource.LocalUri(uri)
                } else {
                    PlaybackSource.Unavailable
                }
            }

            MusicSource.RADIO -> {
                val uri = track.contentUri ?: track.sourceId
                if (uri.isNotBlank()) {
                    PlaybackSource.RadioStream(uri)
                } else {
                    PlaybackSource.Unavailable
                }
            }

            MusicSource.YOUTUBE -> {
                // Critical compliance: YouTube content uses Block 4 embedded player.
                // It NEVER resolves into DirectUri, LocalUri, or RadioStream.
                PlaybackSource.ExternalPlayer
            }

            MusicSource.OTHER -> {
                PlaybackSource.Unavailable
            }
        }
    }

    /**
     * Evaluates playback capability without initiating playback.
     */
    fun getCapability(track: Track): PlaybackCapability {
        return when (val source = resolveSource(track)) {
            is PlaybackSource.DirectUri,
            is PlaybackSource.LocalUri,
            is PlaybackSource.RadioStream -> PlaybackCapability.SUPPORTED_OFFICIAL

            is PlaybackSource.ExternalPlayer -> PlaybackCapability.EXTERNAL_PLAYER
            is PlaybackSource.Unavailable -> PlaybackCapability.UNAVAILABLE
        }
    }

    /**
     * Returns true if track is playable directly by CyberPulse's ExoPlayer session.
     */
    fun isDirectlyPlayable(track: Track): Boolean {
        return getCapability(track) == PlaybackCapability.SUPPORTED_OFFICIAL
    }
}
