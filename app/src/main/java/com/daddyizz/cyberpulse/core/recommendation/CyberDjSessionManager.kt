package com.daddyizz.cyberpulse.core.recommendation

import com.daddyizz.cyberpulse.core.data.UserPreferencesRepository
import com.daddyizz.cyberpulse.core.model.Playlist
import com.daddyizz.cyberpulse.core.model.Track
import com.daddyizz.cyberpulse.core.player.PlaybackConnection
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

/**
 * Observable UI state of an active Cyber DJ listening session.
 */
data class CyberDjSessionState(
    val isActive: Boolean = false,
    val mode: CyberDjMode = CyberDjMode.DRIVE,
    val plan: DjSessionPlan? = null,
    val currentEnergy: Int = 65,
    val discoveryRatio: Float = 0.3f,
    val remainingQueueCount: Int = 0,
    val totalTracksPlayedInSession: Int = 0,
    val lastFeedbackNotice: String? = null,
    val isExtendingQueue: Boolean = false
)

/**
 * Continuous Session Manager for Cyber DJ.
 *
 * Coordinates:
 * - Dynamic queue monitoring & automatic endless extension before playback runs out
 * - Real-time energy and discovery slider adjustments
 * - Instant tuning feedback ("More Like This", "Less Like This", "Surprise Me")
 * - Session recency tracking to prevent repetitive loops
 */
class CyberDjSessionManager(
    private val recommendationEngine: RecommendationEngine,
    private val playbackConnection: PlaybackConnection,
    private val userPreferencesRepository: UserPreferencesRepository,
    private val coroutineScope: CoroutineScope = CoroutineScope(Dispatchers.Main + Job())
) {

    private val _sessionState = MutableStateFlow(CyberDjSessionState())
    val sessionState: StateFlow<CyberDjSessionState> = _sessionState.asStateFlow()

    private val sessionFeedback = SessionFeedback()
    private val playedTrackIdsInSession = mutableSetOf<String>()
    private val queueExtensionMutex = Mutex()
    private var queueMonitorJob: Job? = null
    private var lastCurrentTrackId: String? = null

    /**
     * Starts a new Cyber DJ continuous listening session with the given mode.
     */
    fun startSession(
        mode: CyberDjMode,
        resolutionMode: PlaylistResolutionMode = PlaylistResolutionMode.PLAYABLE_NOW,
        onStarted: (() -> Unit)? = null
    ) {
        coroutineScope.launch {
            // 1. Reset previous session feedback
            sessionFeedback.reset()
            playedTrackIdsInSession.clear()
            lastCurrentTrackId = null

            val userPrefs = userPreferencesRepository.userPreferencesFlow.first()
            val context = ListenerContextBuilder.build(
                userPreferences = userPrefs,
                musicRepository = recommendationEngine.musicRepository,
                localTrackCount = recommendationEngine.localMusicProvider?.getTracks()?.size ?: 0
            )

            // 2. Generate plan from AI provider or fallback to local DJ engine
            val plan = recommendationEngine.aiProvider.generateDjSession(mode, context).getOrElse {
                recommendationEngine.localEngine.createFallbackDjPlan(mode, context)
            }

            _sessionState.value = CyberDjSessionState(
                isActive = true,
                mode = mode,
                plan = plan,
                currentEnergy = plan.targetEnergy,
                discoveryRatio = plan.discoveryRatio,
                isExtendingQueue = true
            )

            // 3. Resolve candidates and rank initial batch of 8-10 tracks
            val candidates = recommendationEngine.queryPlanner.resolveDjCandidates(plan, resolutionMode)
            val initialBatch = recommendationEngine.ranker.rankForDjSession(
                candidates = candidates,
                plan = plan,
                context = context,
                feedback = sessionFeedback,
                playedInSession = playedTrackIdsInSession,
                batchSize = 8
            )

            val playableQueue = if (initialBatch.isNotEmpty()) {
                initialBatch
            } else {
                recommendationEngine.musicRepository.fallbackProvider.getAllTracks().take(8)
            }

            playableQueue.forEach { playedTrackIdsInSession.add(it.id) }

            // 4. Start playback through PlaybackConnection
            playbackConnection.playQueue(playableQueue, startIndex = 0)

            _sessionState.update {
                it.copy(
                    isExtendingQueue = false,
                    remainingQueueCount = playableQueue.size
                )
            }

            // 5. Start continuous queue extension monitor
            startQueueMonitor(resolutionMode)
            onStarted?.invoke()
        }
    }

    /**
     * Continuously monitors playback queue and appends new tracks when remaining unplayed < 4.
     */
    private fun startQueueMonitor(resolutionMode: PlaylistResolutionMode) {
        queueMonitorJob?.cancel()
        queueMonitorJob = coroutineScope.launch {
            playbackConnection.playbackState.collectLatest { state ->
                if (!_sessionState.value.isActive) return@collectLatest

                val currentTrack = state.currentTrack
                if (currentTrack != null && currentTrack.id != lastCurrentTrackId) {
                    lastCurrentTrackId = currentTrack.id
                    playedTrackIdsInSession.add(currentTrack.id)
                    _sessionState.update { it.copy(totalTracksPlayedInSession = playedTrackIdsInSession.size) }
                }

                // Check remaining queue count
                val queueSize = state.queue.size
                val currentIndex = state.currentQueueIndex
                val remaining = (queueSize - 1 - currentIndex).coerceAtLeast(0)

                _sessionState.update { it.copy(remainingQueueCount = remaining) }

                // If remaining unplayed tracks < 4, extend queue proactively
                if (remaining < 4 && !_sessionState.value.isExtendingQueue) {
                    extendQueue(resolutionMode)
                }
            }
        }
    }

    /**
     * Computes and appends the next batch of tracks to the active queue.
     */
    private suspend fun extendQueue(resolutionMode: PlaylistResolutionMode) {
        queueExtensionMutex.withLock {
            val currentState = _sessionState.value
            val plan = currentState.plan ?: return

            _sessionState.update { it.copy(isExtendingQueue = true) }

            try {
                val userPrefs = userPreferencesRepository.userPreferencesFlow.first()
                val context = ListenerContextBuilder.build(
                    userPreferences = userPrefs,
                    musicRepository = recommendationEngine.musicRepository,
                    localTrackCount = recommendationEngine.localMusicProvider?.getTracks()?.size ?: 0
                )

                val candidates = recommendationEngine.queryPlanner.resolveDjCandidates(plan, resolutionMode)
                // Filter out tracks already scheduled in session to prevent repeats
                val freshCandidates = candidates.filterNot { playedTrackIdsInSession.contains(it.id) }

                val nextBatch = recommendationEngine.ranker.rankForDjSession(
                    candidates = freshCandidates.ifEmpty { candidates },
                    plan = plan.copy(
                        targetEnergy = currentState.currentEnergy,
                        discoveryRatio = currentState.discoveryRatio
                    ),
                    context = context,
                    feedback = sessionFeedback,
                    playedInSession = playedTrackIdsInSession,
                    batchSize = 6
                )

                if (nextBatch.isNotEmpty()) {
                    nextBatch.forEach { playedTrackIdsInSession.add(it.id) }
                    playbackConnection.addTracksToQueue(nextBatch)
                }
            } catch (_: Exception) {
                // Ignore transient errors; monitor will retry on next check
            } finally {
                _sessionState.update { it.copy(isExtendingQueue = false) }
            }
        }
    }

    /**
     * Real-time energy slider adjustment.
     */
    fun updateEnergy(newEnergy: Int) {
        val clamped = newEnergy.coerceIn(1, 100)
        sessionFeedback.energyAdjustment = (clamped - (_sessionState.value.plan?.targetEnergy ?: 50))
        _sessionState.update { it.copy(currentEnergy = clamped) }
    }

    /**
     * Real-time discovery slider adjustment (0.0 = familiar, 1.0 = discover).
     */
    fun updateDiscovery(newRatio: Float) {
        val clamped = newRatio.coerceIn(0.0f, 1.0f)
        sessionFeedback.discoveryAdjustment = (clamped - (_sessionState.value.plan?.discoveryRatio ?: 0.3f))
        _sessionState.update { it.copy(discoveryRatio = clamped) }
    }

    /**
     * Quick session tuning action from UI.
     */
    fun applyFeedback(action: DjFeedbackAction) {
        val currentTrack = playbackConnection.playbackState.value.currentTrack
        sessionFeedback.applyAction(action, currentTrack?.artist, currentTrack?.id)

        val notice = when (action) {
            DjFeedbackAction.MORE_LIKE_THIS -> "Tuned: More tracks like ${currentTrack?.artist ?: "this"}."
            DjFeedbackAction.LESS_LIKE_THIS -> {
                playbackConnection.skipNext()
                "Skipped: Less like ${currentTrack?.artist ?: "this"}."
            }
            DjFeedbackAction.MORE_ENERGY -> {
                val newE = (_sessionState.value.currentEnergy + 15).coerceIn(1, 100)
                _sessionState.update { it.copy(currentEnergy = newE) }
                "Energy elevated (+15)"
            }
            DjFeedbackAction.CHILL_DOWN -> {
                val newE = (_sessionState.value.currentEnergy - 15).coerceIn(1, 100)
                _sessionState.update { it.copy(currentEnergy = newE) }
                "Energy lowered (-15)"
            }
            DjFeedbackAction.SURPRISE_ME -> {
                val newD = (_sessionState.value.discoveryRatio + 0.35f).coerceIn(0.0f, 1.0f)
                _sessionState.update { it.copy(discoveryRatio = newD) }
                "Discovery radar expanded!"
            }
        }

        _sessionState.update { it.copy(lastFeedbackNotice = notice) }
    }

    /**
     * Ends the Cyber DJ session.
     * @param keepQueue If true, current queue continues playing normally; if false, player stops.
     */
    fun endSession(keepQueue: Boolean) {
        queueMonitorJob?.cancel()
        queueMonitorJob = null

        if (!keepQueue) {
            playbackConnection.stop()
            playbackConnection.clearQueue()
        }

        _sessionState.value = CyberDjSessionState(isActive = false)
    }

    /**
     * Saves the current active queue as a named user playlist.
     */
    fun saveCurrentQueueAsPlaylist(title: String? = null): Playlist {
        val activeQueue = playbackConnection.playbackState.value.queue
        val modeName = _sessionState.value.mode.displayName
        val finalTitle = title?.takeIf { it.isNotBlank() } ?: "Cyber DJ $modeName Session"

        val playlist = recommendationEngine.musicRepository.createPlaylist(
            title = finalTitle,
            description = "Captured from continuous Cyber DJ $modeName listening session."
        )

        activeQueue.forEach { track ->
            recommendationEngine.musicRepository.addTrackToPlaylist(playlist.id, track)
        }

        return playlist.copy(tracks = activeQueue, trackCount = activeQueue.size)
    }
}
