package com.daddyizz.cyberpulse.core.lyrics

/**
 * Domain model for lyrics in CyberPulse Music.
 * Source-agnostic and designed to support local files, embedded metadata,
 * and licensed external providers without UI coupling.
 */
data class Lyrics(
    val trackId: String,
    val source: LyricsSource,
    val type: LyricsType,
    val lines: List<LyricLine>,
    val copyrightNotice: String? = null,
    val providerAttribution: String? = null
) {
    val isSynced: Boolean get() = type == LyricsType.SYNCED && lines.any { it.startTimeMs != null }

    /**
     * Resolves the active line index for a given playback position in milliseconds.
     * Returns -1 if no line matches or lyrics are plain.
     */
    fun findActiveLineIndex(positionMs: Long): Int {
        if (!isSynced || lines.isEmpty() || positionMs < 0) return -1

        // Find the latest line whose startTimeMs <= positionMs
        var activeIndex = -1
        for (i in lines.indices) {
            val start = lines[i].startTimeMs ?: continue
            if (start <= positionMs) {
                val end = lines[i].endTimeMs ?: if (i + 1 < lines.size) lines[i + 1].startTimeMs ?: Long.MAX_VALUE else Long.MAX_VALUE
                if (positionMs < end) {
                    return i
                }
                activeIndex = i
            } else {
                break
            }
        }
        return activeIndex
    }
}

/**
 * Single line of lyrics with optional millisecond timestamps.
 */
data class LyricLine(
    val startTimeMs: Long? = null,
    val endTimeMs: Long? = null,
    val text: String
) {
    val isTimestamped: Boolean get() = startTimeMs != null
}

enum class LyricsType {
    PLAIN,
    SYNCED
}

enum class LyricsSource {
    LICENSED_REMOTE,
    EMBEDDED_METADATA,
    LOCAL_LRC,
    LOCAL_TEXT,
    NONE
}

sealed class LyricsResult {
    data class Success(val lyrics: Lyrics) : LyricsResult()
    data class Unavailable(val reason: String) : LyricsResult()
    data class Error(val error: LyricsError) : LyricsResult()
}

sealed class LyricsError(val message: String) {
    data object NotFound : LyricsError("Lyrics not found")
    data object RateLimited : LyricsError("Lyrics rate limit reached")
    data object Unauthorized : LyricsError("Unauthorized lyrics access")
    data object ProviderUnavailable : LyricsError("Lyrics service is unavailable")
    data class NetworkError(val details: String) : LyricsError("Network error: $details")
    data class MalformedResponse(val details: String) : LyricsError("Malformed lyrics: $details")
    data object UnsupportedTrack : LyricsError("Lyrics unsupported for this track source")
}
