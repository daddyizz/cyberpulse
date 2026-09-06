package com.daddyizz.cyberpulse.feature.aiplaylist

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.daddyizz.cyberpulse.CyberPulseApplication
import com.daddyizz.cyberpulse.core.billing.PremiumFeature
import com.daddyizz.cyberpulse.core.data.UserPreferences
import com.daddyizz.cyberpulse.core.model.Track
import com.daddyizz.cyberpulse.core.recommendation.*
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

sealed interface AiPlaylistUiState {
    data object Idle : AiPlaylistUiState
    data class Generating(val prompt: String) : AiPlaylistUiState
    data class Success(val resolvedPlaylist: ResolvedPlaylist) : AiPlaylistUiState
    data class Error(val message: String, val canFallbackLocally: Boolean) : AiPlaylistUiState
}

class AiPlaylistViewModel : ViewModel() {

    private val app = CyberPulseApplication.instance
    private val recommendationEngine = app.recommendationEngine
    private val playbackConnection = app.playbackConnection
    private val aiUsageRepository = app.aiUsageRepository
    private val userPreferencesRepository = app.userPreferencesRepository
    private val entitlementRepository = app.entitlementRepository
    private val aiPlaylistRepository = app.aiPlaylistRepository

    private val _uiState = MutableStateFlow<AiPlaylistUiState>(AiPlaylistUiState.Idle)
    val uiState: StateFlow<AiPlaylistUiState> = _uiState.asStateFlow()

    private val _prompt = MutableStateFlow("")
    val prompt: StateFlow<String> = _prompt.asStateFlow()

    private val _targetDurationMinutes = MutableStateFlow(45)
    val targetDurationMinutes: StateFlow<Int> = _targetDurationMinutes.asStateFlow()

    private val _resolutionMode = MutableStateFlow(PlaylistResolutionMode.PLAYABLE_NOW)
    val resolutionMode: StateFlow<PlaylistResolutionMode> = _resolutionMode.asStateFlow()

    val userPreferences: StateFlow<UserPreferences> = userPreferencesRepository.userPreferencesFlow
        .stateIn(viewModelScope, SharingStarted.Eagerly, UserPreferences())

    val generationsRemaining: StateFlow<Int> = aiUsageRepository.generationsRemainingFlow
        .stateIn(viewModelScope, SharingStarted.Eagerly, 5)

    val isPro: StateFlow<Boolean> = entitlementRepository.isPro

    val recentGeneratedPlaylists: StateFlow<List<ResolvedPlaylist>> = aiPlaylistRepository.recentGeneratedPlaylists

    private val _isSaved = MutableStateFlow(false)
    val isSaved: StateFlow<Boolean> = _isSaved.asStateFlow()

    fun updatePrompt(text: String) {
        _prompt.value = text
    }

    fun selectDuration(minutes: Int) {
        _targetDurationMinutes.value = minutes
    }

    fun setResolutionMode(mode: PlaylistResolutionMode) {
        _resolutionMode.value = mode
    }

    fun generatePlaylist(userPrompt: String = _prompt.value) {
        val trimmed = userPrompt.trim()
        if (trimmed.isBlank()) return

        _prompt.value = trimmed
        _uiState.value = AiPlaylistUiState.Generating(trimmed)
        _isSaved.value = false

        viewModelScope.launch {
            val trackCount = when (_targetDurationMinutes.value) {
                15 -> 6
                30 -> 10
                45 -> 15
                60 -> 20
                else -> 15
            }

            val result = recommendationEngine.generateAiPlaylist(
                prompt = trimmed,
                userPreferences = userPreferences.value,
                resolutionMode = _resolutionMode.value,
                targetDurationMinutes = _targetDurationMinutes.value,
                targetTrackCount = trackCount
            )

            result.fold(
                onSuccess = { playlist ->
                    _uiState.value = AiPlaylistUiState.Success(playlist)
                    aiPlaylistRepository.recordGeneratedPlaylist(playlist)
                },
                onFailure = { error ->
                    _uiState.value = AiPlaylistUiState.Error(
                        message = error.message ?: "Failed to generate AI playlist",
                        canFallbackLocally = true
                    )
                }
            )
        }
    }

    fun generateSmartLocalMix(userPrompt: String = _prompt.value) {
        val trimmed = userPrompt.ifBlank { "CyberPulse Smart Mix" }
        _uiState.value = AiPlaylistUiState.Generating(trimmed)
        _isSaved.value = false

        viewModelScope.launch {
            val context = ListenerContextBuilder.build(userPreferences.value, recommendationEngine.musicRepository)
            val intent = recommendationEngine.localEngine.createFallbackIntent(trimmed, context)
            val resolved = recommendationEngine.localEngine.generateResolvedPlaylistLocally(
                intent = intent,
                context = context,
                mode = _resolutionMode.value
            )
            _uiState.value = AiPlaylistUiState.Success(resolved)
            aiPlaylistRepository.recordGeneratedPlaylist(resolved)
        }
    }

    fun refinePlaylist(instruction: String) {
        val currentSuccess = _uiState.value as? AiPlaylistUiState.Success ?: return
        viewModelScope.launch {
            val refined = recommendationEngine.refinePlaylist(
                existing = currentSuccess.resolvedPlaylist,
                refinementText = instruction,
                userPreferences = userPreferences.value
            )
            refined.onSuccess {
                _uiState.value = AiPlaylistUiState.Success(it)
                aiPlaylistRepository.recordGeneratedPlaylist(it)
            }
        }
    }

    fun playPlaylist(playlist: ResolvedPlaylist, shuffle: Boolean = false) {
        val tracks = if (shuffle) playlist.tracks.shuffled() else playlist.tracks
        if (tracks.isNotEmpty()) {
            playbackConnection.playQueue(tracks, startIndex = 0)
        }
    }

    fun playTrack(track: Track, playlist: ResolvedPlaylist) {
        playbackConnection.playTrack(track, playlist.tracks)
    }

    fun savePlaylist(playlist: ResolvedPlaylist, title: String? = null) {
        recommendationEngine.saveResolvedPlaylist(playlist, title)
        _isSaved.value = true
    }

    fun loadExistingPlaylist(playlist: ResolvedPlaylist) {
        _uiState.value = AiPlaylistUiState.Success(playlist)
    }

    fun resetToInput() {
        _uiState.value = AiPlaylistUiState.Idle
        _isSaved.value = false
    }
}
