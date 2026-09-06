package com.daddyizz.cyberpulse.core.analytics

import android.content.Context
import com.daddyizz.cyberpulse.core.billing.EntitlementRepository
import com.daddyizz.cyberpulse.core.billing.PremiumFeature
import com.daddyizz.cyberpulse.core.data.UserPreferencesRepository
import com.daddyizz.cyberpulse.core.model.MusicSource
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.withContext
import java.util.*

/**
 * Authoritative single repository managing CyberPulse playback analytics, statistics computations,
 * replay generation, and user privacy constraints.
 */
class ListeningAnalyticsRepository(
    private val context: Context,
    private val database: ListeningAnalyticsDatabase = ListeningAnalyticsDatabase.getInstance(context),
    private val preferencesRepository: UserPreferencesRepository,
    private val entitlementRepository: EntitlementRepository
) {

    /**
     * Records a completed or skipped track playback event.
     * Enforces privacy: if user has disabled analytics tracking in settings, event is dropped immediately.
     */
    suspend fun recordEvent(event: ListeningEvent) = withContext(Dispatchers.IO) {
        val prefs = preferencesRepository.userPreferencesFlow.firstOrNull()
        // If user disabled analytics tracking, do not record
        val trackingEnabled = prefs?.listeningHistoryForRecommendationsEnabled ?: true
        if (!trackingEnabled) return@withContext

        database.insertEvent(event)
    }

    /**
     * Records an external YouTube video viewing session.
     * Stored separately under MusicSource.YOUTUBE and marked as YouTube Activity.
     */
    suspend fun recordYouTubeSession(
        durationMs: Long,
        title: String,
        videoId: String
    ) = withContext(Dispatchers.IO) {
        val prefs = preferencesRepository.userPreferencesFlow.firstOrNull()
        val trackingEnabled = prefs?.listeningHistoryForRecommendationsEnabled ?: true
        if (!trackingEnabled) return@withContext

        val now = System.currentTimeMillis()
        val isQualified = durationMs >= 30_000L
        val event = ListeningEvent(
            id = UUID.randomUUID().toString(),
            trackId = "yt_$videoId",
            source = MusicSource.YOUTUBE,
            sourceId = videoId,
            titleSnapshot = title,
            artistSnapshot = "YouTube Audio",
            albumSnapshot = null,
            genreSnapshot = null,
            startedAt = now - durationMs,
            endedAt = now,
            listenedMs = durationMs,
            trackDurationMs = durationMs,
            completionRatio = 1.0,
            isQualifiedPlay = isQualified,
            skipType = SkipType.NONE,
            sessionId = "yt_session_${now / (1000 * 60 * 30)}",
            playbackContext = PlaybackContext.OTHER,
            extraMetadata = "YouTube Embedded View"
        )
        database.insertEvent(event)
    }

    /**
     * Computes listening statistics for the specified period.
     */
    suspend fun getStats(period: ListeningPeriod): ListeningStats = withContext(Dispatchers.IO) {
        val now = System.currentTimeMillis()
        val (fromMs, toMs) = calculatePeriodBounds(period, now)

        val events = database.getEventsBetween(fromMs, toMs)
        val dailyActivities = database.getDailyActivitySummaries()
        val streakResult = ListeningStreakCalculator.calculateStreaks(dailyActivities)
        val earliestTimestamp = database.getEarliestEventTimestamp()
        val isPro = entitlementRepository.canUse(PremiumFeature.ADVANCED_STATS)

        ListeningStatsEngine.computeStats(
            events = events,
            period = period,
            streakResult = streakResult,
            earliestTimestamp = earliestTimestamp,
            isPro = isPro
        )
    }

    /**
     * Computes the annual CyberPulse Replay data.
     */
    suspend fun getReplay(year: Int): CyberPulseReplayData = withContext(Dispatchers.IO) {
        val yearStart = Calendar.getInstance().apply {
            set(year, Calendar.JANUARY, 1, 0, 0, 0)
            set(Calendar.MILLISECOND, 0)
        }.timeInMillis

        val yearEnd = Calendar.getInstance().apply {
            set(year, Calendar.DECEMBER, 31, 23, 59, 59)
            set(Calendar.MILLISECOND, 999)
        }.timeInMillis

        val events = database.getEventsBetween(yearStart, yearEnd)
        val dailyActivities = database.getDailyActivitySummaries()
        val streakResult = ListeningStreakCalculator.calculateStreaks(dailyActivities)

        ReplayGenerator.generateReplay(events, year, streakResult)
    }

    /**
     * Permanently deletes all listening history, daily aggregates, and replay snapshots.
     */
    suspend fun clearAllAnalytics() = withContext(Dispatchers.IO) {
        database.clearAllListeningData()
    }

    /**
     * Returns whether the database has any recorded events.
     */
    suspend fun hasRecordedData(): Boolean = withContext(Dispatchers.IO) {
        database.getTotalListenedMs() > 0L
    }

    private fun calculatePeriodBounds(period: ListeningPeriod, now: Long): Pair<Long, Long> {
        val cal = Calendar.getInstance()
        cal.timeInMillis = now

        return when (period) {
            ListeningPeriod.WEEK_7_DAYS -> {
                cal.add(Calendar.DAY_OF_YEAR, -7)
                cal.set(Calendar.HOUR_OF_DAY, 0)
                cal.set(Calendar.MINUTE, 0)
                cal.set(Calendar.SECOND, 0)
                Pair(cal.timeInMillis, now)
            }
            ListeningPeriod.MONTH_30_DAYS -> {
                cal.add(Calendar.DAY_OF_YEAR, -30)
                cal.set(Calendar.HOUR_OF_DAY, 0)
                cal.set(Calendar.MINUTE, 0)
                cal.set(Calendar.SECOND, 0)
                Pair(cal.timeInMillis, now)
            }
            ListeningPeriod.THIS_YEAR -> {
                cal.set(Calendar.MONTH, Calendar.JANUARY)
                cal.set(Calendar.DAY_OF_MONTH, 1)
                cal.set(Calendar.HOUR_OF_DAY, 0)
                cal.set(Calendar.MINUTE, 0)
                cal.set(Calendar.SECOND, 0)
                Pair(cal.timeInMillis, now)
            }
            ListeningPeriod.ALL_TIME -> {
                Pair(0L, now)
            }
        }
    }

    /**
     * Debug helper for testing analytics & replay visualization without waiting days.
     * Generates realistic qualified events tagged as Demo Data.
     */
    suspend fun populateDemoDataForTesting() = withContext(Dispatchers.IO) {
        val now = System.currentTimeMillis()
        val demoEvents = mutableListOf<ListeningEvent>()
        val cal = Calendar.getInstance()

        val sampleTracks = listOf(
            Triple("Midnight Neon", "Kavinsky & CyberPulse", "Synthwave"),
            Triple("Resonance", "HOME", "Chillwave"),
            Triple("Nightcall", "Vincent Belorgey", "Synthwave"),
            Triple("Blade Runner Blues", "Vangelis", "Ambient"),
            Triple("Turbo Killer", "Carpenter Brut", "Darksynth"),
            Triple("Daylight Overdrive", "Cyber DJ AI", "Cyberpunk"),
            Triple("Subway Pulse", "Tokyo Underground", "Electronic"),
            Triple("Neon Horizon", "Pulse Collective", "Vaporwave")
        )

        // Generate 120 events across the past 14 days
        for (i in 0 until 120) {
            val daysAgo = (i % 14)
            cal.timeInMillis = now
            cal.add(Calendar.DAY_OF_YEAR, -daysAgo)
            cal.set(Calendar.HOUR_OF_DAY, (19 + (i % 6)) % 24) // Mostly evening and late night
            cal.set(Calendar.MINUTE, (i * 17) % 60)

            val trackSample = sampleTracks[i % sampleTracks.size]
            val durationMs = 180_000L + (i * 1000L % 60_000L)
            val listenedMs = durationMs // 100% played
            val eventTime = cal.timeInMillis

            val context = when {
                i % 4 == 0 -> PlaybackContext.CYBER_DJ
                i % 5 == 0 -> PlaybackContext.ANDROID_AUTO
                i % 6 == 0 -> PlaybackContext.RADIO
                else -> PlaybackContext.HOME
            }

            val source = when {
                i % 6 == 0 -> MusicSource.RADIO
                i % 7 == 0 -> MusicSource.LOCAL
                else -> MusicSource.CYBERPULSE_TEST
            }

            demoEvents.add(
                ListeningEvent(
                    id = "demo_$i",
                    trackId = "track_${trackSample.first.hashCode()}",
                    source = source,
                    sourceId = "src_$i",
                    titleSnapshot = trackSample.first,
                    artistSnapshot = trackSample.second,
                    albumSnapshot = "CyberPulse Odyssey",
                    genreSnapshot = trackSample.third,
                    startedAt = eventTime,
                    endedAt = eventTime + listenedMs,
                    listenedMs = listenedMs,
                    trackDurationMs = durationMs,
                    completionRatio = 1.0,
                    isQualifiedPlay = true,
                    skipType = SkipType.NONE,
                    sessionId = "demo_session_${eventTime / (1000 * 60 * 60)}",
                    playbackContext = context,
                    extraMetadata = if (context == PlaybackContext.CYBER_DJ) "CLUB_MODE" else null
                )
            )
        }

        database.insertEvents(demoEvents)
    }
}
