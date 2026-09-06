package com.daddyizz.cyberpulse.core.player

import android.content.ComponentName
import android.content.Context
import androidx.core.content.ContextCompat
import androidx.media3.common.MediaItem
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.common.Timeline
import androidx.media3.session.MediaController
import androidx.media3.session.SessionToken
import com.daddyizz.cyberpulse.core.model.Track
import com.google.common.util.concurrent.ListenableFuture
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

/**
 * PlaybackConnection
 *
 * Coordinates UI communication with CyberPulsePlaybackService via MediaController.
 * Maintains an immutable StateFlow of PlaybackState and provides high-level player commands.
 */
class PlaybackConnection private constructor(private val appContext: Context) {

    private val scope = CoroutineScope(Dispatchers.Main + Job())
    private var controllerFuture: ListenableFuture<MediaController>? = null
    private var mediaController: MediaController? = null
    private var progressPollingJob: Job? = null

    private val recoveryStore = PlaybackRecoveryStore(appContext)
    private val recoveryPolicy = PlaybackRecoveryPolicy(maxNetworkRetries = 3)

    private val _playbackState = MutableStateFlow(
        PlaybackState(connectionState = ConnectionState.DISCONNECTED)
    )
    val playbackState: StateFlow<PlaybackState> = _playbackState.asStateFlow()

    var eventRecorder: com.daddyizz.cyberpulse.core.analytics.PlaybackEventRecorder? = null

    fun setPlaybackContext(context: com.daddyizz.cyberpulse.core.analytics.PlaybackContext, extraMetadata: String? = null) {
        eventRecorder?.setPlaybackContext(context, extraMetadata)
    }

    private val playerListener = object : Player.Listener {
        override fun onPlaybackStateChanged(playbackState: Int) {
            updateFullState()
            if (playbackState == Player.STATE_READY && mediaController?.isPlaying == true) {
                recoveryPolicy.reset()
            }
        }

        override fun onIsPlayingChanged(isPlaying: Boolean) {
            updateFullState()
            manageProgressTicker(isPlaying)
            eventRecorder?.onIsPlayingChanged(isPlaying)
            if (!isPlaying) {
                persistActiveState(force = true)
            }
        }

        override fun onMediaItemTransition(mediaItem: MediaItem?, reason: Int) {
            updateFullState()
            recoveryPolicy.reset()
            val track = mediaItem?.let { MediaItemMapper.toTrack(it) }
            eventRecorder?.onTrackChanged(track)
            persistActiveState(force = true)
        }

        override fun onTimelineChanged(timeline: Timeline, reason: Int) {
            updateFullState()
            persistActiveState(force = false)
        }

        override fun onShuffleModeEnabledChanged(shuffleModeEnabled: Boolean) {
            _playbackState.update { it.copy(shuffleEnabled = shuffleModeEnabled) }
            persistActiveState(force = true)
        }

        override fun onRepeatModeChanged(repeatMode: Int) {
            _playbackState.update { it.copy(repeatMode = repeatMode) }
            persistActiveState(force = true)
        }

        override fun onPlayerError(error: PlaybackException) {
            val domainError = PlaybackError.fromPlaybackException(error)
            val currentTrack = _playbackState.value.currentTrack
            val recoveryAction = recoveryPolicy.evaluateError(domainError, currentTrack?.id)

            when (recoveryAction) {
                ErrorRecoveryAction.RETRY_WITH_BACKOFF -> {
                    val backoffMs = recoveryPolicy.getBackoffDelayMs()
                    _playbackState.update {
                        it.copy(
                            error = domainError,
                            isBuffering = true
                        )
                    }
                    scope.launch {
                        delay(backoffMs)
                        val controller = mediaController
                        if (controller != null && !controller.isPlaying) {
                            controller.prepare()
                            controller.play()
                        }
                    }
                }
                ErrorRecoveryAction.SHOW_ERROR_AND_PAUSE,
                ErrorRecoveryAction.MARK_UNAVAILABLE -> {
                    _playbackState.update {
                        it.copy(
                            error = domainError,
                            isPlaying = false,
                            isBuffering = false
                        )
                    }
                }
                ErrorRecoveryAction.SKIP_TO_NEXT -> {
                    skipNext()
                }
            }
        }
    }

    init {
        connectToService()
    }

    /**
     * Connects or reconnects to CyberPulsePlaybackService via SessionToken.
     */
    fun connectToService() {
        if (mediaController != null) return

        _playbackState.update { it.copy(connectionState = ConnectionState.CONNECTING) }

        val sessionToken = SessionToken(
            appContext,
            ComponentName(appContext, CyberPulsePlaybackService::class.java)
        )

        val future = MediaController.Builder(appContext, sessionToken).buildAsync()
        controllerFuture = future

        future.addListener({
            try {
                val controller = future.get()
                mediaController = controller
                controller.addListener(playerListener)
                _playbackState.update {
                    it.copy(
                        isServiceConnected = true,
                        connectionState = ConnectionState.CONNECTED
                    )
                }
                updateFullState()
                manageProgressTicker(controller.isPlaying)

                // If controller has no active queue, attempt clean restoration in paused state
                if (controller.mediaItemCount == 0) {
                    restoreSessionIfAvailable()
                }
            } catch (e: Exception) {
                _playbackState.update {
                    it.copy(
                        isServiceConnected = false,
                        connectionState = ConnectionState.FAILED,
                        error = PlaybackError.PlaybackFailed("Failed to connect to playback service: ${e.localizedMessage}")
                    )
                }
            }
        }, ContextCompat.getMainExecutor(appContext))
    }

    /**
     * Restores saved queue and position from PlaybackRecoveryStore across process recreation.
     * Enforces STRICT user intent rule: never begins playback automatically (playWhenReady = false).
     */
    fun restoreSessionIfAvailable() {
        val controller = mediaController ?: return
        if (controller.mediaItemCount > 0) return

        val snapshot = recoveryStore.loadState()
        if (!snapshot.hasValidQueue) return

        val restoredTracks = snapshot.queueTrackIds.mapNotNull { id ->
            CyberPulseTestMedia.ALL_TEST_TRACKS.firstOrNull { it.id == id }
        }

        if (restoredTracks.isNotEmpty()) {
            val mediaItems = restoredTracks.map { track ->
                val source = PlaybackSourceResolver.resolveSource(track)
                MediaItemMapper.toMediaItem(track, source)
            }
            val targetIndex = restoredTracks.indexOfFirst { it.id == snapshot.currentTrackId }.coerceAtLeast(0)
            controller.setMediaItems(mediaItems, targetIndex, snapshot.positionMs)
            controller.shuffleModeEnabled = snapshot.shuffleEnabled
            controller.repeatMode = snapshot.repeatMode
            controller.prepare()
            // CRITICAL: do NOT call controller.play(). Retain paused state on cold recovery.
            updateFullState()
        }
    }

    private fun persistActiveState(force: Boolean) {
        val state = _playbackState.value
        val queueIds = state.queue.map { it.id }
        val currentId = state.currentTrack?.id
        val positionMs = state.positionMs

        recoveryStore.saveState(
            queueTrackIds = queueIds,
            currentTrackId = currentId,
            positionMs = positionMs,
            shuffleEnabled = state.shuffleEnabled,
            repeatMode = state.repeatMode,
            force = force
        )
    }

    private fun updateFullState() {
        val controller = mediaController ?: return

        val currentMediaItem = controller.currentMediaItem
        val currentTrack = currentMediaItem?.let { MediaItemMapper.toTrack(it) }

        val queue = mutableListOf<Track>()
        val timeline = controller.currentTimeline
        if (!timeline.isEmpty) {
            for (i in 0 until controller.mediaItemCount) {
                val item = controller.getMediaItemAt(i)
                queue.add(MediaItemMapper.toTrack(item))
            }
        }

        val isBuffering = controller.playbackState == Player.STATE_BUFFERING
        val isPlaying = controller.isPlaying
        val durationMs = if (controller.duration > 0) controller.duration else 0L
        val positionMs = controller.currentPosition.coerceAtLeast(0L)
        val bufferedMs = controller.bufferedPosition.coerceAtLeast(0L)

        _playbackState.update { state ->
            state.copy(
                currentTrack = currentTrack,
                isPlaying = isPlaying,
                positionMs = positionMs,
                durationMs = durationMs,
                bufferedPositionMs = bufferedMs,
                playbackState = controller.playbackState,
                shuffleEnabled = controller.shuffleModeEnabled,
                repeatMode = controller.repeatMode,
                canPlayNext = controller.hasNextMediaItem(),
                canPlayPrevious = controller.hasPreviousMediaItem(),
                isBuffering = isBuffering,
                queue = queue,
                currentQueueIndex = controller.currentMediaItemIndex,
                error = null,
                isServiceConnected = true,
                audioSessionId = CyberPulsePlaybackService.activeAudioSessionId
            )
        }
    }

    private fun manageProgressTicker(isPlaying: Boolean) {
        progressPollingJob?.cancel()
        if (!isPlaying) return

        progressPollingJob = scope.launch {
            while (isActive) {
                val controller = mediaController
                if (controller != null && controller.isPlaying) {
                    val pos = controller.currentPosition.coerceAtLeast(0L)
                    val buffered = controller.bufferedPosition.coerceAtLeast(0L)
                    val dur = if (controller.duration > 0) controller.duration else _playbackState.value.durationMs

                    _playbackState.update {
                        it.copy(
                            positionMs = pos,
                            bufferedPositionMs = buffered,
                            durationMs = dur
                        )
                    }
                    persistActiveState(force = false)
                }
                delay(500L) // 500ms ticker: high visual responsiveness without battery waste
            }
        }
    }

    // ==========================================
    // Player Commands
    // ==========================================

    fun play() {
        mediaController?.play()
    }

    fun pause() {
        mediaController?.pause()
    }

    fun togglePlayPause() {
        val controller = mediaController ?: return
        if (controller.isPlaying) {
            controller.pause()
        } else {
            controller.play()
        }
    }

    fun seekTo(positionMs: Long) {
        mediaController?.seekTo(positionMs)
        _playbackState.update { it.copy(positionMs = positionMs) }
    }

    fun seekForward(offsetMs: Long = 10000L) {
        mediaController?.seekForward()
    }

    fun seekBack(offsetMs: Long = 10000L) {
        mediaController?.seekBack()
    }

    fun skipNext() {
        eventRecorder?.onManualSkip()
        val controller = mediaController ?: return
        if (controller.hasNextMediaItem()) {
            controller.seekToNextMediaItem()
        }
    }

    fun skipPrevious() {
        eventRecorder?.onManualSkip()
        val controller = mediaController ?: return
        if (controller.hasPreviousMediaItem()) {
            controller.seekToPreviousMediaItem()
        } else {
            controller.seekTo(0L)
        }
    }

    fun setShuffle(enabled: Boolean) {
        mediaController?.shuffleModeEnabled = enabled
    }

    fun toggleShuffle() {
        val current = mediaController?.shuffleModeEnabled ?: false
        setShuffle(!current)
    }

    fun cycleRepeatMode() {
        val controller = mediaController ?: return
        val nextMode = when (controller.repeatMode) {
            Player.REPEAT_MODE_OFF -> Player.REPEAT_MODE_ALL
            Player.REPEAT_MODE_ALL -> Player.REPEAT_MODE_ONE
            else -> Player.REPEAT_MODE_OFF
        }
        controller.repeatMode = nextMode
    }

    fun stop() {
        eventRecorder?.onPlaybackStopped()
        mediaController?.stop()
    }

    fun playTrack(track: Track, queue: List<Track> = listOf(track)) {
        val controller = mediaController ?: return

        val mediaItems = queue.map { item ->
            val source = PlaybackSourceResolver.resolveSource(item)
            MediaItemMapper.toMediaItem(item, source)
        }

        val targetIndex = queue.indexOfFirst { it.id == track.id }.coerceAtLeast(0)

        controller.setMediaItems(mediaItems, targetIndex, 0L)
        controller.prepare()
        controller.play()
    }

    fun playQueue(queue: List<Track>, startIndex: Int = 0) {
        val controller = mediaController ?: return
        val mediaItems = queue.map { item ->
            val source = PlaybackSourceResolver.resolveSource(item)
            MediaItemMapper.toMediaItem(item, source)
        }
        val safeIndex = startIndex.coerceIn(0, (queue.size - 1).coerceAtLeast(0))
        controller.setMediaItems(mediaItems, safeIndex, 0L)
        controller.prepare()
        controller.play()
    }

    fun addToQueue(track: Track) {
        val controller = mediaController ?: return
        val source = PlaybackSourceResolver.resolveSource(track)
        val item = MediaItemMapper.toMediaItem(track, source)
        controller.addMediaItem(item)
    }

    fun addTracksToQueue(tracks: List<Track>) {
        val controller = mediaController ?: return
        val mediaItems = tracks.map { track ->
            val source = PlaybackSourceResolver.resolveSource(track)
            MediaItemMapper.toMediaItem(track, source)
        }
        controller.addMediaItems(mediaItems)
    }

    fun clearQueue() {
        val controller = mediaController ?: return
        controller.clearMediaItems()
    }

    fun playNext(track: Track) {
        val controller = mediaController ?: return
        val source = PlaybackSourceResolver.resolveSource(track)
        val item = MediaItemMapper.toMediaItem(track, source)
        val nextIndex = (controller.currentMediaItemIndex + 1).coerceAtMost(controller.mediaItemCount)
        controller.addMediaItem(nextIndex, item)
    }

    fun seekToQueueItem(index: Int) {
        val controller = mediaController ?: return
        if (index in 0 until controller.mediaItemCount) {
            controller.seekToDefaultPosition(index)
            controller.play()
        }
    }

    fun removeQueueItem(index: Int) {
        val controller = mediaController ?: return
        if (index in 0 until controller.mediaItemCount) {
            controller.removeMediaItem(index)
        }
    }

    fun moveQueueItem(fromIndex: Int, toIndex: Int) {
        val controller = mediaController ?: return
        val count = controller.mediaItemCount
        if (fromIndex in 0 until count && toIndex in 0 until count) {
            controller.moveMediaItem(fromIndex, toIndex)
        }
    }

    fun clearQueue() {
        mediaController?.clearMediaItems()
        recoveryStore.clear()
    }

    fun clearUpcomingQueue() {
        val controller = mediaController ?: return
        val count = controller.mediaItemCount
        val currentIndex = controller.currentMediaItemIndex
        if (currentIndex in 0 until count) {
            for (i in count - 1 downTo currentIndex + 1) {
                controller.removeMediaItem(i)
            }
        } else {
            controller.clearMediaItems()
        }
    }

    fun release() {
        progressPollingJob?.cancel()
        mediaController?.removeListener(playerListener)
        controllerFuture?.let { MediaController.releaseFuture(it) }
        mediaController = null
        controllerFuture = null
    }

    companion object {
        @Volatile
        private var instance: PlaybackConnection? = null

        fun getInstance(context: Context): PlaybackConnection {
            return instance ?: synchronized(this) {
                instance ?: PlaybackConnection(context.applicationContext).also { instance = it }
            }
        }
    }
}
