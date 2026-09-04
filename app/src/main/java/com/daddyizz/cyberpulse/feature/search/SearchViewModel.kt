package com.daddyizz.cyberpulse.feature.search

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.daddyizz.cyberpulse.core.common.AppResult
import com.daddyizz.cyberpulse.core.common.CyberPulseError
import com.daddyizz.cyberpulse.core.data.MusicRepository
import com.daddyizz.cyberpulse.core.model.*
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

data class SearchUiState(
    val query: String = "",
    val activeFilter: SearchFilter = SearchFilter.ALL,
    val resultPage: SearchResultPage = SearchResultPage(),
    val searchResults: List<Track> = emptyList(), // legacy convenience
    val suggestions: List<String> = emptyList(),
    val recentSearches: List<String> = emptyList(),
    val isLoading: Boolean = false,
    val isPaginating: Boolean = false,
    val isSearching: Boolean = false, // legacy convenience
    val errorMessage: String? = null,
    val error: CyberPulseError? = null,
    val isOfflineMode: Boolean = false,
    val endReached: Boolean = false
)

class SearchViewModel(
    private val musicRepository: MusicRepository
) : ViewModel() {

    private val searchRepository = musicRepository.searchRepository

    private val _uiState = MutableStateFlow(SearchUiState())
    val uiState: StateFlow<SearchUiState> = _uiState.asStateFlow()

    private var searchJob: Job? = null

    val browseCategories = listOf(
        Pair("Trending", "#FF2ED1"),
        Pair("New Releases", "#00F5FF"),
        Pair("Charts", "#8B5CFF"),
        Pair("Synthwave", "#FF5E3A"),
        Pair("Cyberpunk", "#E02424"),
        Pair("Acid Techno", "#F59E0B"),
        Pair("Electronic", "#10B981"),
        Pair("Workout", "#06B6D4"),
        Pair("Focus Binaural", "#6366F1"),
        Pair("Chill Lo-Fi", "#8B5CF6"),
        Pair("Sleep Ambient", "#3B82F6")
    )

    init {
        // Collect recent searches
        viewModelScope.launch {
            searchRepository.getRecentSearches().collect { recent ->
                _uiState.update { current ->
                    current.copy(
                        recentSearches = recent,
                        suggestions = searchRepository.getSuggestions(current.query, recent)
                    )
                }
            }
        }

        // Collect offline mode state
        viewModelScope.launch {
            searchRepository.isOfflineMode.collect { offline ->
                _uiState.update { it.copy(isOfflineMode = offline) }
            }
        }
    }

    fun onQueryChanged(newQuery: String) {
        val trimmed = newQuery
        _uiState.update { current ->
            current.copy(
                query = trimmed,
                suggestions = searchRepository.getSuggestions(trimmed, current.recentSearches),
                errorMessage = null,
                error = null
            )
        }

        searchJob?.cancel()

        if (trimmed.isBlank()) {
            _uiState.update {
                it.copy(
                    resultPage = SearchResultPage(),
                    searchResults = emptyList(),
                    isLoading = false,
                    isSearching = false,
                    endReached = false
                )
            }
            return
        }

        searchJob = viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, isSearching = true) }
            delay(350) // User input debounce

            performSearch(query = trimmed, filter = _uiState.value.activeFilter, pageToken = null)
        }
    }

    fun onFilterSelected(filter: SearchFilter) {
        if (_uiState.value.activeFilter == filter) return
        _uiState.update { it.copy(activeFilter = filter) }

        if (_uiState.value.query.isNotBlank()) {
            searchJob?.cancel()
            searchJob = viewModelScope.launch {
                _uiState.update { it.copy(isLoading = true) }
                performSearch(query = _uiState.value.query, filter = filter, pageToken = null)
            }
        }
    }

    private suspend fun performSearch(
        query: String,
        filter: SearchFilter,
        pageToken: String?
    ) {
        val result = searchRepository.search(
            query = query,
            filter = filter,
            pageToken = pageToken
        )

        when (result) {
            is AppResult.Success -> {
                val tracks = result.data.items.mapNotNull {
                    (it as? SearchResultItem.TrackResult)?.track?.copy(
                        isLiked = musicRepository.isTrackLiked(it.track.id)
                    )
                }
                _uiState.update {
                    it.copy(
                        resultPage = result.data,
                        searchResults = tracks,
                        isLoading = false,
                        isSearching = false,
                        errorMessage = null,
                        error = null,
                        endReached = result.data.nextPageToken == null
                    )
                }
                // Save to recent searches on successful search
                searchRepository.addRecentSearch(query)
            }
            is AppResult.Error -> {
                val cyberError = (result.exception as? CyberPulseError)
                    ?: CyberPulseError.Unknown(result.message, result.exception)
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        isSearching = false,
                        errorMessage = cyberError.message,
                        error = cyberError
                    )
                }
            }
            is AppResult.Loading -> {
                _uiState.update { it.copy(isLoading = true, isSearching = true) }
            }
        }
    }

    fun loadNextPage() {
        val currentState = _uiState.value
        val nextToken = currentState.resultPage.nextPageToken
        if (currentState.isPaginating || currentState.isLoading || nextToken == null) return

        viewModelScope.launch {
            _uiState.update { it.copy(isPaginating = true) }

            val result = searchRepository.search(
                query = currentState.query,
                filter = currentState.activeFilter,
                pageToken = nextToken
            )

            if (result is AppResult.Success) {
                val combinedItems = currentState.resultPage.items + result.data.items
                val updatedPage = result.data.copy(
                    items = combinedItems,
                    totalEstimatedResults = currentState.resultPage.totalEstimatedResults
                )
                val tracks = combinedItems.mapNotNull {
                    (it as? SearchResultItem.TrackResult)?.track?.copy(
                        isLiked = musicRepository.isTrackLiked(it.track.id)
                    )
                }

                _uiState.update {
                    it.copy(
                        resultPage = updatedPage,
                        searchResults = tracks,
                        isPaginating = false,
                        endReached = result.data.nextPageToken == null
                    )
                }
            } else {
                _uiState.update { it.copy(isPaginating = false) }
            }
        }
    }

    fun retry() {
        if (_uiState.value.query.isNotBlank()) {
            searchJob?.cancel()
            searchJob = viewModelScope.launch {
                _uiState.update { it.copy(isLoading = true, errorMessage = null, error = null) }
                performSearch(_uiState.value.query, _uiState.value.activeFilter, null)
            }
        }
    }

    fun clearQuery() {
        onQueryChanged("")
    }

    fun selectRecentSearch(term: String) {
        onQueryChanged(term)
    }

    fun removeRecentSearch(term: String) {
        viewModelScope.launch {
            searchRepository.removeRecentSearch(term)
        }
    }

    fun clearAllRecentSearches() {
        viewModelScope.launch {
            searchRepository.clearAllRecentSearches()
        }
    }

    fun toggleOfflineMode() {
        val newMode = !_uiState.value.isOfflineMode
        searchRepository.toggleOfflineMode(newMode)
        if (_uiState.value.query.isNotBlank()) {
            retry()
        }
    }
}
