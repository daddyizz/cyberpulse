package com.daddyizz.cyberpulse.core.analytics

import java.text.SimpleDateFormat
import java.util.*
import java.util.concurrent.TimeUnit

/**
 * Calculates current and longest listening streaks strictly based on real daily listening activity.
 * Rule (Section 16): A day qualifies if listening time >= 10 minutes OR >= 3 qualified plays.
 */
object ListeningStreakCalculator {

    const val MIN_QUALIFYING_MINUTES = 10L
    const val MIN_QUALIFYING_PLAYS = 3

    data class StreakResult(
        val currentStreakDays: Int,
        val longestStreakDays: Int,
        val activeDaysCount: Int
    )

    fun calculateStreaks(activities: List<ListeningAnalyticsDatabase.DayActivity>): StreakResult {
        if (activities.isEmpty()) {
            return StreakResult(0, 0, 0)
        }

        val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.US)
        val qualifyingDates = activities
            .filter { it.minutes >= MIN_QUALIFYING_MINUTES || it.qualifiedPlays >= MIN_QUALIFYING_PLAYS }
            .mapNotNull {
                try {
                    dateFormat.parse(it.dateKey)
                } catch (e: Exception) {
                    null
                }
            }
            .sorted()

        if (qualifyingDates.isEmpty()) {
            return StreakResult(0, 0, 0)
        }

        // Distinct calendar days
        val distinctDayEpochs = qualifyingDates.map { dateToDayEpoch(it) }.distinct()

        var longestStreak = 0
        var currentRunningStreak = 0
        var prevDayEpoch = -1L

        for (dayEpoch in distinctDayEpochs) {
            if (prevDayEpoch == -1L) {
                currentRunningStreak = 1
            } else if (dayEpoch == prevDayEpoch + 1) {
                currentRunningStreak++
            } else {
                currentRunningStreak = 1
            }
            if (currentRunningStreak > longestStreak) {
                longestStreak = currentRunningStreak
            }
            prevDayEpoch = dayEpoch
        }

        // Calculate current active streak relative to today
        val todayEpoch = dateToDayEpoch(Date())
        val lastDayEpoch = distinctDayEpochs.last()

        val currentStreak = if (lastDayEpoch == todayEpoch || lastDayEpoch == todayEpoch - 1) {
            // Count backwards from the last consecutive day
            var streak = 0
            var checkEpoch = lastDayEpoch
            for (i in distinctDayEpochs.indices.reversed()) {
                if (distinctDayEpochs[i] == checkEpoch) {
                    streak++
                    checkEpoch--
                } else {
                    break
                }
            }
            streak
        } else {
            0
        }

        return StreakResult(
            currentStreakDays = currentStreak,
            longestStreakDays = maxOf(longestStreak, currentStreak),
            activeDaysCount = distinctDayEpochs.size
        )
    }

    private fun dateToDayEpoch(date: Date): Long {
        val cal = Calendar.getInstance().apply {
            time = date
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }
        return TimeUnit.MILLISECONDS.toDays(cal.timeInMillis)
    }
}
