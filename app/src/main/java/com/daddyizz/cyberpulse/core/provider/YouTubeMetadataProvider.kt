package com.daddyizz.cyberpulse.core.provider

import com.daddyizz.cyberpulse.BuildConfig
import com.daddyizz.cyberpulse.core.common.AppResult
import com.daddyizz.cyberpulse.core.common.CyberPulseError
import com.daddyizz.cyberpulse.core.model.*
import com.daddyizz.cyberpulse.core.network.YouTubeApiService
import com.daddyizz.cyberpulse.core.network.YouTubeDurationParser
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * Production-ready metadata provider communicating via permitted public Google YouTube Data API v3.
 *
 * Strict Compliance:
 * - Uses only permitted, documented public endpoints.
 * - Extracts metadata only (titles, artist/channel name, thumbnails, duration).
 * - Does not scrape private YouTube Music endpoints.
 * - Does not extract raw media/audio streams.
 * - Does not bypass ads or premium restrictions.
 */
class YouTubeMetadataProvider(
    private val apiService: YouTubeApiService,
    private val apiKey: String = BuildConfig.YOUTUBE_API_KEY
) : MusicSourceProvider {

    override val providerName: String = "YouTube Public Metadata API"
    override val providerSource: MusicSource = MusicSource.YOUTUBE

    override suspend fun search(
        query: String,
        filter: SearchFilter,
        pageToken: String?
    ): AppResult<SearchResultPage> = withContext(Dispatchers.IO) {
        if (apiKey.isBlank()) {
            return@withContext AppResult.Error(
                CyberPulseError.Unauthorized("YouTube API key not configured in local.properties. Set YOUTUBE_API_KEY to query live public metadata.")
            )
        }

        try {
            val typeParam = when (filter) {
                SearchFilter.ALL -> "video,channel,playlist"
                SearchFilter.SONGS, SearchFilter.VIDEOS -> "video"
                SearchFilter.ARTISTS -> "channel"
                SearchFilter.ALBUMS, SearchFilter.PLAYLISTS -> "playlist"
            }

            val response = apiService.search(
                query = query,
                type = typeParam,
                maxResults = 20,
                pageToken = pageToken,
                videoCategoryId = if (filter == SearchFilter.SONGS) "10" else null,
                apiKey = apiKey
            )

            if (!response.isSuccessful) {
                val code = response.code()
                return@withContext AppResult.Error(
                    when (code) {
                        403 -> CyberPulseError.QuotaExceeded()
                        429 -> CyberPulseError.RateLimited()
                        401 -> CyberPulseError.Unauthorized()
                        else -> CyberPulseError.ProviderUnavailable("HTTP $code: ${response.message()}")
                    }
                )
            }

            val body = response.body() ?: return@withContext AppResult.Success(SearchResultPage())
            val rawItems = body.items

            // Separate video IDs to query durations in batch
            val videoIds = rawItems.mapNotNull { it.id?.videoId }.joinToString(",")
            val videoDurationMap = mutableMapOf<String, Long>()

            if (videoIds.isNotBlank()) {
                try {
                    val detailResp = apiService.getVideos(ids = videoIds, apiKey = apiKey)
                    detailResp.body()?.items?.forEach { v ->
                        val durationSec = YouTubeDurationParser.parseIsoDurationToSeconds(v.contentDetails?.duration)
                        videoDurationMap[v.id] = durationSec
                    }
                } catch (_: Exception) {
                    // Non-fatal: duration falls back to 0
                }
            }

            val searchResults = mutableListOf<SearchResultItem>()
            for (item in rawItems) {
                val snippet = item.snippet ?: continue
                val resId = item.id

                val thumb = snippet.thumbnails?.high?.url
                    ?: snippet.thumbnails?.medium?.url
                    ?: snippet.thumbnails?.default?.url

                when {
                    resId?.videoId != null -> {
                        val duration = videoDurationMap[resId.videoId] ?: 0L
                        val track = Track(
                            id = "yt_trk_${resId.videoId}",
                            title = snippet.title?.replace("&quot;", "\"")?.replace("&#39;", "'") ?: "Unknown Track",
                            artist = snippet.channelTitle ?: "Various Artists",
                            album = "Unavailable (Direct Video Upload)",
                            artworkUrl = thumb,
                            artwork = Artwork(url = thumb, placeholderKey = "neon_horizon"),
                            durationSeconds = duration,
                            source = MusicSource.YOUTUBE,
                            sourceId = resId.videoId,
                            playbackCapability = getPlaybackCapability(
                                Track(
                                    id = resId.videoId,
                                    title = snippet.title ?: "",
                                    artist = snippet.channelTitle ?: "",
                                    album = ""
                                )
                            )
                        )
                        searchResults.add(SearchResultItem.TrackResult(track))
                    }
                    resId?.channelId != null -> {
                        val artist = Artist(
                            id = "yt_art_${resId.channelId}",
                            name = snippet.channelTitle ?: snippet.title ?: "Artist",
                            artworkUrl = thumb,
                            artwork = Artwork(url = thumb, placeholderKey = "purple_pulse"),
                            bio = snippet.description,
                            source = MusicSource.YOUTUBE,
                            sourceId = resId.channelId
                        )
                        searchResults.add(SearchResultItem.ArtistResult(artist))
                    }
                    resId?.playlistId != null -> {
                        val playlist = Playlist(
                            id = "yt_pl_${resId.playlistId}",
                            title = snippet.title ?: "Playlist",
                            subtitle = snippet.channelTitle ?: "",
                            description = snippet.description ?: "",
                            artworkUrl = thumb,
                            artwork = Artwork(url = thumb, placeholderKey = "digital_rain"),
                            createdBy = snippet.channelTitle ?: "YouTube Curator",
                            source = MusicSource.YOUTUBE,
                            sourceId = resId.playlistId
                        )
                        searchResults.add(SearchResultItem.PlaylistResult(playlist))
                    }
                }
            }

            AppResult.Success(
                SearchResultPage(
                    items = searchResults,
                    nextPageToken = body.nextPageToken,
                    totalEstimatedResults = body.pageInfo?.totalResults ?: searchResults.size
                )
            )
        } catch (e: Exception) {
            AppResult.Error(CyberPulseError.fromThrowable(e))
        }
    }

    override suspend fun getTrack(id: String): AppResult<Track?> = withContext(Dispatchers.IO) {
        val cleanId = id.removePrefix("yt_trk_")
        if (apiKey.isBlank()) return@withContext AppResult.Error(CyberPulseError.Unauthorized())

        try {
            val response = apiService.getVideos(ids = cleanId, apiKey = apiKey)
            if (!response.isSuccessful) return@withContext AppResult.Error(CyberPulseError.ProviderUnavailable())
            val item = response.body()?.items?.firstOrNull() ?: return@withContext AppResult.Success(null)

            val thumb = item.snippet?.thumbnails?.high?.url
                ?: item.snippet?.thumbnails?.medium?.url

            val duration = YouTubeDurationParser.parseIsoDurationToSeconds(item.contentDetails?.duration)
            val track = Track(
                id = "yt_trk_${item.id}",
                title = item.snippet?.title ?: "Track",
                artist = item.snippet?.channelTitle ?: "Artist",
                album = "Unavailable (Direct Video Upload)",
                artworkUrl = thumb,
                artwork = Artwork(url = thumb, placeholderKey = "neon_horizon"),
                durationSeconds = duration,
                source = MusicSource.YOUTUBE,
                sourceId = item.id,
                playbackCapability = PlaybackCapability(mode = PlaybackMode.EXTERNAL_PLAYER)
            )
            AppResult.Success(track)
        } catch (e: Exception) {
            AppResult.Error(CyberPulseError.fromThrowable(e))
        }
    }

    override suspend fun getArtist(id: String): AppResult<Artist?> = withContext(Dispatchers.IO) {
        val cleanId = id.removePrefix("yt_art_")
        if (apiKey.isBlank()) return@withContext AppResult.Error(CyberPulseError.Unauthorized())

        try {
            val response = apiService.getChannels(ids = cleanId, apiKey = apiKey)
            if (!response.isSuccessful) return@withContext AppResult.Error(CyberPulseError.ProviderUnavailable())
            val item = response.body()?.items?.firstOrNull() ?: return@withContext AppResult.Success(null)

            val thumb = item.snippet?.thumbnails?.high?.url ?: item.snippet?.thumbnails?.medium?.url
            val isHidden = item.statistics?.hiddenSubscriberCount == true
            val subscribers = if (isHidden) null else item.statistics?.subscriberCount?.toLongOrNull()

            val artist = Artist(
                id = "yt_art_${item.id}",
                name = item.snippet?.title ?: "Artist",
                artworkUrl = thumb,
                artwork = Artwork(url = thumb, placeholderKey = "purple_pulse"),
                bio = item.snippet?.description,
                subscriberCount = subscribers,
                isSubscriberCountHidden = isHidden,
                monthlyListeners = 0L, // Not applicable to YouTube Channels (only demo catalog)
                source = MusicSource.YOUTUBE,
                sourceId = item.id
            )
            AppResult.Success(artist)
        } catch (e: Exception) {
            AppResult.Error(CyberPulseError.fromThrowable(e))
        }
    }

    override suspend fun getAlbum(id: String): AppResult<Album?> = withContext(Dispatchers.IO) {
        val cleanId = id.removePrefix("yt_alb_").removePrefix("yt_pl_")
        if (apiKey.isBlank()) return@withContext AppResult.Error(CyberPulseError.Unauthorized())

        try {
            val response = apiService.getPlaylists(ids = cleanId, apiKey = apiKey)
            if (!response.isSuccessful) return@withContext AppResult.Error(CyberPulseError.ProviderUnavailable())
            val item = response.body()?.items?.firstOrNull() ?: return@withContext AppResult.Success(null)

            val thumb = item.snippet?.thumbnails?.high?.url ?: item.snippet?.thumbnails?.medium?.url
            val album = Album(
                id = "yt_alb_${item.id}",
                title = item.snippet?.title ?: "Album",
                artist = item.snippet?.channelTitle ?: "Artist",
                artworkUrl = thumb,
                artwork = Artwork(url = thumb, placeholderKey = "midnight_circuit"),
                tracksCount = item.contentDetails?.itemCount ?: 0,
                source = MusicSource.YOUTUBE,
                sourceId = item.id
            )
            AppResult.Success(album)
        } catch (e: Exception) {
            AppResult.Error(CyberPulseError.fromThrowable(e))
        }
    }

    override suspend fun getPlaylist(id: String): AppResult<Playlist?> = withContext(Dispatchers.IO) {
        val cleanId = id.removePrefix("yt_pl_")
        if (apiKey.isBlank()) return@withContext AppResult.Error(CyberPulseError.Unauthorized())

        try {
            val response = apiService.getPlaylists(ids = cleanId, apiKey = apiKey)
            if (!response.isSuccessful) return@withContext AppResult.Error(CyberPulseError.ProviderUnavailable())
            val item = response.body()?.items?.firstOrNull() ?: return@withContext AppResult.Success(null)

            val thumb = item.snippet?.thumbnails?.high?.url ?: item.snippet?.thumbnails?.medium?.url
            val playlist = Playlist(
                id = "yt_pl_${item.id}",
                title = item.snippet?.title ?: "Playlist",
                subtitle = item.snippet?.channelTitle ?: "",
                description = item.snippet?.description ?: "",
                artworkUrl = thumb,
                artwork = Artwork(url = thumb, placeholderKey = "digital_rain"),
                trackCount = item.contentDetails?.itemCount ?: 0,
                createdBy = item.snippet?.channelTitle ?: "YouTube Curator",
                source = MusicSource.YOUTUBE,
                sourceId = item.id
            )
            AppResult.Success(playlist)
        } catch (e: Exception) {
            AppResult.Error(CyberPulseError.fromThrowable(e))
        }
    }

    override suspend fun getArtistTopTracks(id: String): AppResult<List<Track>> = withContext(Dispatchers.IO) {
        // Query recent public music tracks associated with this channel
        val artistResult = getArtist(id)
        if (artistResult is AppResult.Success && artistResult.data != null) {
            val searchRes = search(artistResult.data.name + " music", SearchFilter.SONGS)
            if (searchRes is AppResult.Success) {
                val tracks = searchRes.data.items.mapNotNull { (it as? SearchResultItem.TrackResult)?.track }
                return@withContext AppResult.Success(tracks)
            }
        }
        AppResult.Success(emptyList())
    }

    override suspend fun getArtistAlbums(id: String): AppResult<List<Album>> = withContext(Dispatchers.IO) {
        val artistResult = getArtist(id)
        if (artistResult is AppResult.Success && artistResult.data != null) {
            val searchRes = search(artistResult.data.name + " full album", SearchFilter.ALBUMS)
            if (searchRes is AppResult.Success) {
                val albums = searchRes.data.items.mapNotNull { (it as? SearchResultItem.AlbumResult)?.album }
                return@withContext AppResult.Success(albums)
            }
        }
        AppResult.Success(emptyList())
    }

    override suspend fun getRelatedTracks(id: String): AppResult<List<Track>> = withContext(Dispatchers.IO) {
        val trackResult = getTrack(id)
        if (trackResult is AppResult.Success && trackResult.data != null) {
            val searchRes = search(trackResult.data.artist + " synth music", SearchFilter.SONGS)
            if (searchRes is AppResult.Success) {
                val tracks = searchRes.data.items.mapNotNull { (it as? SearchResultItem.TrackResult)?.track }
                return@withContext AppResult.Success(tracks)
            }
        }
        AppResult.Success(emptyList())
    }

    override fun getPlaybackCapability(track: Track): PlaybackCapability {
        return PlaybackCapability(
            mode = PlaybackMode.EXTERNAL_PLAYER,
            supportsOffline = false,
            supportsLyrics = true,
            streamBitrateKbps = 256,
            notice = "Official playback engine scheduled for Block 3 (Audio stream ripping strictly forbidden)"
        )
    }
}
