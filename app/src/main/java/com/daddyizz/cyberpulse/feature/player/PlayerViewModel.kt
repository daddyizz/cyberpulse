package com.daddyizz.cyberpulse.feature.player

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.daddyizz.cyberpulse.CyberPulseApplication
import com.daddyizz.cyberpulse.core.data.MusicRepository
import com.daddyizz.cyberpulse.core.lyrics.LyricsRepository
import com.daddyizz.cyberpulse.core.lyrics.LyricsResult
import com.daddyizz.cyberpulse.core.model.Track
import com.daddyizz.cyberpulse.core.player.ConnectionState
import com.daddyizz.cyberpulse.core.player.PlaybackCapability
import com.daddyizz.cyberpulse.core.player.PlaybackConnection
import com.daddyizz.cyberpulse.core.player.PlaybackError
import com.daddyizz.cyberpulse.core.player.PlaybackSourceResolver
import com.daddyizz.cyberpulse.core.visualizer.VisualizerController
import com.daddyizz.cyberpulse.core.visualizer.VisualizerMode
import com.daddyizz.cyberpulse.core.visualizer.VisualizerState
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

enum class NowPlayingMode {
    ARTWORK,
    VISUALIZER,
    LYRICS
}

data class PlayerUiState(
    val currentTrack: Track? = null,
    val isPlaying: Boolean = false,
    val isShuffleEnabled: Boolean = false,
    val isRepeatEnabled: Boolean = false,
    val repeatMode: Int = 0,
    val currentPositionSeconds: Long = 0L,
    val durationSeconds: Long = 0L,
    val bufferedPositionSeconds: Long = 0L,
    val progressFraction: Float = 0f,
    val isBuffering: Boolean = false,
    val queue: List<Track> = emptyList(),
    val currentQueueIndex: Int = -1,
    val playbackError: PlaybackError? = null,
    val connectionState: ConnectionState = ConnectionState.DISCONNECTED,
    val capabilityNotice: String? = null,
    val snackbarMessage: String? = null,
    val isLyricsExpanded: Boolean = false,
    val isQueueExpanded: Boolean = false,
    val selectedTrackForMenu: Track? = null,
    val activePlayerMode: NowPlayingMode = NowPlayingMode.ARTWORK,
    val lyricsResult: LyricsResult? = null,
    val visualizerState: VisualizerState = VisualizerState(),
    val isVisualizerFullScreen: Boolean = false
)

class PlayerViewModel(
    private val musicRepository: MusicRepository,
    private val playbackConnection: PlaybackConnection,
    private val lyricsRepository: LyricsRepository = try { CyberPulseApplication.instance.lyricsRepository } catch (_: Exception) { LyricsRepository(com.daddyizz.cyberpulse.core.lyrics.LocalLrcLyricsProvider()) },
    private val visualizerController: VisualizerController? = try { CyberPulseApplication.instance.visualizerController } catch (_: Exception) { null }
) : ViewModel() {

    private val _uiState = MutableStateFlow(PlayerUiState())
    val uiState: StateFlow<PlayerUiState> = _uiState.asStateFlow()

    private var lastLoggedTrackId: String? = null

    init {
        // Collect real Media3 state
        viewModelScope.launch {
            playbackConnection.playbackState.collect { pbState ->
                val track = pbState.currentTrack ?: _uiState.value.currentTrack
                val totalSec = if (pbState.durationMs > 0) {
                    pbState.durationMs / 1000L
                } else {
                    track?.durationSeconds ?: 0L
                }
                val posSec = pbState.positionMs / 1000L
                val fraction = if (totalSec > 0) {
                    (posSec.toFloat() / totalSec.toFloat()).coerceIn(0f, 1f)
                } else {
                    0f
                }

                // Threshold tracking: log Recently Played after 5 seconds of real playback
                if (pbState.isPlaying && posSec >= 5L && pbState.currentTrack != null) {
                    if (lastLoggedTrackId != pbState.currentTrack.id) {
                        lastLoggedTrackId = pbState.currentTrack.id
                        musicRepository.recordRecentlyPlayed(pbState.currentTrack)
                    }
                } else if (pbState.currentTrack != null && pbState.currentTrack.id != lastLoggedTrackId && posSec < 5L) {
                    // Reset if a new track starts
                }

                // Block 9A: Lyrics & Visualizer track synchronization
                if (pbState.currentTrack?.id != _uiState.value.currentTrack?.id) {
                    val newTrack = pbState.currentTrack
                    visualizerController?.onPlaybackTrackChanged(newTrack, pbState.audioSessionId)
                    if (newTrack != null) {
                        loadLyrics(newTrack)
                    } else {
                        _uiState.update { it.copy(lyricsResult = null) }
                    }
                }

                if (pbState.isPlaying != _uiState.value.isPlaying) {
                    visualizerController?.onIsPlayingChanged(pbState.isPlaying)
                }

                _uiState.update { current ->
                    current.copy(
                        currentTrack = pbState.currentTrack,
                        isPlaying = pbState.isPlaying,
                        isShuffleEnabled = pbState.shuffleEnabled,
                        isRepeatEnabled = pbState.repeatMode != 0,
                        repeatMode = pbState.repeatMode,
                        currentPositionSeconds = posSec,
                        durationSeconds = totalSec,
                        bufferedPositionSeconds = pbState.bufferedPositionMs / 1000L,
                        progressFraction = fraction,
                        isBuffering = pbState.isBuffering,
                        queue = pbState.queue,
                        currentQueueIndex = pbState.currentQueueIndex,
                        playbackError = pbState.error,
                        connectionState = pbState.connectionState
                    )
                }
            }
        }

        // Collect visualizer state from controller
        if (visualizerController != null) {
            viewModelScope.launch {
                visualizerController.state.collect { vState ->
                    _uiState.update { it.copy(visualizerState = vState) }
                }
            }
        }

        // Sync liked songs updates to current track in player
        viewModelScope.launch {
            musicRepository.likedTrackIds.collect { likes ->
                _uiState.update { state ->
                    val curr = state.currentTrack
                    if (curr != null) {
                        state.copy(currentTrack = curr.copy(isLiked = likes.contains(curr.id)))
                    } else state
                }
            }
        }
    }

    /**
     * Enforces source capability before dispatching to ExoPlayer session.
     */
    fun selectTrack(track: Track, queue: List<Track> = listOf(track)) {
        when (PlaybackSourceResolver.getCapability(track)) {
            PlaybackCapability.SUPPORTED_OFFICIAL -> {
                clearCapabilityNotice()
                playbackConnection.playTrack(track, queue)
            }
            PlaybackCapability.EXTERNAL_PLAYER -> {
                _uiState.update {
                    it.copy(
                        capabilityNotice = "This YouTube item requires external playback. CyberPulse does not extract unauthorized audio streams from YouTube."
                    )
                }
            }
            PlaybackCapability.UNAVAILABLE,
            PlaybackCapability.UNKNOWN -> {
                _uiState.update {
                    it.copy(
                        capabilityNotice = "“${track.title}” cannot be played directly in CyberPulse."
                    )
                }
            }
        }
    }

    fun playQueue(queue: List<Track>, startIndex: Int = 0) {
        val playable = queue.filter { PlaybackSourceResolver.getCapability(it) == PlaybackCapability.SUPPORTED_OFFICIAL }
        if (playable.isEmpty()) {
            showSnackbar("No playable tracks in this collection.")
            return
        }
        clearCapabilityNotice()
        playbackConnection.playQueue(playable, startIndex.coerceIn(0, playable.size - 1))
    }

    fun playNext(track: Track) {
        when (PlaybackSourceResolver.getCapability(track)) {
            PlaybackCapability.SUPPORTED_OFFICIAL -> {
                playbackConnection.playNext(track)
                showSnackbar("Playing “${track.title}” next")
            }
            PlaybackCapability.EXTERNAL_PLAYER -> {
                showSnackbar("Direct playback unavailable for this source.")
            }
            else -> {
                showSnackbar("“${track.title}” cannot be queued.")
            }
        }
    }

    fun addToQueue(track: Track) {
        when (PlaybackSourceResolver.getCapability(track)) {
            PlaybackCapability.SUPPORTED_OFFICIAL -> {
                playbackConnection.addToQueue(track)
                showSnackbar("Added “${track.title}” to queue")
            }
            PlaybackCapability.EXTERNAL_PLAYER -> {
                showSnackbar("Direct playback unavailable for this source.")
            }
            else -> {
                showSnackbar("“${track.title}” cannot be queued.")
            }
        }
    }

    fun seekToQueueIndex(index: Int) {
        playbackConnection.seekToQueueItem(index)
    }

    fun togglePlayPause() {
        if (_uiState.value.currentTrack == null) return
        playbackConnection.togglePlayPause()
    }

    fun seekTo(seconds: Long) {
        playbackConnection.seekTo(seconds * 1000L)
    }

    fun seekToFraction(fraction: Float) {
        val totalSec = _uiState.value.durationSeconds
        if (totalSec > 0) {
            val targetSec = (fraction * totalSec).toLong()
            seekTo(targetSec)
        }
    }

    fun skipNext() {
        playbackConnection.skipNext()
    }

    fun skipPrevious() {
        playbackConnection.skipPrevious()
    }

    fun toggleShuffle() {
        playbackConnection.toggleShuffle()
    }

    fun toggleRepeat() {
        playbackConnection.cycleRepeatMode()
    }

    fun toggleFavorite(track: Track? = _uiState.value.currentTrack) {
        val target = track ?: return
        musicRepository.toggleLike(target.id)
        val isNowLiked = !musicRepository.isTrackLiked(target.id)
        showSnackbar(if (isNowLiked) "Added to Liked Songs" else "Removed from Liked Songs")
    }

    fun removeFromQueue(index: Int) {
        playbackConnection.removeQueueItem(index)
        showSnackbar("Removed track from queue")
    }

    fun moveQueueItem(fromIndex: Int, toIndex: Int) {
        playbackConnection.moveQueueItem(fromIndex, toIndex)
    }

    fun clearQueue() {
        playbackConnection.clearQueue()
        showSnackbar("Queue cleared")
    }

    fun clearUpcomingQueue() {
        playbackConnection.clearUpcomingQueue()
        showSnackbar("Upcoming queue cleared")
    }

    fun openTrackMenu(track: Track) {
        _uiState.update { it.copy(selectedTrackForMenu = track) }
    }

    fun closeTrackMenu() {
        _uiState.update { it.copy(selectedTrackForMenu = null) }
    }

    fun showSnackbar(message: String) {
        _uiState.update { it.copy(snackbarMessage = message) }
    }

    fun dismissSnackbar() {
        _uiState.update { it.copy(snackbarMessage = null) }
    }

    fun toggleLyrics() {
        _uiState.update { it.copy(isLyricsExpanded = !it.isLyricsExpanded) }
    }

    fun toggleQueue() {
        _uiState.update { it.copy(isQueueExpanded = !it.isQueueExpanded) }
    }

    fun clearCapabilityNotice() {
        _uiState.update { it.copy(capabilityNotice = null) }
    }

    fun dismissError() {
        _uiState.update { it.copy(playbackError = null) }
    }

    fun loadLyrics(track: Track) {
        viewModelScope.launch {
            _uiState.update { it.copy(lyricsResult = null) }
            val result = lyricsRepository.getLyrics(track)
            _uiState.update { it.copy(lyricsResult = result) }
        }
    }

    fun setPlayerMode(mode: NowPlayingMode) {
        _uiState.update { it.copy(activePlayerMode = mode) }
    }

    fun selectVisualizerMode(mode: VisualizerMode) {
        visualizerController?.selectMode(mode)
    }

    fun toggleVisualizerFullScreen() {
        _uiState.update { it.copy(isVisualizerFullScreen = !it.isVisualizerFullScreen) }
    }

    fun seekToLyricMs(timestampMs: Long) {
        seekTo(timestampMs / 1000L)
    }
}
