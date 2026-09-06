package com.daddyizz.cyberpulse.core.analytics

import com.daddyizz.cyberpulse.core.model.Track
import kotlinx.coroutines.*
import java.util.*

/**
 * Hooks into the playback lifecycle to accurately record playback events and qualified plays.
 * Strict rules:
 * - Only counts time audio was actively PLAYING (excluding paused, buffering, or error time).
 * - Qualified play: >= 30 seconds OR >= 50% for tracks under 60 seconds.
 */
class PlaybackEventRecorder(
    private val analyticsRepository: ListeningAnalyticsRepository,
    private val scope: CoroutineScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
) {
    companion object {
        const val QUALIFIED_PLAY_THRESHOLD_MS = 30_000L
        const val SHORT_TRACK_COMPLETION_RATIO = 0.5
        const val SESSION_TIMEOUT_MS = 30 * 60 * 1000L // 30 minutes
    }

    private var currentTrack: Track? = null
    private var trackStartedAtEpochMs: Long = 0L
    private var lastPlayResumeEpochMs: Long = 0L
    private var accumulatedPlayingMs: Long = 0L
    private var isPlayingActive: Boolean = false

    private var currentSessionId: String = UUID.randomUUID().toString()
    private var lastActivityEpochMs: Long = System.currentTimeMillis()
    private var activePlaybackContext: PlaybackContext = PlaybackContext.HOME
    private var activeExtraMetadata: String? = null

    /**
     * Updates the active playback context (e.g. CYBER_DJ, ANDROID_AUTO, RADIO).
     */
    fun setPlaybackContext(context: PlaybackContext, extraMetadata: String? = null) {
        this.activePlaybackContext = context
        this.activeExtraMetadata = extraMetadata
    }

    /**
     * Called when active track changes or begins.
     */
    @Synchronized
    fun onTrackChanged(newTrack: Track?) {
        val now = System.currentTimeMillis()

        // 1. Finalize and record previous track if it accumulated listening time
        finalizeCurrentTrack(skipType = SkipType.NONE, now = now)

        // 2. Session continuity check
        if (now - lastActivityEpochMs > SESSION_TIMEOUT_MS) {
            currentSessionId = UUID.randomUUID().toString()
        }
        lastActivityEpochMs = now

        // 3. Setup new track
        currentTrack = newTrack
        trackStartedAtEpochMs = now
        accumulatedPlayingMs = 0L

        if (isPlayingActive) {
            lastPlayResumeEpochMs = now
        }
    }

    /**
     * Called when playing state changes (Play vs Pause / Buffering / Stopped).
     */
    @Synchronized
    fun onIsPlayingChanged(isPlaying: Boolean) {
        val now = System.currentTimeMillis()
        lastActivityEpochMs = now

        if (isPlaying && !isPlayingActive) {
            // Audio resumed
            isPlayingActive = true
            lastPlayResumeEpochMs = now
        } else if (!isPlaying && isPlayingActive) {
            // Audio paused or stopped
            isPlayingActive = false
            if (lastPlayResumeEpochMs > 0L) {
                val segment = (now - lastPlayResumeEpochMs).coerceAtLeast(0L)
                accumulatedPlayingMs += segment
                lastPlayResumeEpochMs = 0L
            }
        }
    }

    /**
     * Called when user explicitly taps Next / Skip.
     */
    @Synchronized
    fun onManualSkip() {
        val now = System.currentTimeMillis()
        finalizeCurrentTrack(skipType = SkipType.MANUAL_SKIP, now = now)
        currentTrack = null
        accumulatedPlayingMs = 0L
        lastPlayResumeEpochMs = 0L
    }

    /**
     * Called when playback terminates or service unbinds.
     */
    @Synchronized
    fun onPlaybackStopped() {
        val now = System.currentTimeMillis()
        isPlayingActive = false
        finalizeCurrentTrack(skipType = SkipType.NONE, now = now)
        currentTrack = null
        accumulatedPlayingMs = 0L
        lastPlayResumeEpochMs = 0L
    }

    private fun finalizeCurrentTrack(skipType: SkipType, now: Long) {
        val track = currentTrack ?: return

        // Flush any active playing interval up to now
        if (isPlayingActive && lastPlayResumeEpochMs > 0L) {
            val segment = (now - lastPlayResumeEpochMs).coerceAtLeast(0L)
            accumulatedPlayingMs += segment
            lastPlayResumeEpochMs = now
        }

        val totalListenedMs = accumulatedPlayingMs
        // Ignore negligible accidental touches (< 1 second)
        if (totalListenedMs < 1000L) return

        val durationMs = if (track.durationSeconds > 0L) track.durationSeconds * 1000L else null
        val ratio = if (durationMs != null && durationMs > 0L) {
            (totalListenedMs.toDouble() / durationMs).coerceAtMost(1.0)
        } else null

        // Qualified Play Threshold Evaluation
        val isQualified = if (durationMs != null && durationMs < 60_000L) {
            (totalListenedMs >= durationMs * SHORT_TRACK_COMPLETION_RATIO) || (totalListenedMs >= QUALIFIED_PLAY_THRESHOLD_MS)
        } else {
            totalListenedMs >= QUALIFIED_PLAY_THRESHOLD_MS
        }

        val event = ListeningEvent(
            id = UUID.randomUUID().toString(),
            trackId = track.id,
            source = track.source,
            sourceId = track.sourceId,
            titleSnapshot = track.title,
            artistSnapshot = track.artist,
            albumSnapshot = track.album,
            genreSnapshot = null, // Retrieved from catalog or folder where present
            startedAt = trackStartedAtEpochMs,
            endedAt = now,
            listenedMs = totalListenedMs,
            trackDurationMs = durationMs,
            completionRatio = ratio,
            isQualifiedPlay = isQualified,
            skipType = skipType,
            sessionId = currentSessionId,
            playbackContext = activePlaybackContext,
            extraMetadata = activeExtraMetadata
        )

        scope.launch {
            analyticsRepository.recordEvent(event)
        }
    }
}
