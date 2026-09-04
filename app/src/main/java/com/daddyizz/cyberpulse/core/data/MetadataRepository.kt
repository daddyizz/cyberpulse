package com.daddyizz.cyberpulse.core.data

import com.daddyizz.cyberpulse.core.cache.MetadataCache
import com.daddyizz.cyberpulse.core.common.AppResult
import com.daddyizz.cyberpulse.core.model.*

/**
 * Repository for fetching and caching detailed Artist, Album, and Playlist metadata.
 */
class MetadataRepository(
    private val primaryProvider: MusicSourceProvider,
    private val fallbackProvider: MusicSourceProvider = DemoMusicSourceProvider(),
    private val cache: MetadataCache = MetadataCache()
) {

    suspend fun getArtist(id: String): AppResult<Artist?> {
        val cached = cache.getArtist(id)
        if (cached != null) return AppResult.Success(cached)

        val result = primaryProvider.getArtist(id)
        if (result is AppResult.Success && result.data != null) {
            cache.putArtist(id, result.data)
            return result
        }

        // Fallback to local demo provider
        val fallback = fallbackProvider.getArtist(id)
        if (fallback is AppResult.Success && fallback.data != null) {
            cache.putArtist(id, fallback.data)
            return fallback
        }
        return result
    }

    suspend fun getAlbum(id: String): AppResult<Album?> {
        val cached = cache.getAlbum(id)
        if (cached != null) return AppResult.Success(cached)

        val result = primaryProvider.getAlbum(id)
        if (result is AppResult.Success && result.data != null) {
            cache.putAlbum(id, result.data)
            return result
        }

        val fallback = fallbackProvider.getAlbum(id)
        if (fallback is AppResult.Success && fallback.data != null) {
            cache.putAlbum(id, fallback.data)
            return fallback
        }
        return result
    }

    suspend fun getPlaylist(id: String): AppResult<Playlist?> {
        val cached = cache.getPlaylist(id)
        if (cached != null) return AppResult.Success(cached)

        val result = primaryProvider.getPlaylist(id)
        if (result is AppResult.Success && result.data != null) {
            cache.putPlaylist(id, result.data)
            return result
        }

        val fallback = fallbackProvider.getPlaylist(id)
        if (fallback is AppResult.Success && fallback.data != null) {
            cache.putPlaylist(id, fallback.data)
            return fallback
        }
        return result
    }

    suspend fun getArtistTopTracks(artistId: String): AppResult<List<Track>> {
        val res = primaryProvider.getArtistTopTracks(artistId)
        if (res is AppResult.Success && res.data.isNotEmpty()) return res
        return fallbackProvider.getArtistTopTracks(artistId)
    }

    suspend fun getArtistAlbums(artistId: String): AppResult<List<Album>> {
        val res = primaryProvider.getArtistAlbums(artistId)
        if (res is AppResult.Success && res.data.isNotEmpty()) return res
        return fallbackProvider.getArtistAlbums(artistId)
    }

    suspend fun getRelatedTracks(trackId: String): AppResult<List<Track>> {
        val res = primaryProvider.getRelatedTracks(trackId)
        if (res is AppResult.Success && res.data.isNotEmpty()) return res
        return fallbackProvider.getRelatedTracks(trackId)
    }
}
