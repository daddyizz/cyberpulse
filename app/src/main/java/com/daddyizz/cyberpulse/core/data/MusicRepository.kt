package com.daddyizz.cyberpulse.core.data

import android.content.Context
import com.daddyizz.cyberpulse.core.cache.MetadataCache
import com.daddyizz.cyberpulse.core.common.AppResult
import com.daddyizz.cyberpulse.core.model.*
import com.daddyizz.cyberpulse.core.network.CyberPulseNetworkClient
import com.daddyizz.cyberpulse.core.provider.YouTubeMetadataProvider
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * Root Music Repository managing local liked states, recently played history,
 * user-created playlists, discovery catalogs, and specialized repositories.
 */
class MusicRepository(
    val primaryProvider: MusicSourceProvider = YouTubeMetadataProvider(CyberPulseNetworkClient.youtubeService),
    val fallbackProvider: DemoMusicSourceProvider = DemoMusicSourceProvider(),
    val spotifyProvider: MusicSourceProvider = com.daddyizz.cyberpulse.core.provider.SpotifyMetadataProvider(CyberPulseNetworkClient.spotifyService),
    val cache: MetadataCache = MetadataCache(),
    val searchRepository: SearchRepository = SearchRepository(primaryProvider, fallbackProvider, cache, spotifyProvider = spotifyProvider),
    val metadataRepository: MetadataRepository = MetadataRepository(primaryProvider, fallbackProvider, cache),
    context: Context? = null
) {
    private val prefs = context?.getSharedPreferences("cyberpulse_music_prefs", Context.MODE_PRIVATE)

    private val _likedTrackIds: MutableStateFlow<Set<String>>
    val likedTrackIds: StateFlow<Set<String>>

    private val _recentlyPlayed = MutableStateFlow<List<Track>>(emptyList())
    val recentlyPlayed: StateFlow<List<Track>> = _recentlyPlayed.asStateFlow()

    private val _userPlaylists = MutableStateFlow<List<Playlist>>(emptyList())
    val userPlaylists: StateFlow<List<Playlist>> = _userPlaylists.asStateFlow()

    init {
        val savedLikes = prefs?.getStringSet("liked_track_ids", null)
        val initialLikes = savedLikes ?: setOf("trk_01", "trk_03", "trk_05", "trk_07")
        _likedTrackIds = MutableStateFlow(initialLikes)
        likedTrackIds = _likedTrackIds.asStateFlow()

        // Seed initial recently played with demo tracks
        val initialRecent = fallbackProvider.getAllTracks().take(4).map {
            it.copy(isLiked = initialLikes.contains(it.id))
        }
        _recentlyPlayed.value = initialRecent
    }

    fun getAllTracks(): List<Track> {
        val app = try { com.daddyizz.cyberpulse.CyberPulseApplication.instance } catch (_: Exception) { null }
        val localTracks = app?.localMusicProvider?.getTracks() ?: emptyList()
        val radioTracks = com.daddyizz.cyberpulse.core.provider.radio.RadioProvider.STATIONS.map { it.toTrack() }
        val all = fallbackProvider.getAllTracks() + localTracks + radioTracks + _recentlyPlayed.value
        val likes = _likedTrackIds.value
        return all.distinctBy { it.id }.map {
            it.copy(isLiked = likes.contains(it.id))
        }
    }

    fun getLikedTracks(): List<Track> {
        val likes = _likedTrackIds.value
        return getAllTracks().filter { likes.contains(it.id) }.map {
            it.copy(isLiked = true)
        }
    }

    fun getAllPlaylists(): List<Playlist> {
        val demoPlaylists = fallbackProvider.getAllPlaylists()
        return _userPlaylists.value + demoPlaylists
    }

    fun getAllArtists(): List<Artist> = fallbackProvider.getAllArtists()
    fun getAllAlbums(): List<Album> = fallbackProvider.getAllAlbums()

    suspend fun search(query: String): List<Track> {
        val result = searchRepository.search(query, SearchFilter.SONGS)
        return when (result) {
            is AppResult.Success -> {
                result.data.items.mapNotNull { item ->
                    (item as? SearchResultItem.TrackResult)?.track?.copy(
                        isLiked = _likedTrackIds.value.contains(item.track.id)
                    )
                }
            }
            else -> emptyList()
        }
    }

    suspend fun getArtist(id: String): Artist? {
        val res = metadataRepository.getArtist(id)
        return if (res is AppResult.Success) res.data else null
    }

    suspend fun getAlbum(id: String): Album? {
        val res = metadataRepository.getAlbum(id)
        return if (res is AppResult.Success) res.data else null
    }

    suspend fun getPlaylist(id: String): Playlist? {
        // Check user playlists first
        val userPl = _userPlaylists.value.find { it.id == id }
        if (userPl != null) return userPl

        val res = metadataRepository.getPlaylist(id)
        return if (res is AppResult.Success) res.data else null
    }

    fun toggleLike(trackId: String) {
        val current = _likedTrackIds.value.toMutableSet()
        if (current.contains(trackId)) {
            current.remove(trackId)
        } else {
            current.add(trackId)
        }
        _likedTrackIds.value = current
        prefs?.edit()?.putStringSet("liked_track_ids", current)?.apply()

        // Update recently played liked flags
        _recentlyPlayed.value = _recentlyPlayed.value.map {
            if (it.id == trackId) it.copy(isLiked = current.contains(trackId)) else it
        }
    }

    fun isTrackLiked(trackId: String): Boolean {
        return _likedTrackIds.value.contains(trackId)
    }

    /**
     * Records listening history when real playback passes the threshold.
     * Prevents excessive duplicates and maintains top-of-list order.
     */
    fun recordRecentlyPlayed(track: Track) {
        val updatedTrack = track.copy(isLiked = _likedTrackIds.value.contains(track.id))
        val currentList = _recentlyPlayed.value.filterNot { it.id == track.id }.toMutableList()
        currentList.add(0, updatedTrack)
        val trimmed = if (currentList.size > 30) currentList.take(30) else currentList
        _recentlyPlayed.value = trimmed
    }

    /**
     * User Playlists operations
     */
    fun createPlaylist(title: String, description: String = ""): Playlist {
        val newId = "user_pl_${System.currentTimeMillis()}"
        val newPlaylist = Playlist(
            id = newId,
            title = title,
            description = description,
            artworkKey = "night_drive",
            createdBy = "You",
            source = MusicSource.LOCAL_DEMO,
            tracks = emptyList(),
            trackCount = 0
        )
        _userPlaylists.value = listOf(newPlaylist) + _userPlaylists.value
        return newPlaylist
    }

    fun addTrackToPlaylist(playlistId: String, track: Track) {
        val updated = _userPlaylists.value.map { pl ->
            if (pl.id == playlistId) {
                val newTracks = pl.tracks.filterNot { it.id == track.id } + track
                pl.copy(tracks = newTracks, trackCount = newTracks.size)
            } else {
                pl
            }
        }
        _userPlaylists.value = updated
    }

    fun removeTrackFromPlaylist(playlistId: String, trackId: String) {
        val updated = _userPlaylists.value.map { pl ->
            if (pl.id == playlistId) {
                val newTracks = pl.tracks.filterNot { it.id == trackId }
                pl.copy(tracks = newTracks, trackCount = newTracks.size)
            } else {
                pl
            }
        }
        _userPlaylists.value = updated
    }
}
