package com.daddyizz.cyberpulse.core.recommendation

import com.daddyizz.cyberpulse.core.data.MusicRepository
import com.daddyizz.cyberpulse.core.data.UserPreferences
import com.daddyizz.cyberpulse.core.model.Playlist
import com.daddyizz.cyberpulse.core.model.Track
import com.daddyizz.cyberpulse.core.provider.local.LocalMusicProvider
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * Central Orchestrator for CyberPulse's AI Discovery, Cyber DJ, and Recommendation Layer.
 *
 * Coordinates:
 * - AiMusicProvider (Backend contract)
 * - LocalRecommendationEngine (Smart offline engine & fallback)
 * - QueryPlanner (Candidate collection & source playability enforcement)
 * - CandidateRanker (Multi-signal candidate scoring)
 * - AiUsageRepository (Entitlement & quota gating)
 */
class RecommendationEngine(
    val musicRepository: MusicRepository,
    val localMusicProvider: LocalMusicProvider? = null,
    val aiProvider: AiMusicProvider = BackendAiMusicProvider(),
    val aiUsageRepository: AiUsageRepository? = null,
    val localEngine: LocalRecommendationEngine = LocalRecommendationEngine(musicRepository, localMusicProvider),
    val queryPlanner: QueryPlanner = QueryPlanner(musicRepository, localMusicProvider),
    val ranker: CandidateRanker = CandidateRanker()
) {

    /**
     * Generates a fully resolved playlist from a user prompt.
     * Enforces privacy controls, quota checks, source-aware filtering, and local fallback.
     */
    suspend fun generateAiPlaylist(
        prompt: String,
        userPreferences: UserPreferences,
        resolutionMode: PlaylistResolutionMode = PlaylistResolutionMode.PLAYABLE_NOW,
        targetDurationMinutes: Int? = 45,
        targetTrackCount: Int? = 15
    ): Result<ResolvedPlaylist> = withContext(Dispatchers.Default) {
        val trimmedPrompt = prompt.trim()
        if (trimmedPrompt.isBlank()) {
            return@withContext Result.failure(IllegalArgumentException("Prompt cannot be empty"))
        }

        // 1. Quota & Entitlement check
        val canGenerate = aiUsageRepository?.canGenerateAiPlaylist() ?: true
        if (!canGenerate) {
            return@withContext Result.failure(Exception(AiGenerationError.QuotaExceeded.message))
        }

        // 2. Build privacy-compliant listener context
        val context = ListenerContextBuilder.build(
            userPreferences = userPreferences,
            musicRepository = musicRepository,
            localTrackCount = localMusicProvider?.getTracks()?.size ?: 0
        )

        // 3. Request intent from AI provider (with automatic fallback to local rule-engine)
        val intentResult = aiProvider.generatePlaylistIntent(
            prompt = trimmedPrompt,
            context = context,
            targetDurationMinutes = targetDurationMinutes,
            targetTrackCount = targetTrackCount
        )

        val resolvedIntent = intentResult.getOrElse {
            // Seamless offline fallback
            localEngine.createFallbackIntent(trimmedPrompt, context)
        }

        // 4. Resolve candidates against real available sources
        val candidates = queryPlanner.resolveIntentCandidates(resolvedIntent, resolutionMode)
        val finalTracks: List<Track>

        if (candidates.isNotEmpty()) {
            // 5. Rank candidates using multi-signal scoring
            val ranked = ranker.rankForIntent(
                candidates = candidates,
                intent = resolvedIntent,
                context = context,
                targetCount = resolvedIntent.targetTrackCount
            )
            finalTracks = ranked.ifEmpty { candidates.take(resolvedIntent.targetTrackCount) }
        } else {
            // Guaranteed fallback tracks from built-in verified audio catalog
            finalTracks = musicRepository.fallbackProvider.getAllTracks().take(resolvedIntent.targetTrackCount)
        }

        val composition = queryPlanner.computeComposition(finalTracks)
        val resolvedPlaylist = ResolvedPlaylist(
            title = resolvedIntent.title,
            description = resolvedIntent.description,
            intent = resolvedIntent,
            tracks = finalTracks,
            resolutionMode = resolutionMode,
            sourceComposition = composition
        )

        // Record successful generation quota
        aiUsageRepository?.recordGeneration()

        Result.success(resolvedPlaylist)
    }

    /**
     * Refines an existing playlist intent based on dynamic feedback (e.g. "more energy", "less pop").
     */
    suspend fun refinePlaylist(
        existing: ResolvedPlaylist,
        refinementText: String,
        userPreferences: UserPreferences
    ): Result<ResolvedPlaylist> = withContext(Dispatchers.Default) {
        val ref = refinementText.lowercase().trim()
        val currentIntent = existing.intent

        var updatedEnergy = currentIntent.energy ?: 50
        val updatedGenres = currentIntent.genres.toMutableList()
        val updatedExcluded = currentIntent.excludedArtists.toMutableList()

        if (ref.contains("more energy") || ref.contains("faster") || ref.contains("hype")) {
            updatedEnergy = (updatedEnergy + 25).coerceAtMost(100)
        }
        if (ref.contains("chill") || ref.contains("slower") || ref.contains("calm")) {
            updatedEnergy = (updatedEnergy - 25).coerceAtLeast(15)
        }
        if (ref.contains("less rock")) {
            updatedGenres.removeIf { it.contains("rock", ignoreCase = true) }
        }
        if (ref.contains("more synth") || ref.contains("synthwave")) {
            if (!updatedGenres.contains("Synthwave")) updatedGenres.add("Synthwave")
        }

        val updatedIntent = currentIntent.copy(
            energy = updatedEnergy,
            genres = updatedGenres,
            excludedArtists = updatedExcluded,
            description = "${currentIntent.description ?: ""} (Refined: $refinementText)"
        )

        val candidates = queryPlanner.resolveIntentCandidates(updatedIntent, existing.resolutionMode)
        val context = ListenerContextBuilder.build(userPreferences, musicRepository)
        val ranked = ranker.rankForIntent(candidates, updatedIntent, context, updatedIntent.targetTrackCount)
        val finalTracks = ranked.ifEmpty { existing.tracks }

        val composition = queryPlanner.computeComposition(finalTracks)

        Result.success(
            existing.copy(
                intent = updatedIntent,
                tracks = finalTracks,
                sourceComposition = composition
            )
        )
    }

    /**
     * Saves a generated playlist permanently to user playlists.
     */
    fun saveResolvedPlaylist(resolved: ResolvedPlaylist, customTitle: String? = null): Playlist {
        val finalTitle = customTitle?.takeIf { it.isNotBlank() } ?: resolved.title
        val playlist = musicRepository.createPlaylist(
            title = finalTitle,
            description = resolved.description ?: "AI Generated Mix"
        )
        resolved.tracks.forEach { track ->
            musicRepository.addTrackToPlaylist(playlist.id, track)
        }
        return playlist.copy(tracks = resolved.tracks, trackCount = resolved.tracks.size)
    }

    /**
     * Retrieves personalized smart mixes for the home dashboard.
     */
    fun getSmartMixes(): List<Playlist> {
        return localEngine.getSmartMixes()
    }
}
