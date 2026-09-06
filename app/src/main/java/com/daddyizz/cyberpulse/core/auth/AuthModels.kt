package com.daddyizz.cyberpulse.core.auth

/**
 * Block 10: Authoritative User Profile model stored in local session and synchronized to the cloud.
 */
data class AuthUser(
    val id: String,
    val email: String? = null,
    val displayName: String = "CyberPulse Listener",
    val avatarUrl: String? = null,
    val isGuest: Boolean = false,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis(),
    val preferredLanguages: List<String> = listOf("English", "Malay", "Indonesian"),
    val preferredGenres: List<String> = emptyList(),
    val subscriptionTier: String = "FREE",
    val profileVisibility: String = "PRIVATE"
)

/**
 * Encapsulated authentication session containing authorization tokens and user profile.
 */
data class AuthSession(
    val accessToken: String,
    val refreshToken: String? = null,
    val expiresAt: Long = System.currentTimeMillis() + 86400000L,
    val user: AuthUser
) {
    val isExpired: Boolean
        get() = System.currentTimeMillis() >= expiresAt
}

/**
 * Observable reactive state of the user authentication lifecycle.
 */
sealed class AuthState {
    data class Guest(val user: AuthUser) : AuthState()
    data object Authenticating : AuthState()
    data class Authenticated(val user: AuthUser, val session: AuthSession) : AuthState()
    data class AuthError(val message: String, val recoverySuggestion: String? = null) : AuthState()
}
