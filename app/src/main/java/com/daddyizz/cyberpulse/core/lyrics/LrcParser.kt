package com.daddyizz.cyberpulse.core.lyrics

import java.util.regex.Pattern

/**
 * Robust, production-grade parser for LRC (LyRic) files.
 * Supports:
 * - Standard [mm:ss.xx] and [mm:ss.xxx]
 * - Alternate colon separator [mm:ss:xx]
 * - Multiple timestamps per line: [00:12.34][00:15.67] Lyric text
 * - Metadata tags: [ar:], [ti:], [al:], [by:], [offset:]
 * - Graceful fallback to plain lyrics when no timestamps exist
 * - Resilient against malformed lines without throwing exceptions
 */
object LrcParser {

    // Matches tags like [00:12.34], [01:23.456], [00:12:34]
    private val TIMESTAMP_PATTERN = Pattern.compile("\\[(\\d{1,3}):(\\d{2})(?:[.:](\\d{1,3}))?]")

    // Matches metadata tags like [ti:Title], [ar:Artist], [offset:+500]
    private val METADATA_PATTERN = Pattern.compile("^\\[([a-zA-Z]+):(.*)]$")

    data class ParsedLrc(
        val type: LyricsType,
        val lines: List<LyricLine>,
        val metadata: Map<String, String> = emptyMap(),
        val offsetMs: Long = 0L
    )

    fun parse(lrcContent: String): ParsedLrc {
        if (lrcContent.isBlank()) {
            return ParsedLrc(type = LyricsType.PLAIN, lines = emptyList())
        }

        val metadata = mutableMapOf<String, String>()
        val parsedLines = mutableListOf<LyricLine>()
        var offsetMs = 0L

        val rawLines = lrcContent.lines()
        var hasAnyTimestamp = false

        for (rawLine in rawLines) {
            val line = rawLine.trim()
            if (line.isEmpty()) continue

            // 1. Check for metadata tags: [key:value]
            val metaMatcher = METADATA_PATTERN.matcher(line)
            if (metaMatcher.matches()) {
                val key = metaMatcher.group(1)?.lowercase() ?: ""
                val value = metaMatcher.group(2)?.trim() ?: ""
                metadata[key] = value

                if (key == "offset") {
                    offsetMs = value.toLongOrNull() ?: 0L
                }
                continue
            }

            // 2. Check for timestamps
            val tsMatcher = TIMESTAMP_PATTERN.matcher(line)
            val timestamps = mutableListOf<Long>()
            var lastMatchEnd = 0

            while (tsMatcher.find()) {
                val minStr = tsMatcher.group(1)
                val secStr = tsMatcher.group(2)
                val fracStr = tsMatcher.group(3)

                val timestampMs = parseTimestampToMs(minStr, secStr, fracStr)
                if (timestampMs != null) {
                    timestamps.add(timestampMs)
                    hasAnyTimestamp = true
                }
                lastMatchEnd = tsMatcher.end()
            }

            if (timestamps.isNotEmpty()) {
                // The remaining string after the last timestamp is the lyric text
                val text = if (lastMatchEnd < line.length) {
                    line.substring(lastMatchEnd).trim()
                } else {
                    ""
                }

                // If multiple timestamps exist on this line, create an entry for each
                for (ts in timestamps) {
                    parsedLines.add(
                        LyricLine(
                            startTimeMs = (ts + offsetMs).coerceAtLeast(0L),
                            endTimeMs = null,
                            text = text
                        )
                    )
                }
            } else {
                // Plain line without timestamps
                parsedLines.add(
                    LyricLine(
                        startTimeMs = null,
                        endTimeMs = null,
                        text = line
                    )
                )
            }
        }

        if (!hasAnyTimestamp) {
            // Entire file is plain lyrics
            val plainLines = parsedLines.map {
                LyricLine(startTimeMs = null, endTimeMs = null, text = it.text)
            }.filter { it.text.isNotBlank() }

            return ParsedLrc(
                type = LyricsType.PLAIN,
                lines = plainLines,
                metadata = metadata,
                offsetMs = offsetMs
            )
        }

        // Only keep lines with valid timestamps and sort chronologically
        val sortedTimedLines = parsedLines
            .filter { it.startTimeMs != null }
            .sortedBy { it.startTimeMs ?: 0L }

        // Compute endTimeMs for each line based on the next line's startTimeMs
        val resolvedLines = mutableListOf<LyricLine>()
        for (i in sortedTimedLines.indices) {
            val current = sortedTimedLines[i]
            val nextStart = if (i + 1 < sortedTimedLines.size) {
                sortedTimedLines[i + 1].startTimeMs
            } else {
                // For the last line, default duration to 4 seconds
                (current.startTimeMs ?: 0L) + 4000L
            }

            resolvedLines.add(
                current.copy(
                    endTimeMs = nextStart
                )
            )
        }

        return ParsedLrc(
            type = LyricsType.SYNCED,
            lines = resolvedLines,
            metadata = metadata,
            offsetMs = offsetMs
        )
    }

    private fun parseTimestampToMs(minStr: String?, secStr: String?, fracStr: String?): Long? {
        val minutes = minStr?.toLongOrNull() ?: return null
        val seconds = secStr?.toLongOrNull() ?: return null

        val millis = when {
            fracStr == null -> 0L
            fracStr.length == 1 -> (fracStr.toLongOrNull() ?: 0L) * 100L // 1/10th sec
            fracStr.length == 2 -> (fracStr.toLongOrNull() ?: 0L) * 10L  // 1/100th sec (standard)
            fracStr.length >= 3 -> (fracStr.take(3).toLongOrNull() ?: 0L) // 1/1000th sec
            else -> 0L
        }

        return (minutes * 60L + seconds) * 1000L + millis
    }
}
