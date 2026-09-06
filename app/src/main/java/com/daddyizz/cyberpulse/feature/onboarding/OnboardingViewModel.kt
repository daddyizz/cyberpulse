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
        Artist("art_01", "The Weeknd", 38900000L, avatarPlaceholderKey = "neon_horizon", artworkUrl = "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=800", genres = listOf("Electronic", "Synthwave", "R&B")),
        Artist("art_02", "Kavinsky", 18500000L, avatarPlaceholderKey = "purple_pulse", artworkUrl = "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=800", genres = listOf("Synthwave", "French House", "Cyberpunk")),
        Artist("art_03", "Daft Punk", 29000000L, avatarPlaceholderKey = "cyber_grid", artworkUrl = "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=800", genres = listOf("Electronic", "French Touch", "Disco")),
        Artist("art_04", "M83", 14500000L, avatarPlaceholderKey = "neon_horizon", artworkUrl = "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=800", genres = listOf("Dream Pop", "Electronic", "Ambient")),
        Artist("art_05", "Carpenter Brut", 8200000L, avatarPlaceholderKey = "purple_pulse", artworkUrl = "https://images.unsplash.com/photo-1571266028243-3716f02d2d2e?auto=format&fit=crop&q=80&w=800", genres = listOf("Darksynth", "Metal", "Cyberpunk")),
        Artist("art_06", "The Midnight", 7900000L, avatarPlaceholderKey = "neon_horizon", artworkUrl = "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800", genres = listOf("Synthwave", "Retrowave", "Saxophone")),
        Artist("art_07", "Gunship", 5400000L, avatarPlaceholderKey = "purple_pulse", artworkUrl = "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&q=80&w=800", genres = listOf("Cyberpunk", "Synthwave", "Rock")),
        Artist("art_08", "HOME", 6700000L, avatarPlaceholderKey = "cyber_grid", artworkUrl = "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&q=80&w=800", genres = listOf("Chillwave", "Lo-Fi", "Ambient"))
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
