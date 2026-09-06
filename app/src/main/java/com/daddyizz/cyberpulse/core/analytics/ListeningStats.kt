package com.daddyizz.cyberpulse.core.analytics

import com.daddyizz.cyberpulse.core.model.MusicSource

data class TrackPlayStat(
    val trackId: String,
    val title: String,
    val artist: String,
    val album: String?,
    val source: MusicSource,
    val playCount: Int,
    val totalListenedMs: Long
) {
    val totalListenedMinutes: Long get() = totalListenedMs / 60_000L
}

data class ArtistPlayStat(
    val artistName: String,
    val playCount: Int,
    val totalListenedMs: Long,
    val uniqueTracksCount: Int
) {
    val totalListenedMinutes: Long get() = totalListenedMs / 60_000L
}

data class AlbumPlayStat(
    val albumName: String,
    val artistName: String,
    val playCount: Int,
    val totalListenedMs: Long
)

data class GenrePlayStat(
    val genreName: String,
    val playCount: Int,
    val percentage: Float
)

data class SourceStatItem(
    val source: MusicSource,
    val label: String,
    val totalMinutes: Long,
    val playCount: Int,
    val percentage: Float
)

data class DailyListeningBar(
    val dateKey: String, // e.g. "2026-09-01"
    val dayOfWeekLabel: String, // e.g. "Mon", "Tue"
    val minutes: Long
)

data class ListeningStats(
    val period: ListeningPeriod,
    val totalListeningMinutes: Long,
    val totalPlays: Int,
    val uniqueTracksCount: Int,
    val uniqueArtistsCount: Int,
    val dailyAverageMinutes: Double,
    val topTracks: List<TrackPlayStat>,
    val topArtists: List<ArtistPlayStat>,
    val topAlbums: List<AlbumPlayStat>,
    val topGenres: List<GenrePlayStat>,
    val sourceBreakdown: List<SourceStatItem>,
    val hourlyDistribution: Map<Int, Long>, // hour (0..23) -> minutes
    val timeOfDayCategory: String, // e.g. "Night Listener", "Morning Energizer"
    val mostActiveDayOfWeek: String, // e.g. "Saturday"
    val dailyBars: List<DailyListeningBar>,
    val currentStreakDays: Int,
    val longestStreakDays: Int,
    val cyberDjMinutes: Long,
    val cyberDjFavoriteMode: String?,
    val radioMinutes: Long,
    val localMinutes: Long,
    val androidAutoMinutes: Long,
    val youtubeMinutes: Long, // Separated & labeled as external YouTube video activity
    val trackingSinceDate: String,
    val hasMinimumData: Boolean = true,
    val isProLocked: Boolean = false
) {
    companion object {
        fun empty(period: ListeningPeriod): ListeningStats {
            return ListeningStats(
                period = period,
                totalListeningMinutes = 0L,
                totalPlays = 0,
                uniqueTracksCount = 0,
                uniqueArtistsCount = 0,
                dailyAverageMinutes = 0.0,
                topTracks = emptyList(),
                topArtists = emptyList(),
                topAlbums = emptyList(),
                topGenres = emptyList(),
                sourceBreakdown = emptyList(),
                hourlyDistribution = emptyMap(),
                timeOfDayCategory = "Not enough data yet",
                mostActiveDayOfWeek = "--",
                dailyBars = emptyList(),
                currentStreakDays = 0,
                longestStreakDays = 0,
                cyberDjMinutes = 0L,
                cyberDjFavoriteMode = null,
                radioMinutes = 0L,
                localMinutes = 0L,
                androidAutoMinutes = 0L,
                youtubeMinutes = 0L,
                trackingSinceDate = "Today",
                hasMinimumData = false,
                isProLocked = false
            )
        }
    }
}
