package com.daddyizz.cyberpulse.core.cache

import com.daddyizz.cyberpulse.core.model.*
import java.util.concurrent.ConcurrentHashMap

/**
 * High-performance, thread-safe metadata cache with TTL (Time-To-Live).
 * Prevents redundant network calls, respects API quotas, and enables graceful offline degradation.
 */
class MetadataCache {

    data class CacheEntry<T>(
        val data: T,
        val timestamp: Long,
        val ttlMillis: Long
    ) {
        val isExpired: Boolean
            get() = System.currentTimeMillis() - timestamp > ttlMillis
    }

    companion object {
        const val SEARCH_TTL_MILLIS = 2 * 60 * 60 * 1000L      // 2 hours
        const val TRACK_TTL_MILLIS = 24 * 60 * 60 * 1000L      // 24 hours
        const val ARTIST_TTL_MILLIS = 24 * 60 * 60 * 1000L     // 24 hours
        const val ALBUM_TTL_MILLIS = 24 * 60 * 60 * 1000L      // 24 hours
        const val PLAYLIST_TTL_MILLIS = 24 * 60 * 60 * 1000L   // 24 hours
    }

    private val searchCache = ConcurrentHashMap<String, CacheEntry<SearchResultPage>>()
    private val trackCache = ConcurrentHashMap<String, CacheEntry<Track>>()
    private val artistCache = ConcurrentHashMap<String, CacheEntry<Artist>>()
    private val albumCache = ConcurrentHashMap<String, CacheEntry<Album>>()
    private val playlistCache = ConcurrentHashMap<String, CacheEntry<Playlist>>()

    fun putSearch(key: String, result: SearchResultPage) {
        searchCache[key.lowercase().trim()] = CacheEntry(result, System.currentTimeMillis(), SEARCH_TTL_MILLIS)
        // Also seed individual entity caches from search results
        result.items.forEach { item ->
            when (item) {
                is SearchResultItem.TrackResult -> putTrack(item.track.id, item.track)
                is SearchResultItem.ArtistResult -> putArtist(item.artist.id, item.artist)
                is SearchResultItem.AlbumResult -> putAlbum(item.album.id, item.album)
                is SearchResultItem.PlaylistResult -> putPlaylist(item.playlist.id, item.playlist)
            }
        }
    }

    fun getSearch(key: String, allowExpired: Boolean = false): SearchResultPage? {
        val entry = searchCache[key.lowercase().trim()] ?: return null
        if (!allowExpired && entry.isExpired) {
            searchCache.remove(key.lowercase().trim())
            return null
        }
        return entry.data.copy(isFromCache = true)
    }

    fun putTrack(id: String, track: Track) {
        trackCache[id] = CacheEntry(track, System.currentTimeMillis(), TRACK_TTL_MILLIS)
    }

    fun getTrack(id: String, allowExpired: Boolean = false): Track? {
        val entry = trackCache[id] ?: return null
        if (!allowExpired && entry.isExpired) return null
        return entry.data
    }

    fun putArtist(id: String, artist: Artist) {
        artistCache[id] = CacheEntry(artist, System.currentTimeMillis(), ARTIST_TTL_MILLIS)
    }

    fun getArtist(id: String, allowExpired: Boolean = false): Artist? {
        val entry = artistCache[id] ?: return null
        if (!allowExpired && entry.isExpired) return null
        return entry.data
    }

    fun putAlbum(id: String, album: Album) {
        albumCache[id] = CacheEntry(album, System.currentTimeMillis(), ALBUM_TTL_MILLIS)
    }

    fun getAlbum(id: String, allowExpired: Boolean = false): Album? {
        val entry = albumCache[id] ?: return null
        if (!allowExpired && entry.isExpired) return null
        return entry.data
    }

    fun putPlaylist(id: String, playlist: Playlist) {
        playlistCache[id] = CacheEntry(playlist, System.currentTimeMillis(), PLAYLIST_TTL_MILLIS)
    }

    fun getPlaylist(id: String, allowExpired: Boolean = false): Playlist? {
        val entry = playlistCache[id] ?: return null
        if (!allowExpired && entry.isExpired) return null
        return entry.data
    }

    fun clearAll() {
        searchCache.clear()
        trackCache.clear()
        artistCache.clear()
        albumCache.clear()
        playlistCache.clear()
    }
}
