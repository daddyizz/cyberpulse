package com.daddyizz.cyberpulse

import com.daddyizz.cyberpulse.core.player.ErrorRecoveryAction
import com.daddyizz.cyberpulse.core.player.PlaybackError
import com.daddyizz.cyberpulse.core.player.PlaybackRecoveryPolicy
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

class PlaybackRecoveryPolicyTest {

    private lateinit var policy: PlaybackRecoveryPolicy

    @Before
    fun setUp() {
        policy = PlaybackRecoveryPolicy(maxNetworkRetries = 3)
    }

    @Test
    fun `network error triggers retry with exponential backoff up to limit`() {
        val netError = PlaybackError.NetworkError("Connection timed out")
        val trackId = "track-synthwave-01"

        // Retry 1
        assertTrue(policy.canRetry(netError))
        val action1 = policy.evaluateError(netError, trackId)
        assertEquals(ErrorRecoveryAction.RETRY_WITH_BACKOFF, action1)
        assertEquals(1000L, policy.getBackoffDelayMs())

        // Retry 2
        val action2 = policy.evaluateError(netError, trackId)
        assertEquals(ErrorRecoveryAction.RETRY_WITH_BACKOFF, action2)
        assertEquals(2000L, policy.getBackoffDelayMs())

        // Retry 3
        val action3 = policy.evaluateError(netError, trackId)
        assertEquals(ErrorRecoveryAction.RETRY_WITH_BACKOFF, action3)
        assertEquals(4000L, policy.getBackoffDelayMs())

        // Retry 4 (Exceeded max 3)
        assertFalse(policy.canRetry(netError))
        val action4 = policy.evaluateError(netError, trackId)
        assertEquals(ErrorRecoveryAction.SHOW_ERROR_AND_PAUSE, action4)
    }

    @Test
    fun `unplayable or corrupt format error never retries`() {
        val corruptError = PlaybackError.SourceNotPlayable("Unsupported codec format")
        assertFalse(policy.canRetry(corruptError))

        val action = policy.evaluateError(corruptError, "track-corrupt")
        assertEquals(ErrorRecoveryAction.SHOW_ERROR_AND_PAUSE, action)
    }

    @Test
    fun `reset clears retry state for new track`() {
        val netError = PlaybackError.NetworkError("Dropped packet")
        policy.evaluateError(netError, "track-01")
        assertEquals(1, policy.retryCount)

        policy.reset()
        assertEquals(0, policy.retryCount)
    }
}
