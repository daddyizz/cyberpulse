package com.daddyizz.cyberpulse.core.player

import androidx.media3.common.PlaybackException

/**
 * Domain-specific playback errors mapped from ExoPlayer / Media3 exceptions.
 */
sealed class PlaybackError(
    val userMessage: String,
    val errorCode: String,
    val cause: Throwable? = null
) {
    data class SourceUnavailable(
        val reason: String = "The requested media source is not currently available for playback."
    ) : PlaybackError(reason, "SOURCE_UNAVAILABLE")

    data class NetworkLost(
        val reason: String = "Network connection lost. Please check your internet connection."
    ) : PlaybackError(reason, "NETWORK_LOST")

    data class StreamUnavailable(
        val reason: String = "The media stream could not be loaded or reached an error state."
    ) : PlaybackError(reason, "STREAM_UNAVAILABLE")

    data class UnsupportedFormat(
        val reason: String = "The audio format is not supported on this device."
    ) : PlaybackError(reason, "UNSUPPORTED_FORMAT")

    data class PermissionDenied(
        val reason: String = "Playback permission was denied by the operating system."
    ) : PlaybackError(reason, "PERMISSION_DENIED")

    data class PlaybackFailed(
        val reason: String = "Playback encountered an error during decoding or buffering."
    ) : PlaybackError(reason, "PLAYBACK_FAILED")

    data class Unknown(
        val reason: String = "An unexpected playback error occurred."
    ) : PlaybackError(reason, "UNKNOWN_ERROR")

    companion object {
        fun fromPlaybackException(error: PlaybackException?): PlaybackError {
            if (error == null) return Unknown()
            return when (error.errorCode) {
                PlaybackException.ERROR_CODE_IO_NETWORK_CONNECTION_FAILED,
                PlaybackException.ERROR_CODE_IO_NETWORK_CONNECTION_TIMEOUT ->
                    NetworkLost()

                PlaybackException.ERROR_CODE_PARSING_CONTAINER_UNSUPPORTED,
                PlaybackException.ERROR_CODE_DECODER_INIT_FAILED ->
                    UnsupportedFormat()

                PlaybackException.ERROR_CODE_IO_FILE_NOT_FOUND,
                PlaybackException.ERROR_CODE_IO_BAD_HTTP_STATUS ->
                    StreamUnavailable()

                PlaybackException.ERROR_CODE_FAILED_RUNTIME_CHECK ->
                    PermissionDenied()

                else -> PlaybackFailed(error.message ?: "Playback failed with error code: ${error.errorCodeName}")
            }
        }
    }
}
