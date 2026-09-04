package com.daddyizz.cyberpulse.feature.onboarding

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.daddyizz.cyberpulse.core.data.UserPreferencesRepository
import com.daddyizz.cyberpulse.core.model.Artist
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class OnboardingUiState(
    val currentStep: Int = 1,
    val selectedGenres: Set<String> = emptySet(),
    val selectedArtists: Set<String> = emptySet(),
    val personalizedRecommendations: Boolean = true,
    val notificationsRequested: Boolean = false,
    val isCompleted: Boolean = false
)

class OnboardingViewModel(
    private val preferencesRepository: UserPreferencesRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(OnboardingUiState())
    val uiState: StateFlow<OnboardingUiState> = _uiState.asStateFlow()

    val availableGenres = listOf(
        "Pop", "Rock", "Hip Hop", "Electronic",
        "R&B", "Indie", "Metal", "Jazz",
        "Classical", "K-Pop", "Malay", "Indonesian",
        "Lo-Fi", "Alternative", "Soul", "Country"
    )

    val availableArtists = listOf(
        Artist("art_01", "NeuroDancer", 845000L, "neon_horizon", listOf("Electronic", "Synthwave")),
        Artist("art_02", "Vector 7", 520000L, "midnight_circuit", listOf("Cyberpunk", "Darksynth")),
        Artist("art_03", "Hologram Boy", 430000L, "electric_dream", listOf("Lo-Fi", "Indie")),
        Artist("art_04", "CyberValkyrie", 680000L, "purple_pulse", listOf("Metal", "Electronic")),
        Artist("art_05", "PulseMatrix", 910000L, "digital_rain", listOf("Techno", "Acid")),
        Artist("art_06", "VoidEcho", 340000L, "neon_horizon", listOf("Ambient", "Focus"))
    )

    fun nextStep() {
        if (_uiState.value.currentStep < 6) {
            _uiState.update { it.copy(currentStep = it.currentStep + 1) }
        }
    }

    fun previousStep() {
        if (_uiState.value.currentStep > 1) {
            _uiState.update { it.copy(currentStep = it.currentStep - 1) }
        }
    }

    fun toggleGenre(genre: String) {
        val current = _uiState.value.selectedGenres.toMutableSet()
        if (current.contains(genre)) current.remove(genre) else current.add(genre)
        _uiState.update { it.copy(selectedGenres = current) }
    }

    fun toggleArtist(artistId: String) {
        val current = _uiState.value.selectedArtists.toMutableSet()
        if (current.contains(artistId)) current.remove(artistId) else current.add(artistId)
        _uiState.update { it.copy(selectedArtists = current) }
    }

    fun togglePersonalization(enabled: Boolean) {
        _uiState.update { it.copy(personalizedRecommendations = enabled) }
    }

    fun setNotificationChoice(enabled: Boolean) {
        _uiState.update { it.copy(notificationsRequested = enabled) }
        viewModelScope.launch {
            preferencesRepository.setNotificationsEnabled(enabled)
        }
        nextStep()
    }

    fun completeOnboarding(onFinished: () -> Unit) {
        viewModelScope.launch {
            preferencesRepository.updateSelectedGenres(_uiState.value.selectedGenres)
            preferencesRepository.updateSelectedArtists(_uiState.value.selectedArtists)
            preferencesRepository.setRecommendationsEnabled(_uiState.value.personalizedRecommendations)
            preferencesRepository.setOnboardingCompleted(true)
            _uiState.update { it.copy(isCompleted = true) }
            onFinished()
        }
    }
}
