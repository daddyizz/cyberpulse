package com.daddyizz.cyberpulse.core.recommendation

import com.daddyizz.cyberpulse.core.data.MusicRepository
import com.daddyizz.cyberpulse.core.model.MusicSource
import com.daddyizz.cyberpulse.core.model.PlaybackMode
import com.daddyizz.cyberpulse.core.model.Track
import com.daddyizz.cyberpulse.core.player.CyberPulseTestMedia
import com.daddyizz.cyberpulse.core.player.PlaybackSourceResolver
import com.daddyizz.cyberpulse.core.provider.local.LocalMusicProvider
import com.daddyizz.cyberpulse.core.provider.radio.RadioProvider

/**
 * CyberPulse Query Planner & Source Resolver.
 *
 * Translates structured PlaylistIntent or DjSessionPlan into concrete search queries
 * executed against actual available music providers.
 *
 * CRITICAL MONETIZATION & MEDIA COMPLIANCE INVARIANTS:
 * 1. AI never invents tracks. Every candidate must originate from a verified provider.
 * 2. In PLAYABLE_NOW mode (Android Auto, background, standard phone playback), tracks MUST be
 *    directly playable via Media3. YouTube embedded items (YOUTUBE_EMBEDDED) are strictly excluded.
 * 3. In DISCOVERY mode (phone only), YouTube metadata items may be included for exploration.
 */
class QueryPlanner(
    private val musicRepository: MusicRepository,
    private val localMusicProvider: LocalMusicProvider? = null
) {

    /**
     * Resolves playable candidate tracks matching a PlaylistIntent.
     */
    suspend fun resolveIntentCandidates(
        intent: PlaylistIntent,
        resolutionMode: PlaylistResolutionMode
    ): List<Track> {
        val candidates = mutableListOf<Track>()

        // 1. Gather all local on-device tracks
        val localTracks = try {
            localMusicProvider?.getTracks() ?: emptyList()
        } catch (_: Exception) {
            emptyList()
        }
        candidates.addAll(localTracks)

        // 2. Gather verified test media and demo catalog
        candidates.addAll(CyberPulseTestMedia.ALL_TEST_TRACKS)
        candidates.addAll(musicRepository.fallbackProvider.getAllTracks())

        // 3. Gather Cyber Radio stations (station-based pulse)
        val radioTracks = RadioProvider.STATIONS.map { it.toTrack() }
        candidates.addAll(radioTracks)

        // 4. In DISCOVERY mode, search YouTube metadata for primary genres or artists
        if (resolutionMode == PlaylistResolutionMode.DISCOVERY) {
            val searchQueries = (intent.genres.take(2) + intent.artists.take(2) + intent.moods.take(1)).distinct()
            for (query in searchQueries) {
                if (query.isNotBlank()) {
                    try {
                        val results = musicRepository.search(query)
                        candidates.addAll(results.take(6))
                    } catch (_: Exception) {
                        // Fail gracefully on network search errors
                    }
                }
            }
        }

        // Apply strict source playability rules
        val filteredByPlayability = candidates.filter { track ->
            isPermittedForResolutionMode(track, resolutionMode)
        }

        // Exclude artists specified in excludedArtists
        val excludedLower = intent.excludedArtists.map { it.lowercase().trim() }
        val finalCandidates = filteredByPlayability.filterNot { track ->
            excludedLower.any { ex -> track.artist.lowercase().contains(ex) }
        }

        return deduplicateCandidates(finalCandidates)
    }

    /**
     * Resolves candidates for a Cyber DJ session mode.
     */
    suspend fun resolveDjCandidates(
        plan: DjSessionPlan,
        resolutionMode: PlaylistResolutionMode = PlaylistResolutionMode.PLAYABLE_NOW
    ): List<Track> {
        val candidates = mutableListOf<Track>()

        val localTracks = try {
            localMusicProvider?.getTracks() ?: emptyList()
        } catch (_: Exception) {
            emptyList()
        }
        candidates.addAll(localTracks)
        candidates.addAll(CyberPulseTestMedia.ALL_TEST_TRACKS)
        candidates.addAll(musicRepository.fallbackProvider.getAllTracks())

        // Add matching radio stations
        val matchingRadio = when (plan.mode) {
            CyberDjMode.DRIVE, CyberDjMode.PARTY, CyberDjMode.WORKOUT ->
                RadioProvider.STATIONS.filter { it.genre?.contains("Electronic", ignoreCase = true) == true || it.genre?.contains("Dance", ignoreCase = true) == true }
            CyberDjMode.CHILL, CyberDjMode.SLEEP, CyberDjMode.FOCUS ->
                RadioProvider.STATIONS.filter { it.genre?.contains("Chill", ignoreCase = true) == true || it.genre?.contains("Ambient", ignoreCase = true) == true }
            CyberDjMode.THROWBACK ->
                RadioProvider.STATIONS.filter { it.genre?.contains("Retro", ignoreCase = true) == true || it.genre?.contains("80s", ignoreCase = true) == true }
            else -> RadioProvider.STATIONS
        }
        candidates.addAll(matchingRadio.map { it.toTrack() })

        val playabilityFiltered = candidates.filter { isPermittedForResolutionMode(it, resolutionMode) }
        return deduplicateCandidates(playabilityFiltered)
    }

    /**
     * Checks playability compliance based on resolution mode.
     */
    fun isPermittedForResolutionMode(track: Track, mode: PlaylistResolutionMode): Boolean {
        if (!track.isAvailable) return false

        return when (mode) {
            PlaylistResolutionMode.PLAYABLE_NOW -> {
                // Must be directly playable via Android Media3 (local, demo URI, or radio stream)
                val source = PlaybackSourceResolver.resolveSource(track)
                val isMedia3Playable = source.supportsMedia3Direct()
                val isNotYouTubeEmbed = track.playbackCapability.mode != PlaybackMode.EXTERNAL_PLAYER &&
                        track.playbackCapability.mode != PlaybackMode.UNAVAILABLE
                isMedia3Playable && isNotYouTubeEmbed
            }
            PlaylistResolutionMode.DISCOVERY -> {
                // Allows YouTube visual metadata alongside playable audio
                true
            }
        }
    }

    /**
     * Deduplicates tracks based on normalized title and artist.
     * Preserves distinct live, remix, instrumental, and acoustic versions.
     */
    fun deduplicateCandidates(tracks: List<Track>): List<Track> {
        val seenSignatures = mutableSetOf<String>()
        val result = mutableListOf<Track>()

        for (track in tracks) {
            val sig = computeTrackSignature(track)
            if (seenSignatures.add(sig)) {
                result.add(track)
            }
        }
        return result
    }

    private fun computeTrackSignature(track: Track): String {
        val normTitle = track.title.lowercase()
            .replace(Regex("[^a-z0-9]"), "")
            .trim()
        val normArtist = track.artist.lowercase()
            .replace(Regex("[^a-z0-9]"), "")
            .trim()

        // Distinguish special versions
        val isRemix = track.title.contains("remix", ignoreCase = true)
        val isLive = track.title.contains("live", ignoreCase = true)
        val isAcoustic = track.title.contains("acoustic", ignoreCase = true)
        val versionTag = when {
            isRemix -> "_remix"
            isLive -> "_live"
            isAcoustic -> "_acoustic"
            else -> ""
        }

        return "${normTitle}_${normArtist}${versionTag}"
    }

    /**
     * Analyzes source composition for a list of resolved tracks.
     */
    fun computeComposition(tracks: List<Track>): SourceComposition {
        var local = 0
        var radio = 0
        var demo = 0
        var disc = 0

        for (t in tracks) {
            when (t.source) {
                MusicSource.LOCAL -> local++
                MusicSource.RADIO -> radio++
                MusicSource.DEMO, MusicSource.LOCAL_DEMO -> demo++
                MusicSource.YOUTUBE -> disc++
            }
        }
        return SourceComposition(local, radio, demo, disc)
    }
}
