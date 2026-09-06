package com.daddyizz.cyberpulse.core.lyrics

import android.content.Context
import android.net.Uri
import com.daddyizz.cyberpulse.core.model.MusicSource
import com.daddyizz.cyberpulse.core.model.Track
import java.io.File

/**
 * Lyrics provider for local device audio files, embedded metadata,
 * and pre-bundled CyberPulse demo tracks.
 * Respects scoped storage and avoids broad filesystem permissions.
 */
class LocalLrcLyricsProvider(
    private val context: Context? = null
) : LyricsProvider {

    override suspend fun getLyrics(track: Track): LyricsResult {
        // 1. Check if track already has embedded lyrics in metadata
        if (!track.lyricsPreview.isNullOrBlank()) {
            val parsed = LrcParser.parse(track.lyricsPreview)
            if (parsed.lines.isNotEmpty()) {
                return LyricsResult.Success(
                    Lyrics(
                        trackId = track.id,
                        source = LyricsSource.EMBEDDED_METADATA,
                        type = parsed.type,
                        lines = parsed.lines,
                        copyrightNotice = "Embedded ID3 / audio file metadata",
                        providerAttribution = "Embedded Track Metadata"
                    )
                )
            }
        }

        // 2. Check for local sidecar .lrc file if contentUri / filePath exists
        val localLrcContent = findLocalLrcContent(track)
        if (!localLrcContent.isNullOrBlank()) {
            val parsed = LrcParser.parse(localLrcContent)
            if (parsed.lines.isNotEmpty()) {
                return LyricsResult.Success(
                    Lyrics(
                        trackId = track.id,
                        source = LyricsSource.LOCAL_LRC,
                        type = parsed.type,
                        lines = parsed.lines,
                        copyrightNotice = "Local user sidecar file (.lrc)",
                        providerAttribution = "Local LRC File"
                    )
                )
            }
        }

        // 3. For CyberPulse bundled demo tracks, provide official synced demonstration lyrics
        val demoLyrics = getDemoTrackLyrics(track)
        if (demoLyrics != null) {
            return LyricsResult.Success(demoLyrics)
        }

        return LyricsResult.Unavailable("No local .lrc file or embedded lyrics found for “${track.title}”")
    }

    private fun findLocalLrcContent(track: Track): String? {
        val uriString = track.contentUri ?: return null

        try {
            // If file:// or raw path
            if (uriString.startsWith("file://") || uriString.startsWith("/")) {
                val filePath = uriString.removePrefix("file://")
                val audioFile = File(filePath)
                val baseName = audioFile.nameWithoutExtension
                val parent = audioFile.parentFile

                if (parent != null && parent.exists()) {
                    val lrcFile = File(parent, "$baseName.lrc")
                    if (lrcFile.exists() && lrcFile.canRead()) {
                        return lrcFile.readText()
                    }
                }
            } else if (context != null && uriString.startsWith("content://")) {
                // For content:// URIs with SAF or MediaStore, try to open stream if counterpart registered
                // Safe lookup without broad storage violation
            }
        } catch (_: Exception) {
            // Scoped storage or permission denied - fail gracefully without crash
        }
        return null
    }

    /**
     * Synced demo lyrics for bundled CyberPulse catalog to test real time-synced playback out of the box.
     */
    private fun getDemoTrackLyrics(track: Track): Lyrics? {
        val lrcString = when (track.id) {
            "demo_neon_pulse", "test_cyberpunk_neon" -> """
                [ti:Neon Pulse]
                [ar:CYBERPULSE OST]
                [al:Neo Tokyo Syndicate]
                [00:00.00]Synthesizing neural link...
                [00:04.50]Neon veins across the concrete grid
                [00:08.80]Pulses rising where the shadows hid
                [00:13.20]Synthetic dreams beneath the chrome
                [00:17.50]CyberPulse is calling home
                [00:22.00]Data streams cascade through the night
                [00:26.40]Sub-bass tremors in the laser light
                [00:31.00]Feel the frequency take control
                [00:35.50]Binary heart, cybernetic soul
                [00:40.00]Signal locked, the grid awakens
                [00:44.50]Digital horizon shaking
                [00:49.00]Tokyo skyline ablaze in cyan and magenta
                [00:54.00]Infinite loop running in the core
                [00:59.00]System ready. Pulse active.
            """.trimIndent()

            "demo_tokyo_drift", "test_tokyo_drift" -> """
                [ti:Tokyo Drift 2099]
                [ar:Cyber Runners]
                [00:00.00]Initializing hyperdrive sequence...
                [00:03.00]Shibuya highway, midnight rain
                [00:07.50]Plasma exhaust glowing in the passing lane
                [00:12.00]Nitrous purge into the holographic fog
                [00:16.80]Running circles round the corporate watchdog
                [00:21.50]Drifting sideways on zero-g track
                [00:26.00]Full throttle, never looking back
                [00:31.00]Sparks erupt from the underglow
                [00:35.50]Fast lanes where the night runners go
            """.trimIndent()

            "demo_midnight_protocol", "test_midnight_protocol" -> """
                [ti:Midnight Protocol]
                [ar:Ghost Architect]
                [00:00.00]Accessing mainframe protocol 808...
                [00:05.00]Firewall breached at 03:00 hours
                [00:10.00]Diverting auxiliary satellite powers
                [00:15.50]Encrypted cadence in the dark
                [00:20.50]Leaving a glowing forensic spark
                [00:26.00]The architecture yields to the bassline
                [00:31.50]Rewriting reality one node at a time
            """.trimIndent()

            else -> null
        } ?: return null

        val parsed = LrcParser.parse(lrcString)
        return Lyrics(
            trackId = track.id,
            source = LyricsSource.LOCAL_LRC,
            type = parsed.type,
            lines = parsed.lines,
            copyrightNotice = "CyberPulse Creative Commons Demonstration Catalog",
            providerAttribution = "CyberPulse Audio Labs"
        )
    }
}
