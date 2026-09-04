package com.daddyizz.cyberpulse.core.model

/**
 * Unified representation of polymorphic search items across providers.
 */
sealed interface SearchResultItem {
    data class TrackResult(val track: Track) : SearchResultItem
    data class ArtistResult(val artist: Artist) : SearchResultItem
    data class AlbumResult(val album: Album) : SearchResultItem
    data class PlaylistResult(val playlist: Playlist) : SearchResultItem
    data class RadioResult(val station: RadioStation) : SearchResultItem
}

/**
 * Token-based paginated search result container.
 */
data class SearchResultPage(
    val items: List<SearchResultItem> = emptyList(),
    val nextPageToken: String? = null,
    val totalEstimatedResults: Int = 0,
    val isFromCache: Boolean = false
)
