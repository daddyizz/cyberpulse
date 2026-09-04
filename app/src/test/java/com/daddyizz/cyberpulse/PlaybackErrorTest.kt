package com.daddyizz.cyberpulse

import androidx.media3.common.PlaybackException
import com.daddyizz.cyberpulse.core.player.PlaybackError
import com.daddyizz.cyberpulse.core.player.toCyberPulseError
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Unit tests verifying PlaybackError domain mapping from Media3 PlaybackException.
 */
class PlaybackErrorTest {

    @Test
    fun ioException_mapsToNetworkOrDataSourceError() {
        val exception = PlaybackException(
            "Connection failed",
            null,
            PlaybackException.ERROR_CODE_IO_NETWORK_CONNECTION_FAILED
        )

        val domainError = exception.toCyberPulseError()
        assertTrue(domainError is PlaybackError.Network)
        assertTrue(domainError.userMessage.contains("Network error"))
    }

    @Test
    fun decoderException_mapsToDecoderInitializationError() {
        val exception = PlaybackException(
            "Codec init failed",
            null,
            PlaybackException.ERROR_CODE_DECODER_INIT_FAILED
        )

        val domainError = exception.toCyberPulseError()
        assertTrue(domainError is PlaybackError.DecoderInitialization)
        assertTrue(domainError.userMessage.contains("Audio decoder error"))
    }

    @Test
    fun timeoutException_mapsToTimeoutError() {
        val exception = PlaybackException(
            "Timed out",
            null,
            PlaybackException.ERROR_CODE_IO_NETWORK_CONNECTION_TIMEOUT
        )

        val domainError = exception.toCyberPulseError()
        assertTrue(domainError is PlaybackError.Timeout)
        assertTrue(domainError.userMessage.contains("timed out"))
    }

    @Test
    fun unplayableSource_createsValidErrorMessage() {
        val error = PlaybackError.UnplayableSource("YouTube tracks cannot be played directly.")
        assertTrue(error.userMessage.contains("YouTube tracks cannot be played directly"))
    }
}
