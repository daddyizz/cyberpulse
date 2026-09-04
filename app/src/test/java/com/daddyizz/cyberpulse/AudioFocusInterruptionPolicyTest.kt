package com.daddyizz.cyberpulse

import com.daddyizz.cyberpulse.core.player.AudioFocusInterruptionPolicy
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

class AudioFocusInterruptionPolicyTest {

    private lateinit var policy: AudioFocusInterruptionPolicy

    @Before
    fun setUp() {
        policy = AudioFocusInterruptionPolicy()
    }

    @Test
    fun `user play and pause updates intent correctly`() {
        policy.onUserPlay()
        assertTrue(policy.wasPlayingBeforeInterruption)

        policy.onUserPause()
        assertFalse(policy.wasPlayingBeforeInterruption)
    }

    @Test
    fun `transient loss resumes on focus gain only if playing before interruption`() {
        // Case 1: Actively playing when transient loss occurs (e.g. phone call or nav direction)
        policy.onUserPlay()
        val actionOnLoss = policy.onTransientFocusLoss(currentlyPlaying = true)
        assertEquals(AudioFocusInterruptionPolicy.FocusAction.PAUSE_TRANSIENTLY, actionOnLoss)
        assertTrue(policy.resumeOnFocusGain)

        val actionOnGain = policy.onFocusGained()
        assertEquals(AudioFocusInterruptionPolicy.FocusAction.RESUME_PLAYBACK, actionOnGain)
        assertFalse(policy.resumeOnFocusGain)
    }

    @Test
    fun `transient loss does not resume on focus gain if user had paused`() {
        // Case 2: User manually paused before interruption
        policy.onUserPause()
        policy.onTransientFocusLoss(currentlyPlaying = false)
        assertFalse(policy.resumeOnFocusGain)

        val actionOnGain = policy.onFocusGained()
        assertEquals(AudioFocusInterruptionPolicy.FocusAction.NO_ACTION, actionOnGain)
    }

    @Test
    fun `ducking lowers volume and restores upon focus gain`() {
        policy.onUserPlay()
        val duckAction = policy.onTransientLossCanDuck()
        assertEquals(AudioFocusInterruptionPolicy.FocusAction.DUCK_VOLUME, duckAction)
        assertTrue(policy.isDucked)

        val restoreAction = policy.onFocusGained()
        assertEquals(AudioFocusInterruptionPolicy.FocusAction.RESTORE_VOLUME, restoreAction)
        assertFalse(policy.isDucked)
    }

    @Test
    fun `becoming noisy always pauses and never auto-resumes`() {
        policy.onUserPlay()
        val noisyAction = policy.onBecomingNoisy()
        assertEquals(AudioFocusInterruptionPolicy.FocusAction.PAUSE_PERMANENTLY, noisyAction)
        assertFalse(policy.resumeOnFocusGain)

        val gainAction = policy.onFocusGained()
        assertEquals(AudioFocusInterruptionPolicy.FocusAction.NO_ACTION, gainAction)
    }

    @Test
    fun `permanent focus loss clears resume intention`() {
        policy.onUserPlay()
        val lossAction = policy.onPermanentFocusLoss()
        assertEquals(AudioFocusInterruptionPolicy.FocusAction.PAUSE_PERMANENTLY, lossAction)
        assertFalse(policy.resumeOnFocusGain)
    }
}
