package com.daddyizz.cyberpulse.core.data

import com.daddyizz.cyberpulse.core.common.AppResult
import com.daddyizz.cyberpulse.core.model.*
import kotlinx.coroutines.delay

class DemoMusicSourceProvider : MusicSourceProvider {

    override val providerName: String = "CyberPulse Local Engine"
    override val providerSource: MusicSource = MusicSource.DEMO

    private val demoTracks = listOf(
        Track(
            id = "trk_01",
            title = "Night Drive",
            artist = "NeuroDancer",
            album = "Neon Drift LP",
            placeholderArtworkKey = "neon_horizon",
            durationSeconds = 214,
            source = MusicSource.DEMO,
            isLiked = true,
            playsCount = 142800L,
            artistId = "art_01",
            albumId = "alb_01",
            artwork = Artwork(url = null, placeholderKey = "neon_horizon")
        ),
        Track(
            id = "trk_02",
            title = "Cyber Mix",
            artist = "PulseMatrix",
            album = "Quantum Waves",
            placeholderArtworkKey = "purple_pulse",
            durationSeconds = 188,
            source = MusicSource.DEMO,
            isLiked = false,
            playsCount = 98300L,
            artistId = "art_05",
            albumId = "alb_02",
            artwork = Artwork(url = null, placeholderKey = "purple_pulse")
        ),
        Track(
            id = "trk_03",
            title = "Focus Mode",
            artist = "VoidEcho",
            album = "Subliminal Flow",
            placeholderArtworkKey = "digital_rain",
            durationSeconds = 302,
            source = MusicSource.DEMO,
            isLiked = true,
            playsCount = 312000L,
            artistId = "art_06",
            albumId = "alb_03",
            artwork = Artwork(url = null, placeholderKey = "digital_rain")
        ),
        Track(
            id = "trk_04",
            title = "Electric Dreams",
            artist = "Hologram Boy",
            album = "Silicon Memories",
            placeholderArtworkKey = "electric_dream",
            durationSeconds = 227,
            source = MusicSource.DEMO,
            isLiked = false,
            playsCount = 65400L,
            artistId = "art_03",
            albumId = "alb_04",
            artwork = Artwork(url = null, placeholderKey = "electric_dream")
        ),
        Track(
            id = "trk_05",
            title = "Midnight Pulse",
            artist = "CyberValkyrie",
            album = "Chrome Angels",
            placeholderArtworkKey = "midnight_circuit",
            durationSeconds = 245,
            source = MusicSource.DEMO,
            isLiked = true,
            playsCount = 205000L,
            artistId = "art_04",
            albumId = "alb_05",
            artwork = Artwork(url = null, placeholderKey = "midnight_circuit")
        ),
        Track(
            id = "trk_06",
            title = "Tokyo Overdrive",
            artist = "Vector 7",
            album = "Shinjuku Highway",
            placeholderArtworkKey = "neon_horizon",
            durationSeconds = 196,
            source = MusicSource.DEMO,
            isLiked = false,
            playsCount = 89000L,
            artistId = "art_02",
            albumId = "alb_06",
            artwork = Artwork(url = null, placeholderKey = "neon_horizon")
        ),
        Track(
            id = "trk_07",
            title = "Synthetic Heart",
            artist = "NeuroDancer",
            album = "Neon Drift LP",
            placeholderArtworkKey = "purple_pulse",
            durationSeconds = 232,
            source = MusicSource.DEMO,
            isLiked = true,
            playsCount = 120500L,
            artistId = "art_01",
            albumId = "alb_01",
            artwork = Artwork(url = null, placeholderKey = "purple_pulse")
        ),
        Track(
            id = "trk_08",
            title = "Glitch Odyssey",
            artist = "PulseMatrix",
            album = "Quantum Waves",
            placeholderArtworkKey = "digital_rain",
            durationSeconds = 264,
            source = MusicSource.DEMO,
            isLiked = false,
            playsCount = 47800L,
            artistId = "art_05",
            albumId = "alb_02",
            artwork = Artwork(url = null, placeholderKey = "digital_rain")
        ),
        Track(
            id = "trk_09",
            title = "Carbon Cascade",
            artist = "Vector 7",
            album = "Shinjuku Highway",
            placeholderArtworkKey = "midnight_circuit",
            durationSeconds = 210,
            source = MusicSource.DEMO,
            isLiked = false,
            playsCount = 55400L,
            artistId = "art_02",
            albumId = "alb_06",
            artwork = Artwork(url = null, placeholderKey = "midnight_circuit")
        ),
        Track(
            id = "trk_10",
            title = "Sub-bass Horizon",
            artist = "VoidEcho",
            album = "Subliminal Flow",
            placeholderArtworkKey = "neon_horizon",
            durationSeconds = 280,
            source = MusicSource.DEMO,
            isLiked = false,
            playsCount = 78000L,
            artistId = "art_06",
            albumId = "alb_03",
            artwork = Artwork(url = null, placeholderKey = "neon_horizon")
        )
    )

    private val demoArtists = listOf(
        Artist("art_01", "NeuroDancer", 845000L, "neon_horizon", null, Artwork(null, placeholderKey = "neon_horizon"), listOf("Electronic", "Synthwave"), "Pioneer of high-tempo neon synth aesthetics and analog arpeggios."),
        Artist("art_02", "Vector 7", 520000L, "midnight_circuit", null, Artwork(null, placeholderKey = "midnight_circuit"), listOf("Cyberpunk", "Darksynth"), "Heavy distorted basslines tailored for late-night concrete highways."),
        Artist("art_03", "Hologram Boy", 430000L, "electric_dream", null, Artwork(null, placeholderKey = "electric_dream"), listOf("Lo-Fi", "Indie"), "Warm tape-decay soundscapes fused with retro-futuristic vocals."),
        Artist("art_04", "CyberValkyrie", 680000L, "purple_pulse", null, Artwork(null, placeholderKey = "purple_pulse"), listOf("Metal", "Electronic"), "Symphonic industrial metal colliding with digital hyper-synthesis."),
        Artist("art_05", "PulseMatrix", 910000L, "digital_rain", null, Artwork(null, placeholderKey = "digital_rain"), listOf("Techno", "Acid"), "Hypnotic 303 modular patterns designed for endless subterranean rave states."),
        Artist("art_06", "VoidEcho", 340000L, "neon_horizon", null, Artwork(null, placeholderKey = "neon_horizon"), listOf("Ambient", "Focus"), "Deep atmospheric soundscapes designed for flow state and nocturnal immersion.")
    )

    private val demoAlbums = listOf(
        Album("alb_01", "Neon Drift LP", "NeuroDancer", "art_01", 2024, "neon_horizon", null, Artwork(null, placeholderKey = "neon_horizon"), 10),
        Album("alb_02", "Quantum Waves", "PulseMatrix", "art_05", 2023, "purple_pulse", null, Artwork(null, placeholderKey = "purple_pulse"), 8),
        Album("alb_03", "Subliminal Flow", "VoidEcho", "art_06", 2024, "digital_rain", null, Artwork(null, placeholderKey = "digital_rain"), 6),
        Album("alb_04", "Silicon Memories", "Hologram Boy", "art_03", 2023, "electric_dream", null, Artwork(null, placeholderKey = "electric_dream"), 11),
        Album("alb_05", "Chrome Angels", "CyberValkyrie", "art_04", 2024, "midnight_circuit", null, Artwork(null, placeholderKey = "midnight_circuit"), 9),
        Album("alb_06", "Shinjuku Highway", "Vector 7", "art_02", 2024, "neon_horizon", null, Artwork(null, placeholderKey = "neon_horizon"), 12)
    )

    private val demoPlaylists = listOf(
        Playlist("pl_01", "Night Drive", "High-speed synthwave & electronic bass", "High-speed synthwave & electronic bass for night cruises across the neo-city grid", "neon_horizon", null, Artwork(null, placeholderKey = "neon_horizon"), 42, "CyberPulse Curators"),
        Playlist("pl_02", "Cyber Mix", "Curated algorithmic selections", "Algorithmic pulse generator tailored to your frequency", "purple_pulse", null, Artwork(null, placeholderKey = "purple_pulse"), 50, "CyberPulse Core"),
        Playlist("pl_03", "Focus Mode", "Deep binaural coding ambient", "Deep atmospheric binaural frequencies for coding, deep architecture, and focus", "digital_rain", null, Artwork(null, placeholderKey = "digital_rain"), 36, "VoidEcho Labs"),
        Playlist("pl_04", "Electric Dreams", "Melancholic retro textures", "Melancholic retro-futuristic audio textures and lo-fi synthetic memories", "electric_dream", null, Artwork(null, placeholderKey = "electric_dream"), 28, "CyberPulse Curators"),
        Playlist("pl_05", "Midnight Pulse", "Peak-hour cyber dance", "Peak-hour cyber dance and neon club tracks directly from subterranean hubs", "midnight_circuit", null, Artwork(null, placeholderKey = "midnight_circuit"), 60, "PulseMatrix Curations")
    )

    override suspend fun search(
        query: String,
        filter: SearchFilter,
        pageToken: String?
    ): AppResult<SearchResultPage> {
        delay(40) // Simulate fast local/cache query
        if (query.isBlank()) {
            return AppResult.Success(SearchResultPage())
        }

        val q = query.lowercase().trim()
        val items = mutableListOf<SearchResultItem>()

        if (filter == SearchFilter.ALL || filter == SearchFilter.SONGS) {
            demoTracks.filter {
                it.title.lowercase().contains(q) ||
                it.artist.lowercase().contains(q) ||
                it.album.lowercase().contains(q)
            }.forEach { items.add(SearchResultItem.TrackResult(it)) }
        }

        if (filter == SearchFilter.ALL || filter == SearchFilter.ARTISTS) {
            demoArtists.filter {
                it.name.lowercase().contains(q) ||
                it.genres.any { g -> g.lowercase().contains(q) }
            }.forEach { items.add(SearchResultItem.ArtistResult(it)) }
        }

        if (filter == SearchFilter.ALL || filter == SearchFilter.ALBUMS) {
            demoAlbums.filter {
                it.title.lowercase().contains(q) ||
                it.artist.lowercase().contains(q)
            }.forEach { items.add(SearchResultItem.AlbumResult(it)) }
        }

        if (filter == SearchFilter.ALL || filter == SearchFilter.PLAYLISTS) {
            demoPlaylists.filter {
                it.title.lowercase().contains(q) ||
                it.subtitle.lowercase().contains(q)
            }.forEach { items.add(SearchResultItem.PlaylistResult(it)) }
        }

        return AppResult.Success(
            SearchResultPage(
                items = items,
                nextPageToken = null,
                totalEstimatedResults = items.size,
                isFromCache = false
            )
        )
    }

    override suspend fun getTrack(id: String): AppResult<Track?> {
        val trk = demoTracks.find { it.id == id }
        return AppResult.Success(trk)
    }

    override suspend fun getArtist(id: String): AppResult<Artist?> {
        val art = demoArtists.find { it.id == id }
        return AppResult.Success(art)
    }

    override suspend fun getAlbum(id: String): AppResult<Album?> {
        val alb = demoAlbums.find { it.id == id }?.let { album ->
            val albumTracks = demoTracks.filter { it.albumId == album.id }
            album.copy(tracks = albumTracks, tracksCount = albumTracks.size)
        }
        return AppResult.Success(alb)
    }

    override suspend fun getPlaylist(id: String): AppResult<Playlist?> {
        val pl = demoPlaylists.find { it.id == id }?.let { playlist ->
            playlist.copy(tracks = demoTracks.take(6))
        }
        return AppResult.Success(pl)
    }

    override suspend fun getArtistTopTracks(id: String): AppResult<List<Track>> {
        val artist = demoArtists.find { it.id == id }
        val tracks = if (artist != null) {
            demoTracks.filter { it.artistId == id || it.artist.equals(artist.name, ignoreCase = true) }
        } else {
            demoTracks.take(4)
        }
        return AppResult.Success(tracks)
    }

    override suspend fun getArtistAlbums(id: String): AppResult<List<Album>> {
        val albums = demoAlbums.filter { it.artistId == id }
        return AppResult.Success(albums)
    }

    override suspend fun getRelatedTracks(id: String): AppResult<List<Track>> {
        val current = demoTracks.find { it.id == id }
        val related = demoTracks.filter { it.id != id && (current == null || it.artist == current.artist) }
        return AppResult.Success(related.ifEmpty { demoTracks.shuffled().take(4) })
    }

    override fun getPlaybackCapability(track: Track): PlaybackCapability {
        return PlaybackCapability(
            mode = PlaybackMode.SUPPORTED_OFFICIAL,
            supportsOffline = true,
            supportsLyrics = true,
            streamBitrateKbps = 320,
            notice = "Local demo metadata ready. Real audio playback activated in Block 3."
        )
    }

    fun getAllTracks(): List<Track> = demoTracks
    fun getAllArtists(): List<Artist> = demoArtists
    fun getAllPlaylists(): List<Playlist> = demoPlaylists
    fun getAllAlbums(): List<Album> = demoAlbums
}
