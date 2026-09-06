package com.daddyizz.cyberpulse.core.recommendation

import com.daddyizz.cyberpulse.core.model.Track
import kotlin.math.abs

/**
 * Local Candidate Ranking Engine.
 *
 * Evaluates candidate tracks against the structured intent/plan, listener profile,
 * dynamic feedback signals, recency history, and discovery preferences.
 */
class CandidateRanker(
    private val sessionFeedback: SessionFeedback = SessionFeedback()
) {

    /**
     * Ranks candidate tracks for a PlaylistIntent.
     */
    fun rankForIntent(
        candidates: List<Track>,
        intent: PlaylistIntent,
        context: ListenerContext,
        targetCount: Int = intent.targetTrackCount
    ): List<Track> {
        val scored = candidates.map { track ->
            val score = computeIntentScore(track, intent, context)
            track to score
        }

        return scored.sortedByDescending { it.second }
            .take(targetCount)
            .map { it.first }
    }

    /**
     * Ranks candidate tracks for a Cyber DJ session, taking dynamic sliders and feedback into account.
     */
    fun rankForDjSession(
        candidates: List<Track>,
        plan: DjSessionPlan,
        context: ListenerContext,
        feedback: SessionFeedback,
        playedInSession: Set<String>,
        batchSize: Int = 10
    ): List<Track> {
        val scored = candidates.map { track ->
            val score = computeDjScore(track, plan, context, feedback, playedInSession)
            track to score
        }

        return scored.sortedByDescending { it.second }
            .take(batchSize)
            .map { it.first }
    }

    private fun computeIntentScore(
        track: Track,
        intent: PlaylistIntent,
        context: ListenerContext
    ): Float {
        var score = 50.0f
        val trackText = "${track.title} ${track.artist} ${track.album}".lowercase()

        // 1. Artist affinity
        val artistMatches = intent.artists.any { track.artist.contains(it, ignoreCase = true) }
        if (artistMatches) score += 25f

        // 2. Genre / Mood matching
        val genreMatches = intent.genres.any { trackText.contains(it.lowercase()) }
        if (genreMatches) score += 20f

        val moodMatches = intent.moods.any { trackText.contains(it.lowercase()) }
        if (moodMatches) score += 15f

        // 3. User Liked bonus
        if (track.isLiked || context.likedTrackTitles.any { it.contains(track.title, ignoreCase = true) }) {
            score += 15f
        }

        // 4. Energy proximity
        val targetEnergy = intent.energy ?: 50
        val trackEnergy = estimateTrackEnergy(track)
        val energyDelta = abs(targetEnergy - trackEnergy)
        score -= (energyDelta * 0.25f)

        // 5. User language preference
        val languageMatches = intent.languagePreferences.any { lang ->
            isLanguageMatch(track, lang)
        }
        if (languageMatches) score += 12f

        // 6. Direct playback preference
        if (track.contentUri != null || track.source.name == "LOCAL" || track.source.name == "DEMO") {
            score += 20f
        }

        return score
    }

    private fun computeDjScore(
        track: Track,
        plan: DjSessionPlan,
        context: ListenerContext,
        feedback: SessionFeedback,
        playedInSession: Set<String>
    ): Float {
        var score = 50.0f
        val trackText = "${track.title} ${track.artist}".lowercase()

        // 1. Severe penalty if played in current session (Recency Control)
        if (playedInSession.contains(track.id)) {
            score -= 80f
        }

        // 2. Penalty for tracks recently played in history
        if (context.recentTrackTitles.any { it.contains(track.title, ignoreCase = true) }) {
            score -= 20f
        }

        // 3. Skip penalty (Section 28: rapid skips penalize artist/track)
        if (context.skippedTrackIds.contains(track.id) || feedback.skippedTracks.contains(track.id)) {
            score -= 35f
        }

        // 4. Feedback signals: More Like This / Less Like This
        if (feedback.boostedArtists.any { track.artist.contains(it, ignoreCase = true) }) {
            score += 30f
        }
        if (feedback.dislikedArtists.any { track.artist.contains(it, ignoreCase = true) }) {
            score -= 60f
        }
        if (feedback.dislikedTrackIds.contains(track.id)) {
            score -= 100f
        }

        // 5. Energy alignment (considering user energy adjustments)
        val effectiveTargetEnergy = (plan.targetEnergy + feedback.energyAdjustment).coerceIn(1, 100)
        val trackEnergy = estimateTrackEnergy(track)
        val energyDelta = abs(effectiveTargetEnergy - trackEnergy)
        score -= (energyDelta * 0.3f)

        // 6. Discovery Control (Familiar 0.0 <-> Discover 1.0)
        val discovery = (plan.discoveryRatio + feedback.discoveryAdjustment).coerceIn(0.0f, 1.0f)
        val isFamiliar = track.isLiked || context.recentTrackTitles.any { it.contains(track.title, ignoreCase = true) }
        if (isFamiliar) {
            // Reward familiar if discovery slider is low
            score += (1.0f - discovery) * 35f
        } else {
            // Reward novelty if discovery slider is high
            score += discovery * 35f
        }

        // 7. Plan seed matching
        if (plan.primaryGenres.any { trackText.contains(it.lowercase()) }) score += 18f
        if (plan.targetMoods.any { trackText.contains(it.lowercase()) }) score += 12f
        if (plan.seedArtists.any { track.artist.contains(it, ignoreCase = true) }) score += 22f

        return score
    }

    private fun estimateTrackEnergy(track: Track): Int {
        val title = track.title.lowercase()
        return when {
            title.contains("workout") || title.contains("overdrive") || title.contains("synth") || title.contains("pulse") -> 85
            title.contains("drive") || title.contains("neon") || title.contains("speed") -> 70
            title.contains("chill") || title.contains("rain") || title.contains("night") -> 35
            title.contains("sleep") || title.contains("ambient") || title.contains("drift") -> 20
            else -> track.pulseScore
        }
    }

    private fun isLanguageMatch(track: Track, lang: String): Boolean {
        val text = "${track.title} ${track.artist}".lowercase()
        return when (lang.lowercase()) {
            "malay" -> text.contains("melayu") || text.contains("kuala") || text.contains("hujan") || text.contains("hati")
            "indonesian" -> text.contains("senja") || text.contains("malam") || text.contains("rindu")
            "english" -> true
            else -> false
        }
    }
}
