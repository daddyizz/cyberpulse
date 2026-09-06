package com.daddyizz.cyberpulse.core.analytics

import com.daddyizz.cyberpulse.core.model.MusicSource

/**
 * Normalized immutable record of a playback event.
 * Snapshots track title, artist, album, and genre so future catalog changes
 * do not alter historical statistics.
 */
data class ListeningEvent(
    val id: String,
    val trackId: String,
    val source: MusicSource,
    val sourceId: String?,
    val titleSnapshot: String,
    val artistSnapshot: String?,
    val albumSnapshot: String?,
    val genreSnapshot: String? = null,
    val startedAt: Long,
    val endedAt: Long?,
    val listenedMs: Long,
    val trackDurationMs: Long?,
    val completionRatio: Double?,
    val isQualifiedPlay: Boolean,
    val skipType: SkipType? = SkipType.NONE,
    val sessionId: String,
    val playbackContext: PlaybackContext = PlaybackContext.HOME,
    val extraMetadata: String? = null
)

/**
 * Represents a continuous listening session separated by <= 30 minutes of inactivity.
 */
data class ListeningSession(
    val sessionId: String,
    val startTime: Long,
    val endTime: Long,
    val totalDurationMs: Long,
    val trackCount: Int,
    val primaryContext: PlaybackContext
)
