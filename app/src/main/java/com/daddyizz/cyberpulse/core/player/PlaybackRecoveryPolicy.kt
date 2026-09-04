package com.daddyizz.cyberpulse.core.player

/**
 * Action determined by PlaybackRecoveryPolicy when handling a playback failure.
 */
enum class ErrorRecoveryAction {
    RETRY_WITH_BACKOFF,
    SHOW_ERROR_AND_PAUSE,
    MARK_UNAVAILABLE,
    SKIP_TO_NEXT
}

/**
 * PlaybackRecoveryPolicy
 *
 * Enforces resilient error recovery decisions without causing infinite retry loops,
 * UI freezing, or aggressive CPU spinning when streams fail or network is dropped.
 */
class PlaybackRecoveryPolicy(
    val maxNetworkRetries: Int = 3,
    val initialBackoffMs: Long = 1000L
) {
    private var currentRetryCount = 0
    private var lastFailedTrackId: String? = null

    /**
     * Evaluates a playback error and determines the appropriate recovery strategy.
     */
    fun evaluateError(error: PlaybackError, currentTrackId: String?): ErrorRecoveryAction {
        // Reset retry counter if this error is on a different track than previous failure
        if (currentTrackId != null && currentTrackId != lastFailedTrackId) {
            currentRetryCount = 0
            lastFailedTrackId = currentTrackId
        }

        return when (error) {
            is PlaybackError.NetworkLost -> {
                if (currentRetryCount < maxNetworkRetries) {
                    currentRetryCount++
                    ErrorRecoveryAction.RETRY_WITH_BACKOFF
                } else {
                    ErrorRecoveryAction.SHOW_ERROR_AND_PAUSE
                }
            }
            is PlaybackError.UnsupportedFormat -> {
                // Non-recoverable codec/container issue: do not retry
                ErrorRecoveryAction.SHOW_ERROR_AND_PAUSE
            }
            is PlaybackError.StreamUnavailable,
            is PlaybackError.SourceUnavailable -> {
                // Non-recoverable 404 or missing stream URL: mark unavailable
                ErrorRecoveryAction.MARK_UNAVAILABLE
            }
            is PlaybackError.PermissionDenied -> {
                // Operating system denied access: pause immediately
                ErrorRecoveryAction.SHOW_ERROR_AND_PAUSE
            }
            is PlaybackError.PlaybackFailed,
            is PlaybackError.Unknown -> {
                if (currentRetryCount < 1) {
                    currentRetryCount++
                    ErrorRecoveryAction.RETRY_WITH_BACKOFF
                } else {
                    ErrorRecoveryAction.SHOW_ERROR_AND_PAUSE
                }
            }
        }
    }

    /**
     * Calculates exponential backoff delay based on current retry count.
     */
    fun getBackoffDelayMs(): Long {
        val multiplier = 1L shl (currentRetryCount.coerceAtLeast(1) - 1)
        return (initialBackoffMs * multiplier).coerceAtMost(10000L)
    }

    /**
     * Resets retry history (called upon successful playback start or manual track change).
     */
    fun reset() {
        currentRetryCount = 0
        lastFailedTrackId = null
    }

    val currentRetries: Int
        get() = currentRetryCount
}
