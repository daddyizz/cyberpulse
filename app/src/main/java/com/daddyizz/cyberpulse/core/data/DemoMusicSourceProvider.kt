package com.daddyizz.cyberpulse.core.data

import com.daddyizz.cyberpulse.core.common.AppResult
import com.daddyizz.cyberpulse.core.model.*
import kotlinx.coroutines.delay

class DemoMusicSourceProvider : MusicSourceProvider {

    override val providerName: String = "CyberPulse Curated Engine"
    override val providerSource: MusicSource = MusicSource.DEMO

    private val demoTracks = listOf(
        Track(
            id = "trk_01",
            title = "Blinding Lights",
            artist = "The Weeknd",
            album = "After Hours",
            artworkUrl = "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=800",
            placeholderArtworkKey = "neon_horizon",
            durationSeconds = 200,
            source = MusicSource.DEMO,
            isLiked = true,
            playsCount = 3890000L,
            artistId = "art_01",
            albumId = "alb_01",
            artwork = Artwork(
                url = "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=800",
                placeholderKey = "neon_horizon"
            ),
            lyricsPreview = "I've been on my own for long enough, maybe you can show me how to love...",
            pulseScore = 99,
            year = 2020
        ),
        Track(
            id = "trk_02",
            title = "Nightcall",
            artist = "Kavinsky",
            album = "OutRun",
            artworkUrl = "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=800",
            placeholderArtworkKey = "purple_pulse",
            durationSeconds = 259,
            source = MusicSource.DEMO,
            isLiked = true,
            playsCount = 1850000L,
            artistId = "art_02",
            albumId = "alb_02",
            artwork = Artwork(
                url = "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=800",
                placeholderKey = "purple_pulse"
            ),
            lyricsPreview = "I'm giving you a night call to tell you how I feel...",
            pulseScore = 96,
            year = 2013
        ),
        Track(
            id = "trk_03",
            title = "Harder, Better, Faster, Stronger",
            artist = "Daft Punk",
            album = "Discovery",
            artworkUrl = "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=800",
            placeholderArtworkKey = "cyber_grid",
            durationSeconds = 224,
            source = MusicSource.DEMO,
            isLiked = true,
            playsCount = 2420000L,
            artistId = "art_03",
            albumId = "alb_03",
            artwork = Artwork(
                url = "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=800",
                placeholderKey = "cyber_grid"
            ),
            lyricsPreview = "Work it harder, make it better, do it faster, makes us stronger...",
            pulseScore = 98,
            year = 2001
        ),
        Track(
            id = "trk_04",
            title = "Midnight City",
            artist = "M83",
            album = "Hurry Up, We're Dreaming",
            artworkUrl = "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=800",
            placeholderArtworkKey = "neon_horizon",
            durationSeconds = 243,
            source = MusicSource.DEMO,
            isLiked = false,
            playsCount = 2150000L,
            artistId = "art_04",
            albumId = "alb_04",
            artwork = Artwork(
                url = "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=800",
                placeholderKey = "neon_horizon"
            ),
            lyricsPreview = "Waiting in a car, waiting for a ride in the dark...",
            pulseScore = 95,
            year = 2011
        ),
        Track(
            id = "trk_05",
            title = "Turbo Killer",
            artist = "Carpenter Brut",
            album = "Trilogy",
            artworkUrl = "https://images.unsplash.com/photo-1571266028243-3716f02d2d2e?auto=format&fit=crop&q=80&w=800",
            placeholderArtworkKey = "purple_pulse",
            durationSeconds = 208,
            source = MusicSource.DEMO,
            isLiked = true,
            playsCount = 980000L,
            artistId = "art_05",
            albumId = "alb_05",
            artwork = Artwork(
                url = "https://images.unsplash.com/photo-1571266028243-3716f02d2d2e?auto=format&fit=crop&q=80&w=800",
                placeholderKey = "purple_pulse"
            ),
            lyricsPreview = "Revving engines through the synthetic horizon...",
            pulseScore = 97,
            year = 2015
        ),
        Track(
            id = "trk_06",
            title = "Starboy",
            artist = "The Weeknd ft. Daft Punk",
            album = "Starboy",
            artworkUrl = "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800",
            placeholderArtworkKey = "cyber_grid",
            durationSeconds = 230,
            source = MusicSource.DEMO,
            isLiked = true,
            playsCount = 3100000L,
            artistId = "art_01",
            albumId = "alb_06",
            artwork = Artwork(
                url = "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800",
                placeholderKey = "cyber_grid"
            ),
            lyricsPreview = "Look what you've done, I'm a motherf***ing starboy...",
            pulseScore = 97,
            year = 2016
        ),
        Track(
            id = "trk_07",
            title = "Days of Thunder",
            artist = "The Midnight",
            album = "Days of Thunder",
            artworkUrl = "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800",
            placeholderArtworkKey = "neon_horizon",
            durationSeconds = 329,
            source = MusicSource.DEMO,
            isLiked = false,
            playsCount = 820000L,
            artistId = "art_06",
            albumId = "alb_07",
            artwork = Artwork(
                url = "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800",
                placeholderKey = "neon_horizon"
            ),
            lyricsPreview = "We were running out of time, down the Pacific Coast Highway...",
            pulseScore = 94,
            year = 2014
        ),
        Track(
            id = "trk_08",
            title = "Tech Noir",
            artist = "Gunship",
            album = "Gunship",
            artworkUrl = "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&q=80&w=800",
            placeholderArtworkKey = "purple_pulse",
            durationSeconds = 297,
            source = MusicSource.DEMO,
            isLiked = true,
            playsCount = 740000L,
            artistId = "art_07",
            albumId = "alb_08",
            artwork = Artwork(
                url = "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&q=80&w=800",
                placeholderKey = "purple_pulse"
            ),
            lyricsPreview = "Neon reflections in the rearview mirror...",
            pulseScore = 93,
            year = 2015
        ),
        Track(
            id = "trk_09",
            title = "Resonance",
            artist = "HOME",
            album = "Odyssey",
            artworkUrl = "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&q=80&w=800",
            placeholderArtworkKey = "cyber_grid",
            durationSeconds = 212,
            source = MusicSource.DEMO,
            isLiked = false,
            playsCount = 1950000L,
            artistId = "art_08",
            albumId = "alb_09",
            artwork = Artwork(
                url = "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&q=80&w=800",
                placeholderKey = "cyber_grid"
            ),
            lyricsPreview = "Ethereal synth resonance moving across the cosmos...",
            pulseScore = 92,
            year = 2014
        ),
        Track(
            id = "trk_10",
            title = "Running in the Night",
            artist = "FM-84",
            album = "Atlas",
            artworkUrl = "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&q=80&w=800",
            placeholderArtworkKey = "neon_horizon",
            durationSeconds = 270,
            source = MusicSource.DEMO,
            isLiked = true,
            playsCount = 880000L,
            artistId = "art_09",
            albumId = "alb_10",
            artwork = Artwork(
                url = "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&q=80&w=800",
                placeholderKey = "neon_horizon"
            ),
            lyricsPreview = "Heartbeats racing underneath city lights, running in the night...",
            pulseScore = 96,
            year = 2016
        )
    )

    private val demoArtists = listOf(
        Artist("art_01", "The Weeknd", 38900000L, "neon_horizon", "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=800", Artwork("https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=800", placeholderKey = "neon_horizon"), listOf("Electronic", "Synthwave", "R&B"), "Ikon global pembawa gelombang synthwave elektronik ke arus perdana dunia."),
        Artist("art_02", "Kavinsky", 18500000L, "purple_pulse", "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=800", Artwork("https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=800", placeholderKey = "purple_pulse"), listOf("Synthwave", "French House", "Cyberpunk"), "Peneraju muzik synthwave Perancis dengan trek ikonik Nightcall."),
        Artist("art_03", "Daft Punk", 29000000L, "cyber_grid", "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=800", Artwork("https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=800", placeholderKey = "cyber_grid"), listOf("Electronic", "French Touch", "Disco"), "Duo robot elektronik legenda dunia yang merevolusikan muzik tarian moden."),
        Artist("art_04", "M83", 14500000L, "neon_horizon", "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=800", Artwork("https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=800", placeholderKey = "neon_horizon"), listOf("Dream Pop", "Electronic", "Shoegaze"), "Pencipta landskap bunyi sinematik dan melodi nostalgia retro."),
        Artist("art_05", "Carpenter Brut", 8200000L, "purple_pulse", "https://images.unsplash.com/photo-1571266028243-3716f02d2d2e?auto=format&fit=crop&q=80&w=800", Artwork("https://images.unsplash.com/photo-1571266028243-3716f02d2d2e?auto=format&fit=crop&q=80&w=800", placeholderKey = "purple_pulse"), listOf("Darksynth", "Metal", "Cyberpunk"), "Adunan bertenaga tinggi darksynth, metal industri, dan elektro cyber."),
        Artist("art_06", "The Midnight", 7900000L, "neon_horizon", "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800", Artwork("https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800", placeholderKey = "neon_horizon"), listOf("Synthwave", "Retrowave", "Saxophone"), "Pencerita muzik 80s nostalgia dengan gabungan saksofon dan vokal emosional."),
        Artist("art_07", "Gunship", 5400000L, "purple_pulse", "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&q=80&w=800", Artwork("https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&q=80&w=800", placeholderKey = "purple_pulse"), listOf("Cyberpunk", "Synthwave", "Rock"), "Kumpulan synthwave sinematik terkemuka dari United Kingdom."),
        Artist("art_08", "HOME", 6700000L, "cyber_grid", "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&q=80&w=800", Artwork("https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&q=80&w=800", placeholderKey = "cyber_grid"), listOf("Chillwave", "Lo-Fi", "Ambient"), "Peneraju chillwave moden dengan trek santai dan fokus fikiran."),
        Artist("art_09", "FM-84", 4800000L, "neon_horizon", "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&q=80&w=800", Artwork("https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&q=80&w=800", placeholderKey = "neon_horizon"), listOf("Dreamwave", "Synthwave", "Pop"), "Harmoni musim panas abadi dengan synthesizers analog tulen.")
    )

    private val demoAlbums = listOf(
        Album("alb_01", "After Hours", "The Weeknd", "art_01", 2020, "neon_horizon", "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=800", Artwork("https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=800", placeholderKey = "neon_horizon"), 14),
        Album("alb_02", "OutRun", "Kavinsky", "art_02", 2013, "purple_pulse", "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=800", Artwork("https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=800", placeholderKey = "purple_pulse"), 13),
        Album("alb_03", "Discovery", "Daft Punk", "art_03", 2001, "cyber_grid", "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=800", Artwork("https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=800", placeholderKey = "cyber_grid"), 14),
        Album("alb_04", "Hurry Up, We're Dreaming", "M83", "art_04", 2011, "neon_horizon", "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=800", Artwork("https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=800", placeholderKey = "neon_horizon"), 22),
        Album("alb_05", "Trilogy", "Carpenter Brut", "art_05", 2015, "purple_pulse", "https://images.unsplash.com/photo-1571266028243-3716f02d2d2e?auto=format&fit=crop&q=80&w=800", Artwork("https://images.unsplash.com/photo-1571266028243-3716f02d2d2e?auto=format&fit=crop&q=80&w=800", placeholderKey = "purple_pulse"), 18),
        Album("alb_06", "Starboy", "The Weeknd", "art_01", 2016, "cyber_grid", "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800", Artwork("https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800", placeholderKey = "cyber_grid"), 18),
        Album("alb_07", "Days of Thunder", "The Midnight", "art_06", 2014, "neon_horizon", "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800", Artwork("https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800", placeholderKey = "neon_horizon"), 6),
        Album("alb_08", "Gunship", "Gunship", "art_07", 2015, "purple_pulse", "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&q=80&w=800", Artwork("https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&q=80&w=800", placeholderKey = "purple_pulse"), 13),
        Album("alb_09", "Odyssey", "HOME", "art_08", 2014, "cyber_grid", "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&q=80&w=800", Artwork("https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&q=80&w=800", placeholderKey = "cyber_grid"), 12),
        Album("alb_10", "Atlas", "FM-84", "art_09", 2016, "neon_horizon", "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&q=80&w=800", Artwork("https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&q=80&w=800", placeholderKey = "neon_horizon"), 11)
    )

    private val demoPlaylists = listOf(
        Playlist("pl_01", "Synthwave Neon Horizon", "Muzik Synthwave & Retro Paling Hangat", "Pilihan synthwave bertenaga tinggi untuk pemanduan malam di bawah cahaya neon bandar raya", "neon_horizon", "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=800", Artwork("https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=800", placeholderKey = "neon_horizon"), 42, "CyberPulse Curators"),
        Playlist("pl_02", "Cyber Mix (Pilihan Utama)", "Lagu-lagu Popular Masa Kini", "Koleksi seleksi algoritma dan trek kegemaran peminat cyberpunk", "purple_pulse", "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=800", Artwork("https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=800", placeholderKey = "purple_pulse"), 50, "CyberPulse Core"),
        Playlist("pl_03", "Deep Focus & Binaural", "Gelombang Bunyi Untuk Produktiviti", "Frekvensi binaural santai untuk mod fokus mendalam, pengaturcaraan, dan penyelidikan", "cyber_grid", "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&q=80&w=800", Artwork("https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&q=80&w=800", placeholderKey = "cyber_grid"), 36, "CyberPulse Labs"),
        Playlist("pl_04", "French Touch & Electro Legends", "Ikon Muzik Elektronik Eropah", "Irama disko elektronik daripada pelopor French House legenda dunia", "neon_horizon", "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=800", Artwork("https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=800", placeholderKey = "neon_horizon"), 28, "CyberPulse Curators"),
        Playlist("pl_05", "Darksynth & High Octane Drive", "Tenaga Maksimum & Bass Padu", "Trek kelajuan tinggi dengan bass berat dan synthesizers gelap untuk pengalaman adrenalin", "purple_pulse", "https://images.unsplash.com/photo-1571266028243-3716f02d2d2e?auto=format&fit=crop&q=80&w=800", Artwork("https://images.unsplash.com/photo-1571266028243-3716f02d2d2e?auto=format&fit=crop&q=80&w=800", placeholderKey = "purple_pulse"), 60, "CyberPulse Hardline")
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
            notice = "Curated high-fidelity audio stream. Background playback active."
        )
    }

    fun getAllTracks(): List<Track> = demoTracks
    fun getAllArtists(): List<Artist> = demoArtists
    fun getAllPlaylists(): List<Playlist> = demoPlaylists
    fun getAllAlbums(): List<Album> = demoAlbums
}
