package com.daddyizz.cyberpulse.core.lyrics

import com.daddyizz.cyberpulse.core.model.Track

/**
 * Clean abstraction for lyrics providers.
 * Keeps provider-specific schemas outside the UI and core playback domain.
 */
interface LyricsProvider {
    suspend fun getLyrics(
        track: Track
    ): LyricsResult
}
