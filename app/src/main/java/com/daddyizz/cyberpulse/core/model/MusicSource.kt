package com.daddyizz.cyberpulse.core.model

/**
 * Universal source classification for music content in CyberPulse.
 * Keeps provider identity clean and decoupled from third-party SDK specifics.
 */
enum class MusicSource {
    DEMO,
    LOCAL_DEMO,
    CYBERPULSE_TEST,
    YOUTUBE,
    SPOTIFY,
    LOCAL,
    LOCAL_STORAGE,
    RADIO,
    OTHER
}
