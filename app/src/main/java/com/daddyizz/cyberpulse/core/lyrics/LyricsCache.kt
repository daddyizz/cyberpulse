package com.daddyizz.cyberpulse.core.lyrics

import java.util.concurrent.ConcurrentHashMap

/**
 * Thread-safe cache for parsed lyrics with TTL policy.
 * Respects provider terms regarding temporary caching.
 */
class LyricsCache(
    private val ttlMillis: Long = DEFAULT_TTL_MS,
    private val maxEntries: Int = 100
) {

    private data class CacheEntry(
        val lyrics: Lyrics,
        val timestamp: Long
    )

    private val cache = ConcurrentHashMap<String, CacheEntry>()

    fun get(trackId: String): Lyrics? {
        val entry = cache[trackId] ?: return null
        val now = System.currentTimeMillis()
        if (now - entry.timestamp > ttlMillis) {
            cache.remove(trackId)
            return null
        }
        return entry.lyrics
    }

    fun put(lyrics: Lyrics) {
        // Enforce max entry capacity
        if (cache.size >= maxEntries) {
            val oldestKey = cache.entries.minByOrNull { it.value.timestamp }?.key
            if (oldestKey != null) {
                cache.remove(oldestKey)
            }
        }
        cache[lyrics.trackId] = CacheEntry(lyrics, System.currentTimeMillis())
    }

    fun remove(trackId: String) {
        cache.remove(trackId)
    }

    fun clear() {
        cache.clear()
    }

    val size: Int get() = cache.size

    companion object {
        const val DEFAULT_TTL_MS = 24 * 60 * 60 * 1000L // 24 hours
    }
}
