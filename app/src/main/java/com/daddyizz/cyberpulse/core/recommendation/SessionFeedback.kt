package com.daddyizz.cyberpulse.core.recommendation

/**
 * Real-time feedback actions triggered during Cyber DJ sessions.
 */
enum class DjFeedbackAction {
    MORE_LIKE_THIS,
    LESS_LIKE_THIS,
    MORE_ENERGY,
    CHILL_DOWN,
    SURPRISE_ME
}

/**
 * Mutable state capturing listener reactions and tuning adjustments for an active session.
 */
data class SessionFeedback(
    val boostedArtists: MutableSet<String> = mutableSetOf(),
    val dislikedArtists: MutableSet<String> = mutableSetOf(),
    val dislikedTrackIds: MutableSet<String> = mutableSetOf(),
    val skippedTracks: MutableSet<String> = mutableSetOf(),
    var energyAdjustment: Int = 0,
    var discoveryAdjustment: Float = 0.0f
) {
    fun applyAction(action: DjFeedbackAction, currentTrackArtist: String?, currentTrackId: String?) {
        when (action) {
            DjFeedbackAction.MORE_LIKE_THIS -> {
                if (!currentTrackArtist.isNullOrBlank()) {
                    boostedArtists.add(currentTrackArtist)
                    dislikedArtists.remove(currentTrackArtist)
                }
            }
            DjFeedbackAction.LESS_LIKE_THIS -> {
                if (!currentTrackArtist.isNullOrBlank()) {
                    dislikedArtists.add(currentTrackArtist)
                    boostedArtists.remove(currentTrackArtist)
                }
                if (!currentTrackId.isNullOrBlank()) {
                    dislikedTrackIds.add(currentTrackId)
                }
            }
            DjFeedbackAction.MORE_ENERGY -> {
                energyAdjustment = (energyAdjustment + 15).coerceIn(-40, 40)
            }
            DjFeedbackAction.CHILL_DOWN -> {
                energyAdjustment = (energyAdjustment - 15).coerceIn(-40, 40)
            }
            DjFeedbackAction.SURPRISE_ME -> {
                discoveryAdjustment = (discoveryAdjustment + 0.35f).coerceIn(-0.5f, 0.5f)
            }
        }
    }

    fun recordSkip(trackId: String, durationPlayedSeconds: Long) {
        // Repeated rapid skip (skipped before 15 seconds) incurs stronger penalty
        if (durationPlayedSeconds < 15L) {
            skippedTracks.add(trackId)
        }
    }

    fun reset() {
        boostedArtists.clear()
        dislikedArtists.clear()
        dislikedTrackIds.clear()
        skippedTracks.clear()
        energyAdjustment = 0
        discoveryAdjustment = 0.0f
    }
}
