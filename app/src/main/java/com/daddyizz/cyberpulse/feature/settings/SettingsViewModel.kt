package com.daddyizz.cyberpulse.feature.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.daddyizz.cyberpulse.core.common.Constants
import com.daddyizz.cyberpulse.core.data.UserPreferences
import com.daddyizz.cyberpulse.core.data.UserPreferencesRepository
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class SettingsViewModel(
    private val preferencesRepository: UserPreferencesRepository
) : ViewModel() {

    val preferences: StateFlow<UserPreferences> = preferencesRepository.userPreferencesFlow
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = UserPreferences()
        )

    fun setTheme(theme: String) {
        viewModelScope.launch {
            preferencesRepository.setTheme(theme)
        }
    }

    fun toggleReduceAnimations(reduce: Boolean) {
        viewModelScope.launch {
            preferencesRepository.setReduceAnimations(reduce)
        }
    }

    fun toggleDynamicBackgrounds(enabled: Boolean) {
        viewModelScope.launch {
            preferencesRepository.setDynamicBackgrounds(enabled)
        }
    }

    fun toggleDataSaver(enabled: Boolean) {
        viewModelScope.launch {
            preferencesRepository.setDataSaver(enabled)
        }
    }

    fun toggleRecommendations(enabled: Boolean) {
        viewModelScope.launch {
            preferencesRepository.setRecommendationsEnabled(enabled)
        }
    }

    fun togglePersonalizedAi(enabled: Boolean) {
        viewModelScope.launch {
            preferencesRepository.setPersonalizedAiEnabled(enabled)
        }
    }

    fun toggleKeepListeningHistory(enabled: Boolean) {
        viewModelScope.launch {
            preferencesRepository.setKeepListeningHistory(enabled)
        }
    }

    fun toggleAllowExplicit(allow: Boolean) {
        viewModelScope.launch {
            preferencesRepository.setAllowExplicitContent(allow)
        }
    }

    fun setPreferredLanguages(languages: Set<String>) {
        viewModelScope.launch {
            preferencesRepository.setPreferredLanguages(languages)
        }
    }

    fun resetAiEngine() {
        try {
            com.daddyizz.cyberpulse.CyberPulseApplication.instance.aiPlaylistRepository.clearHistory()
        } catch (_: Exception) {}
    }
}
