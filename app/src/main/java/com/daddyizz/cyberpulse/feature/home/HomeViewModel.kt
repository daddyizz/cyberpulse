package com.daddyizz.cyberpulse.feature.home

import androidx.lifecycle.ViewModel
import com.daddyizz.cyberpulse.core.data.MusicRepository
import com.daddyizz.cyberpulse.core.model.Artist
import com.daddyizz.cyberpulse.core.model.Playlist
import com.daddyizz.cyberpulse.core.model.Track
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.util.Calendar

data class HomeUiState(
    val greeting: String = "Good Evening",
    val recentlyPlayed: List<Track> = emptyList(),
    val madeForYou: List<Playlist> = emptyList(),
    val trendingNow: List<Track> = emptyList(),
    val newReleases: List<Track> = emptyList(),
    val yourMixes: List<Playlist> = emptyList(),
    val popularArtists: List<Artist> = emptyList()
)

class HomeViewModel(
    private val musicRepository: MusicRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(HomeUiState())
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    init {
        loadHomeData()
    }

    fun loadHomeData() {
        val hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
        val greeting = when (hour) {
            in 4..11 -> "Good Morning"
            in 12..16 -> "Good Afternoon"
            else -> "Good Evening"
        }

        val allTracks = musicRepository.getAllTracks()
        val allPlaylists = musicRepository.getAllPlaylists()
        val allArtists = musicRepository.getAllArtists()

        _uiState.value = HomeUiState(
            greeting = greeting,
            recentlyPlayed = allTracks.take(5),
            madeForYou = allPlaylists.take(4),
            trendingNow = allTracks.reversed(),
            newReleases = allTracks.shuffled(),
            yourMixes = allPlaylists,
            popularArtists = allArtists
        )
    }

    fun toggleTrackLike(trackId: String) {
        musicRepository.toggleLike(trackId)
        loadHomeData()
    }
}
