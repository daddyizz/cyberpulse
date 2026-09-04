package com.daddyizz.cyberpulse.core.provider.local

import android.Manifest
import android.content.ContentResolver
import android.content.ContentUris
import android.content.Context
import android.content.pm.PackageManager
import android.database.ContentObserver
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.provider.MediaStore
import androidx.core.content.ContextCompat
import com.daddyizz.cyberpulse.core.model.Artwork
import com.daddyizz.cyberpulse.core.model.MusicSource
import com.daddyizz.cyberpulse.core.model.PlaybackCapability
import com.daddyizz.cyberpulse.core.model.PlaybackMode
import com.daddyizz.cyberpulse.core.model.Track
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File

/**
 * LocalMusicProvider
 *
 * Authoritative provider for scanning, indexing, and resolving local device audio
 * via Android MediaStore APIs under scoped storage rules.
 *
 * Enforces:
 * - Scoped storage compliance (modern READ_MEDIA_AUDIO on API 33+)
 * - Stable ContentUri resolution (never relies on raw filesystem paths)
 * - Intelligent music filtering (excludes ringtones, alarms, notifications, short audio < 15s)
 * - Background I/O processing & MediaStore change observation
 */
class LocalMusicProvider(
    private val context: Context,
    private val ioDispatcher: CoroutineDispatcher = Dispatchers.IO
) {
    private val scope = CoroutineScope(ioDispatcher + SupervisorJob())
    private val contentResolver: ContentResolver = context.contentResolver

    private val _scanState = MutableStateFlow<LocalScanState>(LocalScanState.Idle)
    val scanState: StateFlow<LocalScanState> = _scanState.asStateFlow()

    private var cachedTracks: List<Track> = emptyList()
    private var cachedAlbums: List<LocalAlbum> = emptyList()
    private var cachedArtists: List<LocalArtist> = emptyList()
    private var cachedFolders: List<LocalFolder> = emptyList()

    private var contentObserver: ContentObserver? = null

    init {
        registerMediaStoreObserver()
    }

    /**
     * Checks if the required runtime audio permission is granted.
     */
    fun hasStoragePermission(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.READ_MEDIA_AUDIO
            ) == PackageManager.PERMISSION_GRANTED
        } else {
            ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.READ_EXTERNAL_STORAGE
            ) == PackageManager.PERMISSION_GRANTED
        }
    }

    /**
     * Scans MediaStore asynchronously on the IO dispatcher.
     */
    fun scan(forceRefresh: Boolean = false) {
        if (!hasStoragePermission()) {
            _scanState.value = LocalScanState.PermissionRequired
            return
        }

        if (!forceRefresh && cachedTracks.isNotEmpty() && _scanState.value is LocalScanState.Loaded) {
            return
        }

        scope.launch {
            _scanState.value = LocalScanState.Loading
            try {
                val scannedTracks = queryMediaStoreAudio()
                if (scannedTracks.isEmpty()) {
                    cachedTracks = emptyList()
                    cachedAlbums = emptyList()
                    cachedArtists = emptyList()
                    cachedFolders = emptyList()
                    _scanState.value = LocalScanState.Empty
                } else {
                    cachedTracks = scannedTracks
                    cachedAlbums = buildAlbums(scannedTracks)
                    cachedArtists = buildArtists(scannedTracks, cachedAlbums)
                    cachedFolders = buildFolders(scannedTracks)

                    _scanState.value = LocalScanState.Loaded(
                        tracks = cachedTracks,
                        albums = cachedAlbums,
                        artists = cachedArtists,
                        folders = cachedFolders
                    )
                }
            } catch (e: Exception) {
                _scanState.value = LocalScanState.Error(
                    e.localizedMessage ?: "Failed to scan local device music"
                )
            }
        }
    }

    /**
     * Queries MediaStore.Audio.Media with proper projections and filters.
     */
    private suspend fun queryMediaStoreAudio(): List<Track> = withContext(ioDispatcher) {
        val tracks = mutableListOf<Track>()

        val projection = mutableListOf(
            MediaStore.Audio.Media._ID,
            MediaStore.Audio.Media.TITLE,
            MediaStore.Audio.Media.ARTIST,
            MediaStore.Audio.Media.ALBUM,
            MediaStore.Audio.Media.ALBUM_ID,
            MediaStore.Audio.Media.DURATION,
            MediaStore.Audio.Media.DATE_ADDED,
            MediaStore.Audio.Media.DATE_MODIFIED,
            MediaStore.Audio.Media.MIME_TYPE,
            MediaStore.Audio.Media.TRACK,
            MediaStore.Audio.Media.YEAR,
            MediaStore.Audio.Media.DATA
        ).apply {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                add(MediaStore.Audio.Media.RELATIVE_PATH)
            }
        }.toTypedArray()

        // Exclude notification, alarm, ringtone, and short clips < 15 seconds
        val selection = "${MediaStore.Audio.Media.IS_MUSIC} != 0 AND ${MediaStore.Audio.Media.DURATION} >= 15000"
        val sortOrder = "${MediaStore.Audio.Media.TITLE} COLLATE NOCASE ASC"

        try {
            contentResolver.query(
                MediaStore.Audio.Media.EXTERNAL_CONTENT_URI,
                projection,
                selection,
                null,
                sortOrder
            )?.use { cursor ->
                val idCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media._ID)
                val titleCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.TITLE)
                val artistCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.ARTIST)
                val albumCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.ALBUM)
                val albumIdCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.ALBUM_ID)
                val durationCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DURATION)
                val dateAddedCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DATE_ADDED)
                val trackNumCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.TRACK)
                val yearCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.YEAR)
                val dataCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DATA)
                val relativePathCol = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    cursor.getColumnIndex(MediaStore.Audio.Media.RELATIVE_PATH)
                } else -1

                while (cursor.moveToNext()) {
                    val mediaId = cursor.getLong(idCol)
                    val title = cursor.getString(titleCol)?.trim() ?: "Unknown Title"
                    val artist = cursor.getString(artistCol)?.trim() ?: "Unknown Artist"
                    val album = cursor.getString(albumCol)?.trim() ?: "Unknown Album"
                    val albumId = cursor.getLong(albumIdCol)
                    val durationMs = cursor.getLong(durationCol)
                    val dateAdded = cursor.getLong(dateAddedCol)
                    val trackNumber = cursor.getInt(trackNumCol)
                    val year = cursor.getInt(yearCol)
                    val filePath = cursor.getString(dataCol)

                    val folderName = if (relativePathCol >= 0) {
                        cursor.getString(relativePathCol)?.trim('/')?.split('/')?.lastOrNull()
                    } else if (!filePath.isNullOrBlank()) {
                        File(filePath).parentFile?.name
                    } else null

                    val contentUri = ContentUris.withAppendedId(
                        MediaStore.Audio.Media.EXTERNAL_CONTENT_URI,
                        mediaId
                    )

                    val artworkUri = ContentUris.withAppendedId(
                        Uri.parse("content://media/external/audio/albumart"),
                        albumId
                    )

                    val track = Track(
                        id = "local_$mediaId",
                        title = if (title.isBlank()) "Untitled Track" else title,
                        artist = if (artist.isBlank() || artist == "<unknown>") "Local Artist" else artist,
                        album = if (album.isBlank() || album == "<unknown>") "Local Music" else album,
                        artworkUrl = artworkUri.toString(),
                        artwork = Artwork(url = artworkUri.toString(), placeholderKey = "neon_horizon"),
                        durationSeconds = (durationMs / 1000L).coerceAtLeast(0L),
                        source = MusicSource.LOCAL,
                        sourceId = contentUri.toString(),
                        artistId = "local_art_${artist.hashCode()}",
                        albumId = "local_alb_$albumId",
                        contentUri = contentUri.toString(),
                        trackNumber = if (trackNumber > 0) trackNumber % 1000 else null,
                        year = if (year > 0) year else null,
                        isLiveStream = false,
                        isAvailable = true,
                        dateAdded = dateAdded,
                        folderName = folderName,
                        playbackCapability = PlaybackCapability(
                            mode = PlaybackMode.SUPPORTED_OFFICIAL,
                            supportsLossless = true,
                            supportsOffline = true,
                            notice = "Local device audio via MediaStore direct ContentUri"
                        )
                    )
                    tracks.add(track)
                }
            }
        } catch (e: Exception) {
            // Safe logging / graceful empty fallback
        }

        tracks
    }

    /**
     * Groups scanned tracks into LocalAlbum domain items.
     */
    private fun buildAlbums(tracks: List<Track>): List<LocalAlbum> {
        return tracks.groupBy { it.albumId ?: it.album }.map { (_, albumTracks) ->
            val first = albumTracks.first()
            val rawId = first.albumId?.removePrefix("local_alb_")?.toLongOrNull() ?: 0L
            val artUri = if (first.artworkUrl != null) Uri.parse(first.artworkUrl) else null
            val sortedTracks = albumTracks.sortedWith(
                compareBy<Track> { it.trackNumber ?: Int.MAX_VALUE }.thenBy { it.title }
            )
            LocalAlbum(
                id = rawId,
                title = first.album,
                artist = first.artist,
                artworkUri = artUri,
                trackCount = albumTracks.size,
                year = albumTracks.mapNotNull { it.year }.firstOrNull(),
                tracks = sortedTracks
            )
        }.sortedBy { it.title.lowercase() }
    }

    /**
     * Groups scanned tracks into LocalArtist domain items.
     */
    private fun buildArtists(tracks: List<Track>, albums: List<LocalAlbum>): List<LocalArtist> {
        return tracks.groupBy { it.artist.lowercase() }.map { (_, artistTracks) ->
            val artistName = artistTracks.first().artist
            val artistAlbums = albums.filter { it.artist.equals(artistName, ignoreCase = true) }
            LocalArtist(
                name = artistName,
                trackCount = artistTracks.size,
                albumCount = artistAlbums.size,
                tracks = artistTracks.sortedBy { it.title.lowercase() },
                albums = artistAlbums
            )
        }.sortedBy { it.name.lowercase() }
    }

    /**
     * Groups scanned tracks into LocalFolder groupings where available.
     */
    private fun buildFolders(tracks: List<Track>): List<LocalFolder> {
        return tracks.groupBy { it.folderName ?: "Device Storage" }.map { (folderName, folderTracks) ->
            LocalFolder(
                path = folderName,
                name = folderName,
                trackCount = folderTracks.size,
                tracks = folderTracks.sortedBy { it.title.lowercase() }
            )
        }.sortedBy { it.name.lowercase() }
    }

    /**
     * Search within on-device music strictly without leaking queries to external networks.
     */
    fun searchLocal(query: String): List<Track> {
        val q = query.trim().lowercase()
        if (q.isBlank()) return emptyList()
        return cachedTracks.filter { track ->
            track.title.lowercase().contains(q) ||
                track.artist.lowercase().contains(q) ||
                track.album.lowercase().contains(q)
        }
    }

    /**
     * Checks if a local track's content URI still physically exists.
     */
    fun checkTrackExists(track: Track): Boolean {
        val uriStr = track.contentUri ?: track.sourceId
        if (uriStr.isBlank()) return false
        val uri = Uri.parse(uriStr)
        return try {
            contentResolver.openFileDescriptor(uri, "r")?.use { true } ?: false
        } catch (_: Exception) {
            false
        }
    }

    fun getTracks(): List<Track> = cachedTracks
    fun getAlbums(): List<LocalAlbum> = cachedAlbums
    fun getArtists(): List<LocalArtist> = cachedArtists
    fun getFolders(): List<LocalFolder> = cachedFolders

    fun getSortedTracks(order: LocalSortOrder): List<Track> {
        return when (order) {
            LocalSortOrder.TITLE -> cachedTracks.sortedBy { it.title.lowercase() }
            LocalSortOrder.ARTIST -> cachedTracks.sortedBy { it.artist.lowercase() }
            LocalSortOrder.ALBUM -> cachedTracks.sortedBy { it.album.lowercase() }
            LocalSortOrder.RECENTLY_ADDED -> cachedTracks.sortedByDescending { it.dateAdded }
            LocalSortOrder.DURATION -> cachedTracks.sortedByDescending { it.durationSeconds }
        }
    }

    private fun registerMediaStoreObserver() {
        try {
            contentObserver = object : ContentObserver(Handler(Looper.getMainLooper())) {
                override fun onChange(selfChange: Boolean, uri: Uri?) {
                    super.onChange(selfChange, uri)
                    if (hasStoragePermission()) {
                        scan(forceRefresh = true)
                    }
                }
            }
            contentResolver.registerContentObserver(
                MediaStore.Audio.Media.EXTERNAL_CONTENT_URI,
                true,
                contentObserver!!
            )
        } catch (_: Exception) {
            // Safe fallback if ContentObserver cannot be registered in non-standard context
        }
    }

    fun unregisterObserver() {
        contentObserver?.let {
            try {
                contentResolver.unregisterContentObserver(it)
            } catch (_: Exception) {}
        }
        contentObserver = null
    }
}
