package com.daddyizz.cyberpulse.core.model

import com.daddyizz.cyberpulse.core.common.AppResult

/**
 * Production-ready source adapter abstraction for music metadata providers.
 * Decouples the UI and repository layers from specific upstream APIs
 * (YouTube Data API, CyberPulse backend proxy, Spotify, local files, etc.).
 */
interface MusicSourceProvider {
    val providerName: String
    val providerSource: MusicSource

    /**
     * Search for tracks, artists, albums, or playlists matching the query and filter.
     */
    suspend fun search(
        query: String,
        filter: SearchFilter = SearchFilter.ALL,
        pageToken: String? = null
    ): AppResult<SearchResultPage>

    suspend fun getTrack(id: String): AppResult<Track?>
    suspend fun getArtist(id: String): AppResult<Artist?>
    suspend fun getAlbum(id: String): AppResult<Album?>
    suspend fun getPlaylist(id: String): AppResult<Playlist?>
    suspend fun getArtistTopTracks(id: String): AppResult<List<Track>>
    suspend fun getArtistAlbums(id: String): AppResult<List<Album>>
    suspend fun getRelatedTracks(id: String): AppResult<List<Track>>

    /**
     * Inspect playback capability without attempting unauthorized extraction.
     */
    fun getPlaybackCapability(track: Track): PlaybackCapability
}
