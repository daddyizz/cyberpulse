package com.daddyizz.cyberpulse.core.analytics

/**
 * Origin or interaction context in which audio playback was initiated.
 * Enables granular insights (e.g. Android Auto listening, Cyber DJ sets, Search discovery).
 */
enum class PlaybackContext {
    HOME,
    SEARCH,
    PLAYLIST,
    ALBUM,
    ARTIST,
    LOCAL_LIBRARY,
    RADIO,
    CYBER_DJ,
    AI_PLAYLIST,
    ANDROID_AUTO,
    RECENTLY_PLAYED,
    LIKED_SONGS,
    OTHER
}

/**
 * Classification of how a track playback terminated.
 */
enum class SkipType {
    NONE,         // Natural finish or completed
    MANUAL_SKIP,  // User explicitly tapped next / previous
    TIMEOUT,      // Stream timed out
    ERROR         // Playback failed due to decoder or network error
}

/**
 * Timeframe filter for analytics aggregations.
 */
enum class ListeningPeriod {
    WEEK_7_DAYS,
    MONTH_30_DAYS,
    THIS_YEAR,
    ALL_TIME
}
