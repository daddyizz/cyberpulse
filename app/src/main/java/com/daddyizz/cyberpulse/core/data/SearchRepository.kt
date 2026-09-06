package com.daddyizz.cyberpulse.core.data

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import com.daddyizz.cyberpulse.core.cache.MetadataCache
import com.daddyizz.cyberpulse.core.common.AppResult
import com.daddyizz.cyberpulse.core.common.CyberPulseError
import com.daddyizz.cyberpulse.core.model.*
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.map

/**
 * Production Search Repository coordinating remote providers, local fallbacks,
 * metadata caching, and search history persistence.
 */
class SearchRepository(
    private val primaryProvider: MusicSourceProvider,
    private val fallbackProvider: MusicSourceProvider = DemoMusicSourceProvider(),
    private val cache: MetadataCache = MetadataCache(),
    private val dataStore: DataStore<Preferences>? = null,
    val spotifyProvider: MusicSourceProvider = com.daddyizz.cyberpulse.core.provider.SpotifyMetadataProvider(
        com.daddyizz.cyberpulse.core.network.CyberPulseNetworkClient.spotifyService
    )
) {
    companion object {
        val KEY_RECENT_SEARCHES = stringPreferencesKey("cyberpulse_recent_searches_v2")
        const val MAX_RECENT_SEARCHES = 20
    }

    private val _isOfflineMode = MutableStateFlow(false)
    val isOfflineMode = _isOfflineMode.asStateFlow()

    // Local in-memory fallback for recent searches if DataStore is uninitialized in tests
    private val _inMemoryRecent = MutableStateFlow(
        listOf("The Weeknd", "Blinding Lights", "Kavinsky", "Nightcall", "Daft Punk")
    )

    fun toggleOfflineMode(enabled: Boolean) {
        _isOfflineMode.value = enabled
    }

    suspend fun search(
        query: String,
        filter: SearchFilter = SearchFilter.ALL,
        pageToken: String? = null,
        forceRefresh: Boolean = false
    ): AppResult<SearchResultPage> {
        val trimmed = query.trim()
        if (trimmed.length < 2) {
            return AppResult.Success(SearchResultPage())
        }

        val app = try { com.daddyizz.cyberpulse.CyberPulseApplication.instance } catch (_: Exception) { null }

        // Specialized Local Device Filter
        if (filter == SearchFilter.LOCAL) {
            val localTracks = app?.localMusicProvider?.searchLocal(trimmed) ?: emptyList()
            val items = localTracks.map { SearchResultItem.TrackResult(it) }
            return AppResult.Success(SearchResultPage(items = items, totalEstimatedResults = items.size))
        }

        // Specialized Radio Stations Filter
        if (filter == SearchFilter.RADIO) {
            val radioStations = app?.radioRepository?.searchStations(trimmed) ?: emptyList()
            val items = radioStations.map { SearchResultItem.RadioResult(it) }
            return AppResult.Success(SearchResultPage(items = items, totalEstimatedResults = items.size))
        }

        // Specialized Spotify Filter
        if (filter == SearchFilter.SPOTIFY) {
            val spotifyResult = spotifyProvider.search(trimmed, filter, pageToken)
            if (spotifyResult is AppResult.Success) {
                val items = spotifyResult.data.tracks.map { SearchResultItem.TrackResult(it) }
                return AppResult.Success(SearchResultPage(items = items, totalEstimatedResults = items.size))
            }
            return spotifyResult
        }

        val cacheKey = "${filter.name}_${trimmed}_${pageToken ?: "p0"}"

        // 1. Check cache first if not forcing refresh
        if (!forceRefresh) {
            val cachedResult = cache.getSearch(cacheKey, allowExpired = _isOfflineMode.value)
            if (cachedResult != null) {
                return AppResult.Success(cachedResult)
            }
        }

        // 2. If forced offline mode, query local fallback provider
        if (_isOfflineMode.value) {
            val localResult = fallbackProvider.search(trimmed, filter, pageToken)
            if (localResult is AppResult.Success) {
                return AppResult.Success(localResult.data.copy(isFromCache = true))
            }
            return AppResult.Error(CyberPulseError.NetworkUnavailable())
        }

        // 3. Query primary source provider
        val primaryResult = primaryProvider.search(trimmed, filter, pageToken)

        return when (primaryResult) {
            is AppResult.Success -> {
                val combinedItems = if (filter == SearchFilter.ALL && pageToken == null) {
                    val localMatches = app?.localMusicProvider?.searchLocal(trimmed)?.take(3)?.map { SearchResultItem.TrackResult(it) } ?: emptyList()
                    val radioMatches = app?.radioRepository?.searchStations(trimmed)?.take(2)?.map { SearchResultItem.RadioResult(it) } ?: emptyList()
                    val spotifyMatches = (spotifyProvider.search(trimmed, SearchFilter.SONGS) as? AppResult.Success)?.data?.tracks?.take(4)?.map { SearchResultItem.TrackResult(it) } ?: emptyList()
                    spotifyMatches + localMatches + radioMatches + primaryResult.data.items
                } else {
                    primaryResult.data.items
                }
                val page = primaryResult.data.copy(items = combinedItems)
                cache.putSearch(cacheKey, page)
                AppResult.Success(page)
            }
            is AppResult.Error -> {
                // If primary provider had an issue (e.g. quota, unauthorized, timeout),
                // fall back to cache or demo catalog seamlessly
                val cachedFallback = cache.getSearch(cacheKey, allowExpired = true)
                if (cachedFallback != null) {
                    AppResult.Success(cachedFallback)
                } else {
                    val fallback = fallbackProvider.search(trimmed, filter, pageToken)
                    if (fallback is AppResult.Success) {
                        AppResult.Success(fallback.data.copy(isFromCache = true))
                    } else {
                        primaryResult
                    }
                }
            }
            is AppResult.Loading -> AppResult.Loading
        }
    }

    fun getRecentSearches(): Flow<List<String>> {
        if (dataStore == null) return _inMemoryRecent
        return dataStore.data.map { prefs ->
            val raw = prefs[KEY_RECENT_SEARCHES] ?: return@map _inMemoryRecent.value
            if (raw.isBlank()) emptyList()
            else raw.split("||").filter { it.isNotBlank() }
        }
    }

    suspend fun addRecentSearch(query: String) {
        val clean = query.trim()
        if (clean.isBlank()) return

        if (dataStore == null) {
            val current = _inMemoryRecent.value.toMutableList()
            current.remove(clean)
            current.add(0, clean)
            if (current.size > MAX_RECENT_SEARCHES) {
                _inMemoryRecent.value = current.take(MAX_RECENT_SEARCHES)
            } else {
                _inMemoryRecent.value = current
            }
            return
        }

        dataStore.edit { prefs ->
            val raw = prefs[KEY_RECENT_SEARCHES] ?: ""
            val current = raw.split("||").filter { it.isNotBlank() }.toMutableList()
            current.remove(clean)
            current.add(0, clean)
            val trimmed = current.take(MAX_RECENT_SEARCHES)
            prefs[KEY_RECENT_SEARCHES] = trimmed.joinToString("||")
        }
    }

    suspend fun removeRecentSearch(query: String) {
        if (dataStore == null) {
            _inMemoryRecent.value = _inMemoryRecent.value.filter { it != query }
            return
        }

        dataStore.edit { prefs ->
            val raw = prefs[KEY_RECENT_SEARCHES] ?: return@edit
            val current = raw.split("||").filter { it.isNotBlank() && it != query }
            prefs[KEY_RECENT_SEARCHES] = current.joinToString("||")
        }
    }

    suspend fun clearAllRecentSearches() {
        if (dataStore == null) {
            _inMemoryRecent.value = emptyList()
            return
        }

        dataStore.edit { prefs ->
            prefs[KEY_RECENT_SEARCHES] = ""
        }
    }

    fun getSuggestions(query: String, recentList: List<String>): List<String> {
        val q = query.trim().lowercase()
        if (q.isBlank()) return recentList.take(6)

        val builtInKeywords = listOf(
            "The Weeknd", "Blinding Lights", "Kavinsky", "Nightcall", "Daft Punk",
            "Harder Better Faster", "M83", "Midnight City", "Carpenter Brut", "Turbo Killer",
            "The Midnight", "Days of Thunder", "Gunship", "Tech Noir", "HOME",
            "Resonance", "FM-84", "Running in the Night", "Starboy", "Synthwave", "French Touch"
        )

        val matches = (recentList + builtInKeywords)
            .distinct()
            .filter { it.lowercase().contains(q) && !it.equals(query, ignoreCase = true) }
            .take(6)

        return matches
    }
}
