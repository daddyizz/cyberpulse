package com.daddyizz.cyberpulse.core.lyrics

import com.daddyizz.cyberpulse.core.model.MusicSource
import com.daddyizz.cyberpulse.core.model.Track
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * Authoritative repository coordinating lyrics retrieval, validation,
 * copyright compliance, and in-memory caching.
 */
class LyricsRepository(
    private val localProvider: LyricsProvider,
    private val remoteProvider: LyricsProvider = LicensedRemoteLyricsProvider(),
    private val cache: LyricsCache = LyricsCache()
) {

    suspend fun getLyrics(track: Track): LyricsResult = withContext(Dispatchers.IO) {
        // 1. Check in-memory cache
        val cached = cache.get(track.id)
        if (cached != null) {
            return@withContext LyricsResult.Success(cached)
        }

        // 2. Enforce Source-Aware Legal & Technical Rules

        // Live Cyber Radio: Default unavailable
        if (track.source == MusicSource.RADIO || track.isLiveStream) {
            return@withContext LyricsResult.Unavailable("Lyrics unavailable for live radio.")
        }

        // YouTube Embedded tracks: Captions must not be scraped; unavailable unless licensed provider matches
        if (track.source == MusicSource.YOUTUBE) {
            return@withContext LyricsResult.Unavailable("Lyrics aren't available for this track.")
        }

        // 3. Check Local LRC / Embedded Metadata
        val localResult = localProvider.getLyrics(track)
        if (localResult is LyricsResult.Success) {
            cache.put(localResult.lyrics)
            return@withContext localResult
        }

        // 4. Check Licensed Remote Provider
        val remoteResult = remoteProvider.getLyrics(track)
        if (remoteResult is LyricsResult.Success) {
            cache.put(remoteResult.lyrics)
            return@withContext remoteResult
        }

        // Return clean unavailable state
        return@withContext localResult
    }

    fun getCachedLyrics(trackId: String): Lyrics? {
        return cache.get(trackId)
    }

    fun clearCache() {
        cache.clear()
    }
}
