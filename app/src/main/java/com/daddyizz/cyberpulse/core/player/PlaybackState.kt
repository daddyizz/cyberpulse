package com.daddyizz.cyberpulse.core.player

import androidx.media3.common.Player
import com.daddyizz.cyberpulse.core.model.Track

/**
 * Explicit connection state between UI layer and background MediaLibraryService.
 */
enum class ConnectionState {
    DISCONNECTED,
    CONNECTING,
    CONNECTED,
    FAILED
}

/**
 * Immutable UI-facing state for the CyberPulse playback engine.
 */
data class PlaybackState(
    val currentTrack: Track? = null,
    val isPlaying: Boolean = false,
    val positionMs: Long = 0L,
    val durationMs: Long = 0L,
    val bufferedPositionMs: Long = 0L,
    val playbackState: Int = Player.STATE_IDLE,
    val shuffleEnabled: Boolean = false,
    val repeatMode: Int = Player.REPEAT_MODE_OFF,
    val canPlayNext: Boolean = false,
    val canPlayPrevious: Boolean = false,
    val isBuffering: Boolean = false,
    val error: PlaybackError? = null,
    val queue: List<Track> = emptyList(),
    val currentQueueIndex: Int = -1,
    val isServiceConnected: Boolean = false,
    val connectionState: ConnectionState = ConnectionState.DISCONNECTED,
    val isDucked: Boolean = false,
    val isInterrupted: Boolean = false
) {
    val progressFraction: Float
        get() = if (durationMs > 0) (positionMs.toFloat() / durationMs.toFloat()).coerceIn(0f, 1f) else 0f

    val positionSeconds: Long
        get() = positionMs / 1000L

    val durationSeconds: Long
        get() = if (durationMs > 0) durationMs / 1000L else (currentTrack?.durationSeconds ?: 0L)
}
