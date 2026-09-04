package com.daddyizz.cyberpulse

import com.daddyizz.cyberpulse.core.cache.MetadataCache
import com.daddyizz.cyberpulse.core.common.AppResult
import com.daddyizz.cyberpulse.core.common.CyberPulseError
import com.daddyizz.cyberpulse.core.data.DemoMusicSourceProvider
import com.daddyizz.cyberpulse.core.data.SearchRepository
import com.daddyizz.cyberpulse.core.model.*
import kotlinx.coroutines.runBlocking
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test

class SearchRepositoryTest {

    private lateinit var fallbackProvider: DemoMusicSourceProvider
    private lateinit var cache: MetadataCache
    private lateinit var repository: SearchRepository

    // Mock primary provider that throws or succeeds on command
    private class FakePrimaryProvider(var shouldFail: Boolean = false) : MusicSourceProvider {
        override val providerName: String = "FakePrimary"
        override val providerSource: MusicSource = MusicSource.YOUTUBE

        override suspend fun search(query: String, filter: SearchFilter, pageToken: String?): AppResult<SearchResultPage> {
            if (shouldFail) {
                return AppResult.Error(CyberPulseError.QuotaExceeded())
            }
            val track = Track(
                id = "live_trk_01",
                title = "Live $query",
                artist = "Live Artist",
                album = "Live Album",
                durationSeconds = 180,
                source = MusicSource.YOUTUBE
            )
            return AppResult.Success(
                SearchResultPage(
                    items = listOf(SearchResultItem.TrackResult(track)),
                    nextPageToken = "next_page_1"
                )
            )
        }

        override suspend fun getTrack(id: String): AppResult<Track?> = AppResult.Success(null)
        override suspend fun getArtist(id: String): AppResult<Artist?> = AppResult.Success(null)
        override suspend fun getAlbum(id: String): AppResult<Album?> = AppResult.Success(null)
        override suspend fun getPlaylist(id: String): AppResult<Playlist?> = AppResult.Success(null)
        override suspend fun getArtistTopTracks(id: String): AppResult<List<Track>> = AppResult.Success(emptyList())
        override suspend fun getArtistAlbums(id: String): AppResult<List<Album>> = AppResult.Success(emptyList())
        override suspend fun getRelatedTracks(id: String): AppResult<List<Track>> = AppResult.Success(emptyList())
        override fun getPlaybackCapability(track: Track): PlaybackCapability = PlaybackCapability()
    }

    private lateinit var primaryProvider: FakePrimaryProvider

    @Before
    fun setup() {
        fallbackProvider = DemoMusicSourceProvider()
        cache = MetadataCache()
        primaryProvider = FakePrimaryProvider(shouldFail = false)
        repository = SearchRepository(
            primaryProvider = primaryProvider,
            fallbackProvider = fallbackProvider,
            cache = cache
        )
    }

    @Test
    fun primaryProviderSuccessReturnsRealResultsAndCaches() = runBlocking {
        val result = repository.search("Cyberpunk", SearchFilter.SONGS)
        assertTrue(result is AppResult.Success)

        val page = (result as AppResult.Success).data
        assertEquals(1, page.items.size)
        assertEquals("Live Cyberpunk", (page.items[0] as SearchResultItem.TrackResult).track.title)

        // Verify it was cached
        val cached = cache.getSearch("${SearchFilter.SONGS.name}_Cyberpunk_p0")
        assertNotNull(cached)
    }

    @Test
    fun fallbackProviderEngagedWhenPrimaryFails() = runBlocking {
        primaryProvider.shouldFail = true
        val result = repository.search("Night Drive", SearchFilter.ALL)

        assertTrue(result is AppResult.Success)
        val page = (result as AppResult.Success).data
        assertTrue(page.isFromCache)
        assertTrue(page.items.isNotEmpty())
    }

    @Test
    fun offlineModeServesLocalCatalogWithoutCallingPrimary() = runBlocking {
        repository.toggleOfflineMode(true)
        val result = repository.search("Night", SearchFilter.ALL)

        assertTrue(result is AppResult.Success)
        val page = (result as AppResult.Success).data
        assertTrue(page.isFromCache)
        assertTrue(page.items.any { (it as? SearchResultItem.TrackResult)?.track?.title?.contains("Night") == true })
    }

    @Test
    fun searchSuggestionsMatchKeywordAndQuery() {
        val suggestions = repository.getSuggestions("synth", listOf("Synthwave Classics", "NeuroDancer"))
        assertTrue(suggestions.any { it.contains("Synth", ignoreCase = true) })
    }
}
