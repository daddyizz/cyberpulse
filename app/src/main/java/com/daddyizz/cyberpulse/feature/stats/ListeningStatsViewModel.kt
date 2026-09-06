package com.daddyizz.cyberpulse.feature.stats

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.daddyizz.cyberpulse.core.analytics.ListeningAnalyticsRepository
import com.daddyizz.cyberpulse.core.analytics.ListeningPeriod
import com.daddyizz.cyberpulse.core.analytics.ListeningStats
import com.daddyizz.cyberpulse.core.billing.EntitlementRepository
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

data class ListeningStatsUiState(
    val selectedPeriod: ListeningPeriod = ListeningPeriod.WEEK_7_DAYS,
    val stats: ListeningStats = ListeningStats.empty(ListeningPeriod.WEEK_7_DAYS),
    val isLoading: Boolean = true,
    val isPro: Boolean = false,
    val hasMinimumData: Boolean = false,
    val showProLockDialog: Boolean = false
)

class ListeningStatsViewModel(
    private val analyticsRepository: ListeningAnalyticsRepository,
    private val entitlementRepository: EntitlementRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(ListeningStatsUiState())
    val uiState: StateFlow<ListeningStatsUiState> = _uiState.asStateFlow()

    init {
        // Observe Pro subscription status
        viewModelScope.launch {
            entitlementRepository.isPro.collectLatest { isPro ->
                _uiState.update { it.copy(isPro = isPro) }
                loadStats(_uiState.value.selectedPeriod)
            }
        }
    }

    fun selectPeriod(period: ListeningPeriod) {
        val isPro = _uiState.value.isPro
        // Pro Gate: 7 Days is free for all users. 30 Days, This Year, All Time are Pro features.
        if (!isPro && period != ListeningPeriod.WEEK_7_DAYS) {
            _uiState.update { it.copy(showProLockDialog = true) }
            return
        }

        _uiState.update { it.copy(selectedPeriod = period) }
        loadStats(period)
    }

    fun dismissProDialog() {
        _uiState.update { it.copy(showProLockDialog = false) }
    }

    fun refresh() {
        loadStats(_uiState.value.selectedPeriod)
    }

    fun clearAllData(onSuccess: () -> Unit = {}) {
        viewModelScope.launch {
            analyticsRepository.clearAllAnalytics()
            loadStats(_uiState.value.selectedPeriod)
            onSuccess()
        }
    }

    fun generateDemoStats(onSuccess: () -> Unit = {}) {
        viewModelScope.launch {
            analyticsRepository.populateDemoDataForTesting()
            loadStats(_uiState.value.selectedPeriod)
            onSuccess()
        }
    }

    private fun loadStats(period: ListeningPeriod) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            val stats = analyticsRepository.getStats(period)
            val hasData = analyticsRepository.hasRecordedData()
            _uiState.update {
                it.copy(
                    stats = stats,
                    isLoading = false,
                    hasMinimumData = hasData
                )
            }
        }
    }
}
