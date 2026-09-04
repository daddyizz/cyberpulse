package com.daddyizz.cyberpulse.core.player

/**
 * AudioFocusInterruptionPolicy
 *
 * Implements strict rules for audio focus handling, phone call interruptions,
 * navigation voice ducking, and noisy device disconnects (headphones / Bluetooth unplugged).
 *
 * CRITICAL RULE (USER INTENT PRECEDENCE):
 * "Resume only when platform/session behavior indicates it is appropriate and the user
 * had been actively playing before the transient interruption. Never start playback unexpectedly.
 * If the user explicitly paused before or during an interruption, playback MUST NOT resume."
 */
class AudioFocusInterruptionPolicy {

    /**
     * Whether the player was actively playing audio immediately before a transient interruption occurred.
     */
    var wasPlayingBeforeTransientLoss: Boolean = false
        private set

    /**
     * Whether the user explicitly performed a manual pause action (UI, widget, headset button).
     */
    var userManuallyPaused: Boolean = false
        private set

    /**
     * Whether a transient audio interruption (incoming call ring, active call, voice prompt) is ongoing.
     */
    var isTransientInterruptionActive: Boolean = false
        private set

    /**
     * Whether the player is currently in a ducked state (lowered volume for navigation prompts).
     */
    var isDucked: Boolean = false
        private set

    /**
     * Record explicit user play intent.
     */
    fun onUserPlay() {
        userManuallyPaused = false
        wasPlayingBeforeTransientLoss = false
    }

    /**
     * Record explicit user pause intent.
     * Takes absolute precedence over automatic resumption.
     */
    fun onUserPause() {
        userManuallyPaused = true
        wasPlayingBeforeTransientLoss = false
    }

    /**
     * Called when AudioManager signals transient audio focus loss (e.g., incoming call, phone call active).
     * @param currentlyPlaying true if ExoPlayer was actively outputting sound.
     */
    fun onTransientFocusLoss(currentlyPlaying: Boolean) {
        isTransientInterruptionActive = true
        if (currentlyPlaying && !userManuallyPaused) {
            wasPlayingBeforeTransientLoss = true
        }
    }

    /**
     * Called when AudioManager signals transient loss with permission to duck (e.g., Google Maps voice prompt).
     */
    fun onTransientDuck(currentlyPlaying: Boolean) {
        if (currentlyPlaying) {
            isDucked = true
        }
    }

    /**
     * Called when AudioManager signals permanent focus loss (e.g., another music app starts playing).
     */
    fun onPermanentFocusLoss() {
        isTransientInterruptionActive = false
        wasPlayingBeforeTransientLoss = false
        isDucked = false
    }

    /**
     * Evaluates whether playback should resume upon AUDIOFOCUS_GAIN.
     * Resume occurs ONLY IF:
     * 1. A transient interruption was active
     * 2. The player was actively playing before the interruption
     * 3. The user did NOT manually pause before or during the interruption
     */
    fun shouldResumeOnFocusGain(): Boolean {
        val allowResume = isTransientInterruptionActive && wasPlayingBeforeTransientLoss && !userManuallyPaused
        isTransientInterruptionActive = false
        wasPlayingBeforeTransientLoss = false
        isDucked = false
        return allowResume
    }

    /**
     * Evaluates action on ACTION_AUDIO_BECOMING_NOISY (unplugging wired headphones or Bluetooth disconnect).
     *
     * @param currentlyPlaying whether audio is currently actively playing.
     * @return true if the engine must immediately pause to prevent blasting sound through phone speakers.
     */
    fun shouldPauseOnBecomingNoisy(currentlyPlaying: Boolean): Boolean {
        return currentlyPlaying
    }

    /**
     * Resets all internal interruption tracking state.
     */
    fun reset() {
        wasPlayingBeforeTransientLoss = false
        userManuallyPaused = false
        isTransientInterruptionActive = false
        isDucked = false
    }
}
