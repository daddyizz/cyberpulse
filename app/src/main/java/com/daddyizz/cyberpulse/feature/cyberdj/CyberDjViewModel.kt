package com.daddyizz.cyberpulse.feature.cyberdj

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.daddyizz.cyberpulse.CyberPulseApplication
import com.daddyizz.cyberpulse.core.billing.PremiumFeature
import com.daddyizz.cyberpulse.core.model.Track
import com.daddyizz.cyberpulse.core.player.PlaybackConnection
import com.daddyizz.cyberpulse.core.player.PlaybackState
import com.daddyizz.cyberpulse.core.recommendation.CyberDjMode
import com.daddyizz.cyberpulse.core.recommendation.CyberDjSessionManager
import com.daddyizz.cyberpulse.core.recommendation.CyberDjSessionState
import com.daddyizz.cyberpulse.core.recommendation.DjFeedbackAction
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn

class CyberDjViewModel : ViewModel() {

    private val app = CyberPulseApplication.instance
    private val sessionManager: CyberDjSessionManager = app.cyberDjSessionManager
    private val playbackConnection: PlaybackConnection = app.playbackConnection
    private val entitlementRepository = app.entitlementRepository
    private val aiUsageRepository = app.aiUsageRepository

    val sessionState: StateFlow<CyberDjSessionState> = sessionManager.sessionState
    val playbackState: StateFlow<PlaybackState> = playbackConnection.playbackState

    val isPro: StateFlow<Boolean> = entitlementRepository.isPro
        .stateIn(viewModelScope, SharingStarted.Eagerly, false)

    fun startSession(mode: CyberDjMode) {
        sessionManager.startSession(mode)
    }

    fun updateEnergy(energy: Int) {
        sessionManager.updateEnergy(energy)
    }

    fun updateDiscovery(ratio: Float) {
        sessionManager.updateDiscovery(ratio)
    }

    fun applyFeedback(action: DjFeedbackAction) {
        sessionManager.applyFeedback(action)
    }

    fun endSession(keepQueue: Boolean) {
        sessionManager.endSession(keepQueue)
    }

    fun saveQueueAsPlaylist(title: String? = null) {
        sessionManager.saveCurrentQueueAsPlaylist(title)
    }

    fun canAccessMode(mode: CyberDjMode): Boolean {
        return aiUsageRepository.canAccessDjMode(mode)
    }

    fun canUseAdvancedTuning(): Boolean {
        return aiUsageRepository.canUseAdvancedDjTuning()
    }
}
