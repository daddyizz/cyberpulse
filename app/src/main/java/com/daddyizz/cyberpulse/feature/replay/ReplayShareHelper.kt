package com.daddyizz.cyberpulse.feature.replay

import android.content.Context
import android.content.Intent
import com.daddyizz.cyberpulse.core.analytics.CyberPulseReplayData

object ReplayShareHelper {
    fun shareReplayText(context: Context, replay: CyberPulseReplayData) {
        val summary = buildString {
            appendLine("⚡ My CyberPulse Replay ${replay.year} ⚡")
            appendLine("🎧 ${replay.totalMinutes} minutes of real music listened")
            appendLine("🎵 Top Song: ${replay.topSong?.title ?: "N/A"} - ${replay.topSong?.artist ?: "N/A"}")
            appendLine("👑 Top Artist: ${replay.topArtist?.artistName ?: "N/A"}")
            appendLine("🔥 Longest Streak: ${replay.longestStreakDays} days")
            appendLine("🌌 Sonic Personality: ${replay.personalityTitle}")
            if (replay.cyberDjMinutes > 0) {
                appendLine("🤖 Cyber DJ Time: ${replay.cyberDjMinutes} minutes")
            }
            if (replay.roadListeningMinutes > 0) {
                appendLine("🚗 Road Listening: ${replay.roadListeningMinutes} minutes")
            }
            appendLine()
            appendLine("Tracked natively on device with CyberPulse Music.")
            appendLine("#CyberPulseReplay #CyberPulseMusic")
        }

        val sendIntent = Intent().apply {
            action = Intent.ACTION_SEND
            putExtra(Intent.EXTRA_TEXT, summary)
            type = "text/plain"
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        val shareIntent = Intent.createChooser(sendIntent, "Share CyberPulse Replay")
        shareIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(shareIntent)
    }
}
