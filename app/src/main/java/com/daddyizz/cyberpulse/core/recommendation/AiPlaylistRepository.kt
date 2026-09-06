package com.daddyizz.cyberpulse.core.recommendation

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update

/**
 * In-memory & session repository tracking recently generated AI Playlists.
 */
class AiPlaylistRepository {

    private val _recentGeneratedPlaylists = MutableStateFlow<List<ResolvedPlaylist>>(emptyList())
    val recentGeneratedPlaylists: StateFlow<List<ResolvedPlaylist>> = _recentGeneratedPlaylists.asStateFlow()

    fun recordGeneratedPlaylist(playlist: ResolvedPlaylist) {
        _recentGeneratedPlaylists.update { current ->
            val filtered = current.filterNot { it.id == playlist.id }
            (listOf(playlist) + filtered).take(20)
        }
    }

    fun removeGeneratedPlaylist(id: String) {
        _recentGeneratedPlaylists.update { current ->
            current.filterNot { it.id == id }
        }
    }

    fun clearHistory() {
        _recentGeneratedPlaylists.value = emptyList()
    }
}
