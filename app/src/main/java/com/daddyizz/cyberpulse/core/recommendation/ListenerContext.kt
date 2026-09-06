package com.daddyizz.cyberpulse.core.recommendation

import com.daddyizz.cyberpulse.core.data.MusicRepository
import com.daddyizz.cyberpulse.core.data.UserPreferences
import com.daddyizz.cyberpulse.core.model.MusicSource
import java.util.Calendar

/**
 * Encapsulates privacy-safe listening context derived from real on-device CyberPulse state.
 *
 * PRIVACY GUARD:
 * If user disables Personalized Recommendations or AI Personalization in Settings,
 * all listening history, liked tracks, and profile affinities are strictly stripped,
 * producing a generic, neutral context containing only time of day.
 * No private file paths, purchase tokens, or PII are ever included.
 */
data class ListenerContext(
    val isPersonalizationEnabled: Boolean,
    val timeOfDay: String,
    val preferredLanguages: List<String> = emptyList(),
    val favoriteGenres: List<String> = emptyList(),
    val favoriteArtists: List<String> = emptyList(),
    val likedTrackTitles: List<String> = emptyList(),
    val recentTrackTitles: List<String> = emptyList(),
    val skippedTrackIds: Set<String> = emptySet(),
    val localTrackCount: Int = 0,
    val availableSources: List<MusicSource> = listOf(MusicSource.LOCAL, MusicSource.RADIO, MusicSource.DEMO)
) {
    companion object {
        fun generic(languages: List<String> = listOf("English", "Malay", "Indonesian")): ListenerContext {
            return ListenerContext(
                isPersonalizationEnabled = false,
                timeOfDay = resolveTimeOfDay(),
                preferredLanguages = languages
            )
        }

        fun resolveTimeOfDay(): String {
            val hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
            return when (hour) {
                in 5..11 -> "Morning"
                in 12..16 -> "Afternoon"
                in 17..21 -> "Evening"
                else -> "Late Night"
            }
        }
    }
}

/**
 * Builds ListenerContext obeying user privacy controls.
 */
object ListenerContextBuilder {

    fun build(
        userPreferences: UserPreferences,
        musicRepository: MusicRepository,
        localTrackCount: Int = 0,
        skippedIds: Set<String> = emptySet()
    ): ListenerContext {
        val timeOfDay = ListenerContext.resolveTimeOfDay()
        val languages = userPreferences.preferredLanguages.toList()

        // Section 7: If recommendations or AI personalization is OFF, return strictly generic context
        if (!userPreferences.recommendationsEnabled || !userPreferences.aiPersonalizationEnabled) {
            return ListenerContext(
                isPersonalizationEnabled = false,
                timeOfDay = timeOfDay,
                preferredLanguages = languages,
                localTrackCount = localTrackCount
            )
        }

        val likedTitles = if (userPreferences.listeningHistoryForRecommendationsEnabled) {
            musicRepository.getLikedTracks().take(15).map { "${it.title} by ${it.artist}" }
        } else {
            emptyList()
        }

        val recentTitles = if (userPreferences.listeningHistoryForRecommendationsEnabled) {
            musicRepository.recentlyPlayed.value.take(10).map { "${it.title} by ${it.artist}" }
        } else {
            emptyList()
        }

        val favoriteArtists = userPreferences.selectedArtists.toList()
        val favoriteGenres = userPreferences.selectedGenres.toList()

        return ListenerContext(
            isPersonalizationEnabled = true,
            timeOfDay = timeOfDay,
            preferredLanguages = languages,
            favoriteGenres = favoriteGenres,
            favoriteArtists = favoriteArtists,
            likedTrackTitles = likedTitles,
            recentTrackTitles = recentTitles,
            skippedTrackIds = skippedIds,
            localTrackCount = localTrackCount
        )
    }
}
