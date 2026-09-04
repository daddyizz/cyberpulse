package com.daddyizz.cyberpulse.core.player

import androidx.media3.common.MediaItem
import androidx.media3.common.MediaMetadata
import com.daddyizz.cyberpulse.CyberPulseApplication
import com.daddyizz.cyberpulse.core.model.RadioStation
import com.daddyizz.cyberpulse.core.provider.local.LocalSortOrder
import com.daddyizz.cyberpulse.core.provider.radio.RadioProvider

/**
 * MediaLibraryTree
 *
 * Defines the AndroidX MediaLibrary hierarchy for Android Auto and system media browsing.
 * Exposes Local Music and Internet Radio as first-class, browsable, playable categories.
 */
object MediaLibraryTree {

    const val ROOT_ID = "CYBERPULSE_ROOT"

    // Root-level browsing categories
    const val NODE_LOCAL_MUSIC = "NODE_LOCAL_MUSIC"
    const val NODE_RADIO = "NODE_RADIO"
    const val NODE_TEST_MEDIA = "NODE_TEST_MEDIA"
    const val NODE_RECENTLY_PLAYED = "NODE_RECENTLY_PLAYED"
    const val NODE_LIKED = "NODE_LIKED"
    const val NODE_PLAYLISTS = "NODE_PLAYLISTS"

    // Sub-nodes for Local Music
    const val NODE_LOCAL_SONGS = "NODE_LOCAL_SONGS"
    const val NODE_LOCAL_ALBUMS = "NODE_LOCAL_ALBUMS"
    const val NODE_LOCAL_ARTISTS = "NODE_LOCAL_ARTISTS"
    const val NODE_LOCAL_RECENT = "NODE_LOCAL_RECENT"
    const val PREFIX_LOCAL_ALBUM = "local_album_"
    const val PREFIX_LOCAL_ARTIST = "local_artist_"

    // Sub-nodes for Cyber Radio
    const val NODE_RADIO_FAVORITES = "NODE_RADIO_FAVORITES"
    const val NODE_RADIO_MALAYSIA = "NODE_RADIO_MALAYSIA"
    const val NODE_RADIO_ELECTRONIC = "NODE_RADIO_ELECTRONIC"
    const val NODE_RADIO_CHILL = "NODE_RADIO_CHILL"
    const val NODE_RADIO_NEWS = "NODE_RADIO_NEWS"
    const val NODE_RADIO_ALL = "NODE_RADIO_ALL"

    fun getRootItem(): MediaItem {
        return MediaItem.Builder()
            .setMediaId(ROOT_ID)
            .setMediaMetadata(
                MediaMetadata.Builder()
                    .setTitle("CyberPulse Music")
                    .setIsBrowsable(true)
                    .setIsPlayable(false)
                    .build()
            )
            .build()
    }

    fun getRootChildren(): List<MediaItem> {
        return listOf(
            buildBrowsableCategory(NODE_LOCAL_MUSIC, "On This Device", "Local Audio Files"),
            buildBrowsableCategory(NODE_RADIO, "Cyber Radio", "Live Internet Radio Broadcasts"),
            buildBrowsableCategory(NODE_TEST_MEDIA, "CyberPulse Test Tracks", "Verified Reference Audio"),
            buildBrowsableCategory(NODE_RECENTLY_PLAYED, "Recently Played", "Recent Listening History"),
            buildBrowsableCategory(NODE_LIKED, "Liked Pulses", "Favorite Tracks"),
            buildBrowsableCategory(NODE_PLAYLISTS, "Playlists", "Custom Mixes & Demo Playlists")
        )
    }

    fun getChildrenForNode(nodeId: String): List<MediaItem> {
        val app = try { CyberPulseApplication.instance } catch (_: Exception) { null }
        val localProvider = app?.localMusicProvider
        val radioRepo = app?.radioRepository
        val musicRepo = app?.musicRepository

        return when {
            nodeId == ROOT_ID -> getRootChildren()

            // === Local Music Nodes ===
            nodeId == NODE_LOCAL_MUSIC -> {
                listOf(
                    buildBrowsableCategory(NODE_LOCAL_SONGS, "All Songs", "Browse all local audio"),
                    buildBrowsableCategory(NODE_LOCAL_ALBUMS, "Albums", "Browse local albums"),
                    buildBrowsableCategory(NODE_LOCAL_ARTISTS, "Artists", "Browse local artists"),
                    buildBrowsableCategory(NODE_LOCAL_RECENT, "Recently Added", "Latest added audio tracks")
                )
            }
            nodeId == NODE_LOCAL_SONGS -> {
                localProvider?.getTracks()?.map { MediaItemMapper.toMediaItem(it) } ?: emptyList()
            }
            nodeId == NODE_LOCAL_ALBUMS -> {
                localProvider?.getAlbums()?.map { album ->
                    MediaItem.Builder()
                        .setMediaId("$PREFIX_LOCAL_ALBUM${album.id}")
                        .setMediaMetadata(
                            MediaMetadata.Builder()
                                .setTitle(album.title)
                                .setArtist(album.artist)
                                .setSubtitle("${album.trackCount} tracks")
                                .setArtworkUri(album.artworkUri)
                                .setIsBrowsable(true)
                                .setIsPlayable(false)
                                .build()
                        )
                        .build()
                } ?: emptyList()
            }
            nodeId.startsWith(PREFIX_LOCAL_ALBUM) -> {
                val albumId = nodeId.removePrefix(PREFIX_LOCAL_ALBUM).toLongOrNull()
                val album = localProvider?.getAlbums()?.firstOrNull { it.id == albumId }
                album?.tracks?.map { MediaItemMapper.toMediaItem(it) } ?: emptyList()
            }
            nodeId == NODE_LOCAL_ARTISTS -> {
                localProvider?.getArtists()?.map { artist ->
                    MediaItem.Builder()
                        .setMediaId("$PREFIX_LOCAL_ARTIST${artist.name.hashCode()}")
                        .setMediaMetadata(
                            MediaMetadata.Builder()
                                .setTitle(artist.name)
                                .setSubtitle("${artist.trackCount} tracks • ${artist.albumCount} albums")
                                .setIsBrowsable(true)
                                .setIsPlayable(false)
                                .build()
                        )
                        .build()
                } ?: emptyList()
            }
            nodeId.startsWith(PREFIX_LOCAL_ARTIST) -> {
                val hash = nodeId.removePrefix(PREFIX_LOCAL_ARTIST).toIntOrNull()
                val artist = localProvider?.getArtists()?.firstOrNull { it.name.hashCode() == hash }
                artist?.tracks?.map { MediaItemMapper.toMediaItem(it) } ?: emptyList()
            }
            nodeId == NODE_LOCAL_RECENT -> {
                localProvider?.getSortedTracks(LocalSortOrder.RECENTLY_ADDED)?.take(50)?.map {
                    MediaItemMapper.toMediaItem(it)
                } ?: emptyList()
            }

            // === Internet Radio Nodes ===
            nodeId == NODE_RADIO -> {
                listOf(
                    buildBrowsableCategory(NODE_RADIO_FAVORITES, "Favorites", "Your starred radio stations"),
                    buildBrowsableCategory(NODE_RADIO_MALAYSIA, "Malaysia Radio", "Official & Public Malaysian Stations"),
                    buildBrowsableCategory(NODE_RADIO_ELECTRONIC, "Electronic & Synth", "Cyberpunk, Synthwave & DEF CON"),
                    buildBrowsableCategory(NODE_RADIO_CHILL, "Chill & Lo-Fi", "Downtempo, Lo-Fi beats & Ambient"),
                    buildBrowsableCategory(NODE_RADIO_NEWS, "News & World", "Global & Local News Talk"),
                    buildBrowsableCategory(NODE_RADIO_ALL, "All Stations", "Complete radio directory")
                )
            }
            nodeId == NODE_RADIO_FAVORITES -> {
                val favs = radioRepo?.getFavorites() ?: RadioProvider.STATIONS.take(3)
                favs.map { MediaItemMapper.toMediaItem(it.toTrack()) }
            }
            nodeId == NODE_RADIO_MALAYSIA -> {
                val myStations = radioRepo?.getMalaysianStations() ?: RadioProvider.STATIONS.filter { it.country == "Malaysia" }
                myStations.map { MediaItemMapper.toMediaItem(it.toTrack()) }
            }
            nodeId == NODE_RADIO_ELECTRONIC -> {
                val elec = radioRepo?.getStationsByCategory("Electronic") ?: emptyList()
                elec.map { MediaItemMapper.toMediaItem(it.toTrack()) }
            }
            nodeId == NODE_RADIO_CHILL -> {
                val chill = radioRepo?.getStationsByCategory("Chill") ?: emptyList()
                chill.map { MediaItemMapper.toMediaItem(it.toTrack()) }
            }
            nodeId == NODE_RADIO_NEWS -> {
                val news = radioRepo?.getStationsByCategory("News & Talk") ?: emptyList()
                news.map { MediaItemMapper.toMediaItem(it.toTrack()) }
            }
            nodeId == NODE_RADIO_ALL -> {
                val all = radioRepo?.getAllStations() ?: RadioProvider.STATIONS
                all.map { MediaItemMapper.toMediaItem(it.toTrack()) }
            }

            // === Test Media ===
            nodeId == NODE_TEST_MEDIA -> {
                CyberPulseTestMedia.ALL_TEST_TRACKS.map { MediaItemMapper.toMediaItem(it) }
            }

            // === Recently Played ===
            nodeId == NODE_RECENTLY_PLAYED -> {
                musicRepo?.recentlyPlayed?.value?.map { MediaItemMapper.toMediaItem(it) } ?: emptyList()
            }

            // === Liked Songs ===
            nodeId == NODE_LIKED -> {
                musicRepo?.getLikedTracks()?.map { MediaItemMapper.toMediaItem(it) } ?: emptyList()
            }

            // === Playlists ===
            nodeId == NODE_PLAYLISTS -> {
                musicRepo?.getAllPlaylists()?.map { pl ->
                    buildBrowsableCategory("playlist_${pl.id}", pl.title, "${pl.trackCount} tracks")
                } ?: emptyList()
            }

            nodeId.startsWith("playlist_") -> {
                val plId = nodeId.removePrefix("playlist_")
                val pl = musicRepo?.getAllPlaylists()?.firstOrNull { it.id == plId }
                pl?.tracks?.map { MediaItemMapper.toMediaItem(it) } ?: emptyList()
            }

            else -> emptyList()
        }
    }

    private fun buildBrowsableCategory(id: String, title: String, subtitle: String? = null): MediaItem {
        return MediaItem.Builder()
            .setMediaId(id)
            .setMediaMetadata(
                MediaMetadata.Builder()
                    .setTitle(title)
                    .setSubtitle(subtitle)
                    .setIsBrowsable(true)
                    .setIsPlayable(false)
                    .build()
            )
            .build()
    }
}
