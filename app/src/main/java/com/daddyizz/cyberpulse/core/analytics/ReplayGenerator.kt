package com.daddyizz.cyberpulse.core.analytics

import com.daddyizz.cyberpulse.core.model.MusicSource
import java.util.*

/**
 * Generates the annual CyberPulse Replay recap based purely on genuine recorded listening events.
 */
object ReplayGenerator {

    const val MIN_REPLAY_QUALIFIED_PLAYS = 100
    const val MIN_REPLAY_MINUTES = 300L // 5 hours

    fun generateReplay(
        events: List<ListeningEvent>,
        year: Int,
        streakResult: ListeningStreakCalculator.StreakResult
    ): CyberPulseReplayData {
        val cal = Calendar.getInstance()
        val currentYear = cal.get(Calendar.YEAR)
        val isPreliminary = (year >= currentYear)

        val yearStart = Calendar.getInstance().apply {
            set(year, Calendar.JANUARY, 1, 0, 0, 0)
            set(Calendar.MILLISECOND, 0)
        }.timeInMillis

        val yearEnd = Calendar.getInstance().apply {
            set(year, Calendar.DECEMBER, 31, 23, 59, 59)
            set(Calendar.MILLISECOND, 999)
        }.timeInMillis

        val yearEvents = events.filter { it.startedAt in yearStart..yearEnd }
        val qualifiedEvents = yearEvents.filter { it.isQualifiedPlay }

        val totalMinutes = yearEvents.sumOf { it.listenedMs } / 60_000L
        val qualifiedPlaysCount = qualifiedEvents.size

        val isEligible = qualifiedPlaysCount >= MIN_REPLAY_QUALIFIED_PLAYS || totalMinutes >= MIN_REPLAY_MINUTES

        if (!isEligible) {
            return CyberPulseReplayData.ineligible(
                year = year,
                currentPlays = qualifiedPlaysCount,
                currentMinutes = totalMinutes
            )
        }

        val totalSongs = yearEvents.map { it.trackId }.distinct().size
        val uniqueArtists = yearEvents.mapNotNull { it.artistSnapshot?.trim() }.filter { it.isNotBlank() }.distinct()

        // Top Tracks
        val trackGroups = qualifiedEvents.groupBy { it.trackId }
        val rankedTracks = trackGroups.map { (trackId, trackEvents) ->
            val first = trackEvents.first()
            TrackPlayStat(
                trackId = trackId,
                title = first.titleSnapshot,
                artist = first.artistSnapshot ?: "Unknown Artist",
                album = first.albumSnapshot,
                source = first.source,
                playCount = trackEvents.size,
                totalListenedMs = trackEvents.sumOf { it.listenedMs }
            )
        }.sortedWith(compareByDescending<TrackPlayStat> { it.playCount }.thenByDescending { it.totalListenedMs })

        val topSong = rankedTracks.firstOrNull()
        val top10Songs = rankedTracks.take(10)

        // Top Artists
        val artistGroups = qualifiedEvents
            .filter { !it.artistSnapshot.isNullOrBlank() }
            .groupBy { it.artistSnapshot!!.trim() }
        val rankedArtists = artistGroups.map { (artistName, artistEvents) ->
            ArtistPlayStat(
                artistName = artistName,
                playCount = artistEvents.size,
                totalListenedMs = artistEvents.sumOf { it.listenedMs },
                uniqueTracksCount = artistEvents.map { it.trackId }.distinct().size
            )
        }.sortedWith(compareByDescending<ArtistPlayStat> { it.totalListenedMs }.thenByDescending { it.playCount })

        val topArtist = rankedArtists.firstOrNull()
        val top5Artists = rankedArtists.take(5)

        // Favorite Genre
        val favoriteGenre = qualifiedEvents
            .mapNotNull { it.genreSnapshot?.trim() }
            .filter { it.isNotBlank() }
            .groupingBy { it }
            .eachCount()
            .maxByOrNull { it.value }?.key

        // Time of day calculation
        var morningMin = 0L
        var afternoonMin = 0L
        var eveningMin = 0L
        var lateNightMin = 0L

        for (e in yearEvents) {
            cal.timeInMillis = e.startedAt
            val h = cal.get(Calendar.HOUR_OF_DAY)
            val min = e.listenedMs / 60_000L
            when (h) {
                in 5..11 -> morningMin += min
                in 12..16 -> afternoonMin += min
                in 17..21 -> eveningMin += min
                else -> lateNightMin += min
            }
        }

        val favoriteListeningTime = when {
            lateNightMin >= morningMin && lateNightMin >= afternoonMin && lateNightMin >= eveningMin ->
                "Late Night (22:00 - 04:59)"
            eveningMin >= morningMin && eveningMin >= afternoonMin ->
                "Evening (17:00 - 21:59)"
            afternoonMin >= morningMin ->
                "Afternoon (12:00 - 16:59)"
            else ->
                "Morning (05:00 - 11:59)"
        }

        // Cyber DJ & Android Auto
        val djEvents = yearEvents.filter { it.playbackContext == PlaybackContext.CYBER_DJ }
        val cyberDjMinutes = djEvents.sumOf { it.listenedMs } / 60_000L
        val favoriteDjMode = djEvents
            .mapNotNull { it.extraMetadata }
            .groupingBy { it }
            .eachCount()
            .maxByOrNull { it.value }?.key

        val roadEvents = yearEvents.filter { it.playbackContext == PlaybackContext.ANDROID_AUTO }
        val roadMinutes = roadEvents.sumOf { it.listenedMs } / 60_000L
        val topRoadSong = roadEvents
            .groupingBy { it.titleSnapshot }
            .eachCount()
            .maxByOrNull { it.value }?.key

        // Primary Source
        val primarySource = yearEvents
            .groupingBy { it.source }
            .eachCount()
            .maxByOrNull { it.value }?.key

        // Sonic Personality determination
        val (personalityTitle, personalityDesc) = determinePersonality(
            totalMinutes = totalMinutes,
            lateNightMin = lateNightMin,
            roadMinutes = roadMinutes,
            cyberDjMinutes = cyberDjMinutes,
            primarySource = primarySource,
            uniqueArtistsCount = uniqueArtists.size,
            qualifiedPlaysCount = qualifiedPlaysCount,
            topSongPlays = topSong?.playCount ?: 0
        )

        return CyberPulseReplayData(
            year = year,
            isPreliminary = isPreliminary,
            isEligible = true,
            qualifiedPlaysCount = qualifiedPlaysCount,
            totalMinutes = totalMinutes,
            totalSongs = totalSongs,
            uniqueArtistsCount = uniqueArtists.size,
            topSong = topSong,
            topArtist = topArtist,
            top5Artists = top5Artists,
            top10Songs = top10Songs,
            favoriteGenre = favoriteGenre,
            favoriteListeningTime = favoriteListeningTime,
            longestStreakDays = streakResult.longestStreakDays,
            cyberDjMinutes = cyberDjMinutes,
            favoriteDjMode = favoriteDjMode,
            roadListeningMinutes = roadMinutes,
            topRoadSong = topRoadSong,
            primarySource = primarySource,
            personalityTitle = personalityTitle,
            personalityDescription = personalityDesc,
            eligibilityProgressFraction = 1.0f
        )
    }

    private fun determinePersonality(
        totalMinutes: Long,
        lateNightMin: Long,
        roadMinutes: Long,
        cyberDjMinutes: Long,
        primarySource: MusicSource?,
        uniqueArtistsCount: Int,
        qualifiedPlaysCount: Int,
        topSongPlays: Int
    ): Pair<String, String> {
        val lateNightFraction = if (totalMinutes > 0) lateNightMin.toFloat() / totalMinutes else 0f
        val roadFraction = if (totalMinutes > 0) roadMinutes.toFloat() / totalMinutes else 0f
        val djFraction = if (totalMinutes > 0) cyberDjMinutes.toFloat() / totalMinutes else 0f
        val topSongFraction = if (qualifiedPlaysCount > 0) topSongPlays.toFloat() / qualifiedPlaysCount else 0f
        val artistVariety = if (qualifiedPlaysCount > 0) uniqueArtistsCount.toFloat() / qualifiedPlaysCount else 0f

        return when {
            lateNightFraction > 0.35f -> Pair(
                "Night Driver",
                "Your auditory world truly comes alive after dark, fueling midnight focus and neon dreams."
            )
            roadFraction > 0.20f -> Pair(
                "Road Warrior",
                "Miles of asphalt and endless playlists. The road is your concert hall."
            )
            primarySource == MusicSource.RADIO -> Pair(
                "Radio Wanderer",
                "Tuned into live frequencies around the globe, embracing spontaneity and serendipity."
            )
            primarySource == MusicSource.LOCAL || primarySource == MusicSource.LOCAL_STORAGE -> Pair(
                "Local Library Loyalist",
                "You curate your sound meticulously, treasuring high-fidelity audio stored on your own device."
            )
            djFraction > 0.25f -> Pair(
                "Cyber DJ Connoisseur",
                "Guided by algorithmic continuous discovery and dynamic pulse transitions."
            )
            topSongFraction > 0.15f -> Pair(
                "Repeat Specialist",
                "When you discover a sound that resonates, you immerse yourself in it until it becomes memory."
            )
            artistVariety > 0.55f -> Pair(
                "Genre Explorer",
                "An insatiable sonic palate, perpetually charting new artists and frontier soundscapes."
            )
            else -> Pair(
                "Sonic Navigator",
                "A balanced pulse of deep favorites and deliberate musical expeditions."
            )
        }
    }

    fun buildStoryCards(replay: CyberPulseReplayData): List<ReplayStoryCard> {
        val cards = mutableListOf<ReplayStoryCard>()

        // 1. Intro
        cards.add(ReplayStoryCard.Intro(replay.year, replay.isPreliminary))

        // 2. Total Minutes & Hours
        cards.add(ReplayStoryCard.TotalMinutes(replay.totalMinutes, replay.totalHours))

        // 3. Songs & Artists Count
        cards.add(ReplayStoryCard.SongsAndArtists(replay.totalSongs, replay.uniqueArtistsCount))

        // 4. Top Song
        replay.topSong?.let { cards.add(ReplayStoryCard.TopSong(it)) }

        // 5. Top Artist
        replay.topArtist?.let { cards.add(ReplayStoryCard.TopArtist(it)) }

        // 6. Top 5 Artists
        if (replay.top5Artists.isNotEmpty()) {
            cards.add(ReplayStoryCard.Top5Artists(replay.top5Artists))
        }

        // 7. Top 10 Songs
        if (replay.top10Songs.isNotEmpty()) {
            cards.add(ReplayStoryCard.Top10Songs(replay.top10Songs))
        }

        // 8. Favorite Genre
        replay.favoriteGenre?.let { cards.add(ReplayStoryCard.GenreHighlight(it)) }

        // 9. Listening Habits (Peak Window + Streak)
        cards.add(ReplayStoryCard.ListeningHabits(replay.favoriteListeningTime, replay.longestStreakDays))

        // 10. Cyber DJ Highlight (if used)
        if (replay.cyberDjMinutes > 0 && replay.favoriteDjMode != null) {
            cards.add(ReplayStoryCard.CyberDjHighlight(replay.cyberDjMinutes, replay.favoriteDjMode))
        }

        // 11. Android Auto Road Highlight (if used)
        if (replay.roadListeningMinutes > 0) {
            cards.add(ReplayStoryCard.RoadListeningHighlight(replay.roadListeningMinutes, replay.topRoadSong))
        }

        // 12. Primary Source Highlight
        replay.primarySource?.let { cards.add(ReplayStoryCard.PrimarySourceHighlight(it)) }

        // 13. Personality Summary
        cards.add(ReplayStoryCard.PersonalitySummary(replay.personalityTitle, replay.personalityDescription))

        // 14. Final Share Card
        cards.add(ReplayStoryCard.FinalShareCard(replay))

        return cards
    }
}
