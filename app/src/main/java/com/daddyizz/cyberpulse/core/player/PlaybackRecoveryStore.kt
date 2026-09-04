package com.daddyizz.cyberpulse.core.player

import android.content.Context
import android.content.SharedPreferences

/**
 * Snapshot of recoverable playback state across process recreation.
 */
data class PlaybackRecoverySnapshot(
    val queueTrackIds: List<String> = emptyList(),
    val currentTrackId: String? = null,
    val positionMs: Long = 0L,
    val shuffleEnabled: Boolean = false,
    val repeatMode: Int = 0,
    val lastUpdatedEpochMs: Long = 0L
) {
    val hasValidQueue: Boolean
        get() = queueTrackIds.isNotEmpty() && currentTrackId != null
}

/**
 * PlaybackRecoveryStore
 *
 * Lightweight, process-safe persistence mechanism storing minimal playback state.
 * Uses Android SharedPreferences with throttled writes to prevent battery drain or I/O thrashing.
 *
 * STRICT PERSISTENCE RULES:
 * - Persists ONLY stable CyberPulse logical track identifiers.
 * - NEVER persists raw streaming URLs or third-party extracted links.
 * - Restores queue into player in a PAUSED state (playWhenReady = false) so playback
 *   never begins unexpectedly without explicit user intent.
 */
class PlaybackRecoveryStore(context: Context) {

    private val prefs: SharedPreferences = context.applicationContext.getSharedPreferences(
        PREFS_NAME,
        Context.MODE_PRIVATE
    )

    private var lastSavedPositionMs: Long = 0L
    private var lastSaveTimestampMs: Long = 0L

    /**
     * Saves a snapshot of active playback state.
     * Includes throttling: during continuous playback, writes only if at least 15 seconds have passed
     * and position changed by at least 10 seconds, unless [force] is true (e.g. on pause, track change, or stop).
     */
    fun saveState(
        queueTrackIds: List<String>,
        currentTrackId: String?,
        positionMs: Long,
        shuffleEnabled: Boolean,
        repeatMode: Int,
        force: Boolean = false
    ) {
        val now = System.currentTimeMillis()
        val timeDelta = now - lastSaveTimestampMs
        val posDelta = kotlin.math.abs(positionMs - lastSavedPositionMs)

        if (!force && timeDelta < THROTTLE_INTERVAL_MS && posDelta < 10000L) {
            return
        }

        lastSaveTimestampMs = now
        lastSavedPositionMs = positionMs

        val serializedQueue = queueTrackIds.joinToString(DELIMITER)

        prefs.edit()
            .putString(KEY_QUEUE_IDS, serializedQueue)
            .putString(KEY_CURRENT_TRACK_ID, currentTrackId)
            .putLong(KEY_POSITION_MS, positionMs.coerceAtLeast(0L))
            .putBoolean(KEY_SHUFFLE_ENABLED, shuffleEnabled)
            .putInt(KEY_REPEAT_MODE, repeatMode)
            .putLong(KEY_LAST_TIMESTAMP, now)
            .apply()
    }

    /**
     * Loads the last persisted playback recovery snapshot.
     */
    fun loadState(): PlaybackRecoverySnapshot {
        val rawQueue = prefs.getString(KEY_QUEUE_IDS, null) ?: ""
        val trackIds = if (rawQueue.isNotBlank()) {
            rawQueue.split(DELIMITER).filter { it.isNotBlank() }
        } else {
            emptyList()
        }

        val currentTrackId = prefs.getString(KEY_CURRENT_TRACK_ID, null)
        val pos = prefs.getLong(KEY_POSITION_MS, 0L)
        val shuffle = prefs.getBoolean(KEY_SHUFFLE_ENABLED, false)
        val repeat = prefs.getInt(KEY_REPEAT_MODE, 0)
        val timestamp = prefs.getLong(KEY_LAST_TIMESTAMP, 0L)

        return PlaybackRecoverySnapshot(
            queueTrackIds = trackIds,
            currentTrackId = currentTrackId,
            positionMs = pos,
            shuffleEnabled = shuffle,
            repeatMode = repeat,
            lastUpdatedEpochMs = timestamp
        )
    }

    /**
     * Clears persisted recovery state (e.g., when the user explicitly clears the queue).
     */
    fun clear() {
        prefs.edit()
            .remove(KEY_QUEUE_IDS)
            .remove(KEY_CURRENT_TRACK_ID)
            .remove(KEY_POSITION_MS)
            .remove(KEY_SHUFFLE_ENABLED)
            .remove(KEY_REPEAT_MODE)
            .remove(KEY_LAST_TIMESTAMP)
            .apply()
    }

    companion object {
        private const val PREFS_NAME = "cyberpulse_playback_recovery"
        private const val KEY_QUEUE_IDS = "recovery_queue_ids"
        private const val KEY_CURRENT_TRACK_ID = "recovery_current_track_id"
        private const val KEY_POSITION_MS = "recovery_position_ms"
        private const val KEY_SHUFFLE_ENABLED = "recovery_shuffle_enabled"
        private const val KEY_REPEAT_MODE = "recovery_repeat_mode"
        private const val KEY_LAST_TIMESTAMP = "recovery_last_timestamp"

        private const val DELIMITER = ","
        private const val THROTTLE_INTERVAL_MS = 15000L // 15 seconds throttle
    }
}
