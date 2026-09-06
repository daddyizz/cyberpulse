package com.daddyizz.cyberpulse.feature.replay

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.daddyizz.cyberpulse.core.analytics.CyberPulseReplayData
import com.daddyizz.cyberpulse.core.analytics.ListeningAnalyticsRepository
import com.daddyizz.cyberpulse.core.analytics.ReplayGenerator
import com.daddyizz.cyberpulse.core.analytics.ReplayStoryCard
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.util.*

data class ReplayUiState(
    val selectedYear: Int = Calendar.getInstance().get(Calendar.YEAR),
    val replayData: CyberPulseReplayData? = null,
    val storyCards: List<ReplayStoryCard> = emptyList(),
    val currentCardIndex: Int = 0,
    val isLoading: Boolean = true,
    val isPaused: Boolean = false
)

class CyberPulseReplayViewModel(
    private val analyticsRepository: ListeningAnalyticsRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(ReplayUiState())
    val uiState: StateFlow<ReplayUiState> = _uiState.asStateFlow()

    init {
        loadReplay(_uiState.value.selectedYear)
    }

    fun selectYear(year: Int) {
        _uiState.update { it.copy(selectedYear = year) }
        loadReplay(year)
    }

    fun setCurrentCardIndex(index: Int) {
        val totalCards = _uiState.value.storyCards.size
        if (index in 0 until totalCards) {
            _uiState.update { it.copy(currentCardIndex = index) }
        }
    }

    fun nextCard() {
        val next = _uiState.value.currentCardIndex + 1
        if (next < _uiState.value.storyCards.size) {
            _uiState.update { it.copy(currentCardIndex = next) }
        }
    }

    fun previousCard() {
        val prev = _uiState.value.currentCardIndex - 1
        if (prev >= 0) {
            _uiState.update { it.copy(currentCardIndex = prev) }
        }
    }

    fun setPaused(paused: Boolean) {
        _uiState.update { it.copy(isPaused = paused) }
    }

    fun generateTestDataset(onSuccess: () -> Unit = {}) {
        viewModelScope.launch {
            analyticsRepository.populateDemoDataForTesting()
            loadReplay(_uiState.value.selectedYear)
            onSuccess()
        }
    }

    private fun loadReplay(year: Int) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            val data = analyticsRepository.getReplay(year)
            val cards = if (data.isEligible) {
                ReplayGenerator.buildStoryCards(data)
            } else {
                emptyList()
            }
            _uiState.update {
                it.copy(
                    replayData = data,
                    storyCards = cards,
                    currentCardIndex = 0,
                    isLoading = false
                )
            }
        }
    }
}
