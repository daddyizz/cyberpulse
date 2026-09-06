package com.daddyizz.cyberpulse.core.recommendation

/**
 * AI Provider Abstraction for CyberPulse Music.
 *
 * Keeps provider-specific AI infrastructure completely decoupled from UI and domain models.
 * Any model (Gemini, OpenAI, Anthropic, or internal models) can be backed behind this interface
 * without changing the playback, recommendation, or UI layer.
 *
 * INVARIANT:
 * This provider produces structured INTENTS and PLANS only. It NEVER creates fake audio tracks.
 */
interface AiMusicProvider {

    /**
     * Generates a structured PlaylistIntent from a user prompt and privacy-filtered listener context.
     */
    suspend fun generatePlaylistIntent(
        prompt: String,
        context: ListenerContext,
        targetDurationMinutes: Int? = null,
        targetTrackCount: Int? = null
    ): Result<PlaylistIntent>

    /**
     * Generates a dynamic DjSessionPlan for continuous Cyber DJ playback.
     */
    suspend fun generateDjSession(
        mode: CyberDjMode,
        context: ListenerContext,
        customEnergy: Int? = null,
        customDiscoveryRatio: Float? = null
    ): Result<DjSessionPlan>
}
