package com.daddyizz.cyberpulse.core.common

/**
 * Domain error model mapping raw network and provider exceptions
 * into safe, structured, user-facing error states.
 */
sealed class CyberPulseError(
    override val message: String,
    override val cause: Throwable? = null
) : Exception(message, cause) {

    data class NetworkUnavailable(
        override val message: String = "No network connection. Operating in offline cached mode."
    ) : CyberPulseError(message)

    data class Timeout(
        override val message: String = "Network connection timed out. Please try again."
    ) : CyberPulseError(message)

    data class RateLimited(
        override val message: String = "Request rate limit exceeded. Please wait a moment before retrying."
    ) : CyberPulseError(message)

    data class QuotaExceeded(
        override val message: String = "Source provider API quota limit reached. Falling back to local catalog."
    ) : CyberPulseError(message)

    data class Unauthorized(
        override val message: String = "API credentials invalid or missing. Check local.properties configuration."
    ) : CyberPulseError(message)

    data class NotFound(
        override val message: String = "Requested track, artist, or album could not be found."
    ) : CyberPulseError(message)

    data class ProviderUnavailable(
        override val message: String = "Selected music metadata provider is temporarily unavailable."
    ) : CyberPulseError(message)

    data class Unknown(
        override val message: String = "An unexpected error occurred while fetching music metadata.",
        override val cause: Throwable? = null
    ) : CyberPulseError(message, cause)

    companion object {
        fun fromThrowable(throwable: Throwable): CyberPulseError {
            return when (throwable) {
                is CyberPulseError -> throwable
                is java.net.UnknownHostException,
                is java.net.ConnectException -> NetworkUnavailable()
                is java.net.SocketTimeoutException -> Timeout()
                else -> {
                    val msg = throwable.message?.lowercase() ?: ""
                    when {
                        msg.contains("quota") -> QuotaExceeded()
                        msg.contains("rate") || msg.contains("429") -> RateLimited()
                        msg.contains("401") || msg.contains("403") || msg.contains("unauthorized") -> Unauthorized()
                        msg.contains("404") || msg.contains("not found") -> NotFound()
                        else -> Unknown(throwable.message ?: "Unknown error", throwable)
                    }
                }
            }
        }
    }
}
