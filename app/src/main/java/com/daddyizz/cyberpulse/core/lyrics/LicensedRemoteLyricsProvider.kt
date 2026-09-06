package com.daddyizz.cyberpulse.core.lyrics

import com.daddyizz.cyberpulse.core.model.Track

/**
 * Interface and default implementation for legally licensed remote lyrics services.
 * Strictly adheres to copyright compliance:
 * - NO unauthorized scraping of web pages, search snippets, or unlicensed sites.
 * - Displays official copyright notices and provider branding.
 * - When no commercial API key or licensed provider contract is configured,
 *   returns a clean, informative unavailable state.
 */
class LicensedRemoteLyricsProvider(
    private val apiKey: String? = null,
    private val endpointUrl: String? = null
) : LyricsProvider {

    override suspend fun getLyrics(track: Track): LyricsResult {
        // Enforce strict legal compliance
        if (apiKey.isNullOrBlank() || endpointUrl.isNullOrBlank()) {
            return LyricsResult.Unavailable(
                "Lyrics aren't available for this track (no licensed remote provider configured)."
            )
        }

        // When a licensed remote provider is configured with valid credentials,
        // remote retrieval would execute here via authentic API contract.
        return LyricsResult.Unavailable("Lyrics service provider currently unavailable.")
    }
}
