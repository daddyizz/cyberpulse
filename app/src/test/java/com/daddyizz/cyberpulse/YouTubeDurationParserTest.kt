package com.daddyizz.cyberpulse

import com.daddyizz.cyberpulse.core.network.YouTubeDurationParser
import org.junit.Assert.assertEquals
import org.junit.Test

class YouTubeDurationParserTest {

    @Test
    fun parseStandardMinutesAndSeconds() {
        val seconds = YouTubeDurationParser.parseIsoDurationToSeconds("PT3M45S")
        assertEquals(225L, seconds)
    }

    @Test
    fun parseHoursMinutesAndSeconds() {
        val seconds = YouTubeDurationParser.parseIsoDurationToSeconds("PT1H2M10S")
        assertEquals(3730L, seconds)
    }

    @Test
    fun parseSecondsOnly() {
        val seconds = YouTubeDurationParser.parseIsoDurationToSeconds("PT54S")
        assertEquals(54L, seconds)
    }

    @Test
    fun parseMinutesOnly() {
        val seconds = YouTubeDurationParser.parseIsoDurationToSeconds("PT4M")
        assertEquals(240L, seconds)
    }

    @Test
    fun parseHoursOnly() {
        val seconds = YouTubeDurationParser.parseIsoDurationToSeconds("PT2H")
        assertEquals(7200L, seconds)
    }

    @Test
    fun parseDaysAndHours() {
        val seconds = YouTubeDurationParser.parseIsoDurationToSeconds("P1DT2H")
        assertEquals(86400L + 7200L, seconds)
    }

    @Test
    fun parseZeroDurations() {
        assertEquals(0L, YouTubeDurationParser.parseIsoDurationToSeconds("PT0S"))
        assertEquals(0L, YouTubeDurationParser.parseIsoDurationToSeconds("P0D"))
    }

    @Test
    fun parseEmptyOrInvalidReturnsZero() {
        assertEquals(0L, YouTubeDurationParser.parseIsoDurationToSeconds(""))
        assertEquals(0L, YouTubeDurationParser.parseIsoDurationToSeconds(null))
        assertEquals(0L, YouTubeDurationParser.parseIsoDurationToSeconds("INVALID"))
    }
}
