package com.daddyizz.cyberpulse.core.model

/**
 * Filter categories for multi-entity music search.
 */
enum class SearchFilter(val displayName: String) {
    ALL("All"),
    SONGS("Songs"),
    LOCAL("Device"),
    RADIO("Radio"),
    ARTISTS("Artists"),
    ALBUMS("Albums"),
    PLAYLISTS("Playlists"),
    VIDEOS("Videos")
}
