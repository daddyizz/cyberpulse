package com.daddyizz.cyberpulse.core.player

/**
 * PlaybackCapability represents the playback permission / actionability of a track.
 */
enum class PlaybackCapability {
    /** Track has an approved playable source and can be played inside ExoPlayer. */
    SUPPORTED_OFFICIAL,

    /** Item requires external playback (e.g., YouTube video upload). */
    EXTERNAL_PLAYER,

    /** Item cannot be played directly in CyberPulse. */
    UNAVAILABLE,

    /** Playback capability is not yet resolved or unknown. */
    UNKNOWN
}
