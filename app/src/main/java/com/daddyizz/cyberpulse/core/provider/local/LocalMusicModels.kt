package com.daddyizz.cyberpulse.core.provider.local

import android.net.Uri
import com.daddyizz.cyberpulse.core.model.Track

/**
 * Local device album grouping.
 */
data class LocalAlbum(
    val id: Long,
    val title: String,
    val artist: String,
    val artworkUri: Uri?,
    val trackCount: Int,
    val year: Int?,
    val tracks: List<Track> = emptyList()
)

/**
 * Local device artist grouping.
 */
data class LocalArtist(
    val name: String,
    val trackCount: Int,
    val albumCount: Int,
    val tracks: List<Track> = emptyList(),
    val albums: List<LocalAlbum> = emptyList()
)

/**
 * Local device folder / directory grouping where practical under Scoped Storage.
 */
data class LocalFolder(
    val path: String,
    val name: String,
    val trackCount: Int,
    val tracks: List<Track> = emptyList()
)

/**
 * Sorting options for On-Device songs library.
 */
enum class LocalSortOrder(val label: String) {
    TITLE("Title"),
    ARTIST("Artist"),
    ALBUM("Album"),
    RECENTLY_ADDED("Recently Added"),
    DURATION("Duration")
}

/**
 * Reactive state machine for asynchronous MediaStore scanning.
 */
sealed interface LocalScanState {
    data object Idle : LocalScanState
    data object Loading : LocalScanState
    data class Loaded(
        val tracks: List<Track>,
        val albums: List<LocalAlbum>,
        val artists: List<LocalArtist>,
        val folders: List<LocalFolder>
    ) : LocalScanState
    data object Empty : LocalScanState
    data object PermissionRequired : LocalScanState
    data class Error(val message: String) : LocalScanState
}
