package com.daddyizz.cyberpulse.core.analytics

import com.daddyizz.cyberpulse.core.model.MusicSource
import java.text.SimpleDateFormat
import java.util.*

/**
 * Aggregation and analytics engine processing raw normalized listening events
 * into structured statistics models for the user interface and Replay generator.
 */
object ListeningStatsEngine {

    fun computeStats(
        events: List<ListeningEvent>,
        period: ListeningPeriod,
        streakResult: ListeningStreakCalculator.StreakResult,
        earliestTimestamp: Long?,
        isPro: Boolean = false
    ): ListeningStats {
        if (events.isEmpty()) {
            return ListeningStats.empty(period).copy(
                isProLocked = (!isPro && period != ListeningPeriod.WEEK_7_DAYS)
            )
        }

        val totalListenedMs = events.sumOf { it.listenedMs }
        val totalMinutes = totalListenedMs / 60_000L
        val qualifiedEvents = events.filter { it.isQualifiedPlay }
        val totalPlays = qualifiedEvents.size

        val uniqueTrackIds = events.map { it.trackId }.distinct()
        val uniqueArtists = events.mapNotNull { it.artistSnapshot?.trim() }.filter { it.isNotBlank() }.distinct()

        // Daily average
        val dayCount = when (period) {
            ListeningPeriod.WEEK_7_DAYS -> 7
            ListeningPeriod.MONTH_30_DAYS -> 30
            ListeningPeriod.THIS_YEAR -> {
                val cal = Calendar.getInstance()
                cal.get(Calendar.DAY_OF_YEAR).coerceAtLeast(1)
            }
            ListeningPeriod.ALL_TIME -> {
                if (earliestTimestamp != null) {
                    val days = ((System.currentTimeMillis() - earliestTimestamp) / (1000 * 60 * 60 * 24L)).toInt()
                    days.coerceAtLeast(1)
                } else 1
            }
        }
        val dailyAverageMinutes = if (dayCount > 0) totalMinutes.toDouble() / dayCount else 0.0

        // Top Tracks (Ranked by plays, weighted by duration)
        val trackGroups = qualifiedEvents.groupBy { it.trackId }
        val topTracks = trackGroups.map { (trackId, trackEvents) ->
            val first = trackEvents.first()
            val trackMs = trackEvents.sumOf { it.listenedMs }
            TrackPlayStat(
                trackId = trackId,
                title = first.titleSnapshot,
                artist = first.artistSnapshot ?: "Unknown Artist",
                album = first.albumSnapshot,
                source = first.source,
                playCount = trackEvents.size,
                totalListenedMs = trackMs
            )
        }.sortedWith(compareByDescending<TrackPlayStat> { it.playCount }.thenByDescending { it.totalListenedMs })
            .take(if (isPro) 20 else 5)

        // Top Artists
        val artistGroups = qualifiedEvents
            .filter { !it.artistSnapshot.isNullOrBlank() }
            .groupBy { it.artistSnapshot!!.trim() }
        val topArtists = artistGroups.map { (artistName, artistEvents) ->
            val artistMs = artistEvents.sumOf { it.listenedMs }
            val uniqueTracksForArtist = artistEvents.map { it.trackId }.distinct().size
            ArtistPlayStat(
                artistName = artistName,
                playCount = artistEvents.size,
                totalListenedMs = artistMs,
                uniqueTracksCount = uniqueTracksForArtist
            )
        }.sortedWith(compareByDescending<ArtistPlayStat> { it.totalListenedMs }.thenByDescending { it.playCount })
            .take(if (isPro) 15 else 5)

        // Top Albums (Only when valid album metadata exists and is not unknown)
        val albumGroups = qualifiedEvents
            .filter { !it.albumSnapshot.isNullOrBlank() && it.albumSnapshot != "Unknown" && it.albumSnapshot != "Unknown Album" }
            .groupBy { "${it.albumSnapshot}:::${it.artistSnapshot ?: ""}" }
        val topAlbums = albumGroups.map { (_, albumEvents) ->
            val first = albumEvents.first()
            AlbumPlayStat(
                albumName = first.albumSnapshot ?: "",
                artistName = first.artistSnapshot ?: "Unknown Artist",
                playCount = albumEvents.size,
                totalListenedMs = albumEvents.sumOf { it.listenedMs }
            )
        }.sortedByDescending { it.totalListenedMs }.take(10)

        // Top Genres (Only where genre metadata actually exists)
        val genreGroups = qualifiedEvents
            .filter { !it.genreSnapshot.isNullOrBlank() }
            .groupBy { it.genreSnapshot!!.trim() }
        val totalGenrePlays = genreGroups.values.sumOf { it.size }.coerceAtLeast(1)
        val topGenres = genreGroups.map { (genre, genreEvents) ->
            GenrePlayStat(
                genreName = genre,
                playCount = genreEvents.size,
                percentage = (genreEvents.size.toFloat() / totalGenrePlays) * 100f
            )
        }.sortedByDescending { it.playCount }.take(5)

        // Source Breakdown
        val sourceGroups = events.groupBy { it.source }
        val sourceBreakdown = sourceGroups.map { (source, srcEvents) ->
            val srcMinutes = srcEvents.sumOf { it.listenedMs } / 60_000L
            val pct = if (totalMinutes > 0) (srcMinutes.toFloat() / totalMinutes) * 100f else 0f
            val label = when (source) {
                MusicSource.LOCAL, MusicSource.LOCAL_STORAGE -> "Local Music"
                MusicSource.RADIO -> "Cyber Radio"
                MusicSource.YOUTUBE -> "YouTube Activity"
                MusicSource.SPOTIFY -> "Spotify Sync"
                MusicSource.CYBERPULSE_TEST, MusicSource.LOCAL_DEMO -> "CyberPulse Core"
                else -> "Other"
            }
            SourceStatItem(
                source = source,
                label = label,
                totalMinutes = srcMinutes,
                playCount = srcEvents.count { it.isQualifiedPlay },
                percentage = pct
            )
        }.sortedByDescending { it.totalMinutes }

        // Time of Day & Hourly Distribution
        val hourlyMap = mutableMapOf<Int, Long>()
        for (h in 0..23) hourlyMap[h] = 0L

        var morningMin = 0L   // 05:00 - 11:59
        var afternoonMin = 0L // 12:00 - 16:59
        var eveningMin = 0L   // 17:00 - 21:59
        var lateNightMin = 0L // 22:00 - 04:59

        val dayOfWeekMinutes = mutableMapOf<Int, Long>() // Calendar.SUNDAY .. Calendar.SATURDAY
        val cal = Calendar.getInstance()

        for (event in events) {
            cal.timeInMillis = event.startedAt
            val hour = cal.get(Calendar.HOUR_OF_DAY)
            val dayOfWeek = cal.get(Calendar.DAY_OF_WEEK)
            val eventMin = event.listenedMs / 60_000L

            hourlyMap[hour] = (hourlyMap[hour] ?: 0L) + eventMin
            dayOfWeekMinutes[dayOfWeek] = (dayOfWeekMinutes[dayOfWeek] ?: 0L) + eventMin

            when (hour) {
                in 5..11 -> morningMin += eventMin
                in 12..16 -> afternoonMin += eventMin
                in 17..21 -> eveningMin += eventMin
                else -> lateNightMin += eventMin
            }
        }

        val timeCategory = when {
            lateNightMin >= morningMin && lateNightMin >= afternoonMin && lateNightMin >= eveningMin -> "Night Listener"
            eveningMin >= morningMin && eveningMin >= afternoonMin -> "Evening Unwinder"
            afternoonMin >= morningMin -> "Afternoon Explorer"
            morningMin > 0 -> "Morning Energizer"
            else -> "Day Listener"
        }

        // Most active day of week
        val mostActiveDayEntry = dayOfWeekMinutes.maxByOrNull { it.value }
        val dayNames = arrayOf("", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday")
        val mostActiveDayStr = if (mostActiveDayEntry != null && mostActiveDayEntry.value > 0) {
            dayNames.getOrElse(mostActiveDayEntry.key) { "--" }
        } else {
            "--"
        }

        // Daily Bars for last 7 days
        val dailyBars = generateLast7DaysBars(events)

        // Context-specific metrics
        val cyberDjEvents = events.filter { it.playbackContext == PlaybackContext.CYBER_DJ }
        val cyberDjMinutes = cyberDjEvents.sumOf { it.listenedMs } / 60_000L
        val cyberDjFavoriteMode = cyberDjEvents
            .mapNotNull { it.extraMetadata }
            .groupingBy { it }
            .eachCount()
            .maxByOrNull { it.value }?.key

        val radioEvents = events.filter { it.source == MusicSource.RADIO || it.playbackContext == PlaybackContext.RADIO }
        val radioMinutes = radioEvents.sumOf { it.listenedMs } / 60_000L

        val localEvents = events.filter { it.source == MusicSource.LOCAL || it.source == MusicSource.LOCAL_STORAGE || it.playbackContext == PlaybackContext.LOCAL_LIBRARY }
        val localMinutes = localEvents.sumOf { it.listenedMs } / 60_000L

        val androidAutoEvents = events.filter { it.playbackContext == PlaybackContext.ANDROID_AUTO }
        val androidAutoMinutes = androidAutoEvents.sumOf { it.listenedMs } / 60_000L

        val youtubeEvents = events.filter { it.source == MusicSource.YOUTUBE }
        val youtubeMinutes = youtubeEvents.sumOf { it.listenedMs } / 60_000L

        val trackingSinceStr = if (earliestTimestamp != null) {
            SimpleDateFormat("MMM d, yyyy", Locale.US).format(Date(earliestTimestamp))
        } else {
            "Today"
        }

        return ListeningStats(
            period = period,
            totalListeningMinutes = totalMinutes,
            totalPlays = totalPlays,
            uniqueTracksCount = uniqueTrackIds.size,
            uniqueArtistsCount = uniqueArtists.size,
            dailyAverageMinutes = dailyAverageMinutes,
            topTracks = topTracks,
            topArtists = topArtists,
            topAlbums = topAlbums,
            topGenres = topGenres,
            sourceBreakdown = sourceBreakdown,
            hourlyDistribution = hourlyMap,
            timeOfDayCategory = timeCategory,
            mostActiveDayOfWeek = mostActiveDayStr,
            dailyBars = dailyBars,
            currentStreakDays = streakResult.currentStreakDays,
            longestStreakDays = streakResult.longestStreakDays,
            cyberDjMinutes = cyberDjMinutes,
            cyberDjFavoriteMode = cyberDjFavoriteMode,
            radioMinutes = radioMinutes,
            localMinutes = localMinutes,
            androidAutoMinutes = androidAutoMinutes,
            youtubeMinutes = youtubeMinutes,
            trackingSinceDate = trackingSinceStr,
            hasMinimumData = totalMinutes > 0 || totalPlays > 0,
            isProLocked = (!isPro && period != ListeningPeriod.WEEK_7_DAYS)
        )
    }

    private fun generateLast7DaysBars(events: List<ListeningEvent>): List<DailyListeningBar> {
        val bars = mutableListOf<DailyListeningBar>()
        val cal = Calendar.getInstance()
        val dayLabelFormat = SimpleDateFormat("EEE", Locale.US)
        val dateKeyFormat = SimpleDateFormat("yyyy-MM-dd", Locale.US)

        for (i in 6 downTo 0) {
            val targetCal = Calendar.getInstance().apply {
                add(Calendar.DAY_OF_YEAR, -i)
            }
            val dateKey = dateKeyFormat.format(targetCal.time)
            val label = dayLabelFormat.format(targetCal.time)

            // Sum minutes for events on this date
            val dayStart = targetCal.apply {
                set(Calendar.HOUR_OF_DAY, 0)
                set(Calendar.MINUTE, 0)
                set(Calendar.SECOND, 0)
                set(Calendar.MILLISECOND, 0)
            }.timeInMillis

            val dayEnd = dayStart + (24 * 60 * 60 * 1000L) - 1

            val dayMinutes = events
                .filter { it.startedAt in dayStart..dayEnd }
                .sumOf { it.listenedMs } / 60_000L

            bars.add(DailyListeningBar(dateKey, label, dayMinutes))
        }
        return bars
    }
}
