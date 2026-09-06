package com.daddyizz.cyberpulse.core.analytics

import com.daddyizz.cyberpulse.core.model.MusicSource

/**
 * CyberPulse Replay annual listening recap domain model.
 */
data class CyberPulseReplayData(
    val year: Int,
    val isPreliminary: Boolean, // true if current year is ongoing ("Your 2026 Replay So Far")
    val isEligible: Boolean,    // true if >= 100 qualified plays OR >= 300 minutes
    val qualifiedPlaysCount: Int,
    val totalMinutes: Long,
    val totalSongs: Int,
    val uniqueArtistsCount: Int,
    val topSong: TrackPlayStat?,
    val topArtist: ArtistPlayStat?,
    val top5Artists: List<ArtistPlayStat>,
    val top10Songs: List<TrackPlayStat>,
    val favoriteGenre: String?,
    val favoriteListeningTime: String,
    val longestStreakDays: Int,
    val cyberDjMinutes: Long,
    val favoriteDjMode: String?,
    val roadListeningMinutes: Long,
    val topRoadSong: String?,
    val primarySource: MusicSource?,
    val personalityTitle: String,
    val personalityDescription: String,
    val eligibilityProgressFraction: Float
) {
    val totalHours: Long get() = totalMinutes / 60L

    companion object {
        fun ineligible(year: Int, currentPlays: Int, currentMinutes: Long): CyberPulseReplayData {
            val playFraction = (currentPlays / 100f).coerceIn(0f, 1f)
            val minuteFraction = (currentMinutes / 300f).coerceIn(0f, 1f)
            val maxFraction = maxOf(playFraction, minuteFraction)

            return CyberPulseReplayData(
                year = year,
                isPreliminary = true,
                isEligible = false,
                qualifiedPlaysCount = currentPlays,
                totalMinutes = currentMinutes,
                totalSongs = 0,
                uniqueArtistsCount = 0,
                topSong = null,
                topArtist = null,
                top5Artists = emptyList(),
                top10Songs = emptyList(),
                favoriteGenre = null,
                favoriteListeningTime = "Pending",
                longestStreakDays = 0,
                cyberDjMinutes = 0L,
                favoriteDjMode = null,
                roadListeningMinutes = 0L,
                topRoadSong = null,
                primarySource = null,
                personalityTitle = "Rising Listener",
                personalityDescription = "Keep listening to unlock your CyberPulse stats and annual Replay cards.",
                eligibilityProgressFraction = maxFraction
            )
        }
    }
}

/**
 * Visual card definitions for the Replay story presentation.
 */
sealed class ReplayStoryCard {
    data class Intro(val year: Int, val isPreliminary: Boolean) : ReplayStoryCard()
    data class TotalMinutes(val minutes: Long, val hours: Long) : ReplayStoryCard()
    data class SongsAndArtists(val songCount: Int, val artistCount: Int) : ReplayStoryCard()
    data class TopSong(val stat: TrackPlayStat) : ReplayStoryCard()
    data class TopArtist(val stat: ArtistPlayStat) : ReplayStoryCard()
    data class Top5Artists(val artists: List<ArtistPlayStat>) : ReplayStoryCard()
    data class Top10Songs(val songs: List<TrackPlayStat>) : ReplayStoryCard()
    data class GenreHighlight(val genre: String) : ReplayStoryCard()
    data class ListeningHabits(val peakWindow: String, val streakDays: Int) : ReplayStoryCard()
    data class CyberDjHighlight(val minutes: Long, val mode: String) : ReplayStoryCard()
    data class RoadListeningHighlight(val roadMinutes: Long, val topSong: String?) : ReplayStoryCard()
    data class PrimarySourceHighlight(val source: MusicSource) : ReplayStoryCard()
    data class PersonalitySummary(val title: String, val description: String) : ReplayStoryCard()
    data class FinalShareCard(val replayData: CyberPulseReplayData) : ReplayStoryCard()
}
