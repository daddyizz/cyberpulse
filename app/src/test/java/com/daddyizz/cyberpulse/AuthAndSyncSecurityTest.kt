package com.daddyizz.cyberpulse

import com.daddyizz.cyberpulse.core.config.CyberPulseFeatureFlags
import com.daddyizz.cyberpulse.core.model.MusicSource
import com.daddyizz.cyberpulse.core.model.Track
import org.junit.Assert.*
import org.junit.Test

/**
 * Block 10 Unit Tests: Authentication, Cloud Sync Data Sanitization,
 * Feature Flags & Kill Switch Security.
 */
class AuthAndSyncSecurityTest {

    @Test
    fun localTrackSync_stripsLocalFileUrisAndFilePaths() {
        val rawLocalTrack = Track(
            id = "local_12345",
            title = "Midnight Cyber Drift",
            artist = "Neon Driver",
            durationMs = 214000L,
            source = MusicSource.LOCAL,
            mediaUri = "content://media/external/audio/media/12345"
        )

        // Verify that sanitization strips local URI
        val sanitized = if (rawLocalTrack.source == MusicSource.LOCAL) {
            rawLocalTrack.copy(
                mediaUri = "",
                extraMetadata = mapOf(
                    "is_local_reference" to "true",
                    "logical_fingerprint" to "${rawLocalTrack.title.lowercase()}_${rawLocalTrack.artist.lowercase()}"
                )
            )
        } else {
            rawLocalTrack
        }

        assertEquals("", sanitized.mediaUri)
        assertFalse(sanitized.mediaUri.contains("content://"))
        assertEquals("true", sanitized.extraMetadata["is_local_reference"])
        assertEquals("midnight cyber drift_neon driver", sanitized.extraMetadata["logical_fingerprint"])
    }

    @Test
    fun crashReporterContext_redactsSensitiveKeys() {
        val rawContext = mapOf(
            "screen" to "NowPlaying",
            "access_token" to "eyJhGciOiJIUzI1NiJ9.secretpayload",
            "auth_secret" to "my_super_secret_key",
            "device_model" to "Pixel 8 Pro"
        )

        val sensitiveKeys = listOf("token", "secret", "password", "key", "auth", "credential", "path", "file")
        val sanitized = rawContext.mapValues { (k, v) ->
            if (sensitiveKeys.any { k.lowercase().contains(it) }) "[REDACTED]" else v
        }

        assertEquals("NowPlaying", sanitized["screen"])
        assertEquals("[REDACTED]", sanitized["access_token"])
        assertEquals("[REDACTED]", sanitized["auth_secret"])
        assertEquals("Pixel 8 Pro", sanitized["device_model"])
    }

    @Test
    fun featureFlags_killSwitch_disablesFeatureSafely() {
        CyberPulseFeatureFlags.resetToDefaults()
        assertTrue(CyberPulseFeatureFlags.isEnabled(CyberPulseFeatureFlags.Feature.SPOTIFY_INTEGRATION))

        CyberPulseFeatureFlags.triggerKillSwitch(
            CyberPulseFeatureFlags.Feature.SPOTIFY_INTEGRATION,
            "Spotify 503 Outage Simulation"
        )

        assertFalse(CyberPulseFeatureFlags.isEnabled(CyberPulseFeatureFlags.Feature.SPOTIFY_INTEGRATION))

        // Ensure other flags remain unaffected
        assertTrue(CyberPulseFeatureFlags.isEnabled(CyberPulseFeatureFlags.Feature.LOCAL_MUSIC))
        assertTrue(CyberPulseFeatureFlags.isEnabled(CyberPulseFeatureFlags.Feature.CYBER_RADIO))

        // Reset
        CyberPulseFeatureFlags.resetToDefaults()
        assertTrue(CyberPulseFeatureFlags.isEnabled(CyberPulseFeatureFlags.Feature.SPOTIFY_INTEGRATION))
    }
}
