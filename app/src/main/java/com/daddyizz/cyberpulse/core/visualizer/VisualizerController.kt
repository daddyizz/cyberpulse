package com.daddyizz.cyberpulse.core.visualizer

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.media.audiofx.Visualizer
import androidx.core.content.ContextCompat
import com.daddyizz.cyberpulse.core.billing.EntitlementRepository
import com.daddyizz.cyberpulse.core.billing.PremiumFeature
import com.daddyizz.cyberpulse.core.model.MusicSource
import com.daddyizz.cyberpulse.core.model.Track
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

/**
 * Authoritative controller for CyberPulse audio visualization.
 * Coordinates native Android audiofx Visualizer with Media3 audio session,
 * enforces YouTube audio capture prohibitions, Android Auto suppression,
 * Free/Pro entitlement gates, and battery saver adaptations.
 */
class VisualizerController(
    private val context: Context,
    private val entitlementRepository: EntitlementRepository,
    private val scope: CoroutineScope = CoroutineScope(Dispatchers.Main + Job())
) {

    private val processor = AudioLevelProcessor(bandCount = 16, waveformPoints = 64)
    private var nativeVisualizer: Visualizer? = null
    private var tickerJob: Job? = null

    private var currentAudioSessionId: Int = 0
    private var currentTrack: Track? = null
    private var isPlaying: Boolean = false
    private var isAndroidAuto: Boolean = false

    private val _state = MutableStateFlow(VisualizerState())
    val state: StateFlow<VisualizerState> = _state.asStateFlow()

    private var config = VisualizerConfig()

    init {
        // Observe Pro entitlement to update lock status
        scope.launch {
            entitlementRepository.entitlementFlow.collect {
                updateProGate()
            }
        }
    }

    /**
     * Updates visualizer configuration (Battery Saver, Reduce Animations, Performance Tier).
     */
    fun updateConfig(newConfig: VisualizerConfig) {
        config = newConfig
        _state.update {
            it.copy(
                isBatterySaverActive = newConfig.isBatterySaverActive,
                isReduceAnimationsActive = newConfig.reduceAnimations
            )
        }
    }

    /**
     * Selects a visualizer mode, verifying Pro entitlement.
     */
    fun selectMode(mode: VisualizerMode) {
        val isPro = entitlementRepository.canUse(PremiumFeature.PREMIUM_VISUALIZER)
        val locked = mode.isPro && !isPro
        _state.update {
            it.copy(
                mode = mode,
                isProLocked = locked
            )
        }
    }

    private fun updateProGate() {
        val isPro = entitlementRepository.canUse(PremiumFeature.PREMIUM_VISUALIZER)
        val currentMode = _state.value.mode
        val locked = currentMode.isPro && !isPro
        _state.update { it.copy(isProLocked = locked) }
    }

    /**
     * Updates the current track and audio playback session.
     * Enforces source-specific restrictions (YouTube capture prohibited).
     */
    fun onPlaybackTrackChanged(track: Track?, audioSessionId: Int) {
        currentTrack = track
        currentAudioSessionId = audioSessionId

        // Critical YouTube rule: Real audio capture is STRICTLY PROHIBITED
        if (track?.source == MusicSource.YOUTUBE) {
            releaseNativeVisualizer()
            _state.update {
                it.copy(
                    isRealAudioAvailable = false,
                    isCapturing = false,
                    captureDisabledReason = "YouTube embedded playback does not permit audio stream capture."
                )
            }
            return
        }

        _state.update { it.copy(captureDisabledReason = null) }

        if (isPlaying && !isAndroidAuto) {
            setupNativeVisualizer(audioSessionId)
        }
    }

    /**
     * Updates playback playing status.
     */
    fun onIsPlayingChanged(playing: Boolean) {
        isPlaying = playing
        if (playing && !isAndroidAuto && currentTrack?.source != MusicSource.YOUTUBE) {
            setupNativeVisualizer(currentAudioSessionId)
            startTicker()
        } else if (!playing) {
            stopTicker()
            releaseNativeVisualizer()
            _state.update {
                it.copy(
                    isCapturing = false,
                    energy = 0f
                )
            }
        }
    }

    /**
     * Sets whether current surface is Android Auto.
     * When Android Auto is connected, visualizer is completely disabled to prevent driver distraction.
     */
    fun setAndroidAuto(active: Boolean) {
        isAndroidAuto = active
        _state.update { it.copy(isAndroidAuto = active) }
        if (active) {
            releaseNativeVisualizer()
            stopTicker()
        } else if (isPlaying) {
            onIsPlayingChanged(true)
        }
    }

    private fun hasRecordAudioPermission(): Boolean {
        return ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.RECORD_AUDIO
        ) == PackageManager.PERMISSION_GRANTED
    }

    private fun setupNativeVisualizer(audioSessionId: Int) {
        // Enforce restrictions
        if (isAndroidAuto) return
        if (currentTrack?.source == MusicSource.YOUTUBE) return

        if (!hasRecordAudioPermission() || audioSessionId <= 0) {
            // Safe fallback to Ambient Mode
            releaseNativeVisualizer()
            _state.update { it.copy(isRealAudioAvailable = false, isCapturing = false) }
            return
        }

        try {
            if (nativeVisualizer != null) {
                releaseNativeVisualizer()
            }

            val vis = Visualizer(audioSessionId)
            val range = Visualizer.getCaptureSizeRange()
            vis.captureSize = range[1].coerceAtMost(256) // efficient buffer
            vis.setDataCaptureListener(
                object : Visualizer.OnDataCaptureListener {
                    override fun onWaveFormDataCapture(visualizer: Visualizer?, waveform: ByteArray?, samplingRate: Int) {
                        processor.processWaveform(waveform)
                    }

                    override fun onFftDataCapture(visualizer: Visualizer?, fft: ByteArray?, samplingRate: Int) {
                        processor.processFft(fft)
                    }
                },
                Visualizer.getMaxCaptureRate() / 2, // smooth frame rate
                true,
                true
            )
            vis.enabled = true
            nativeVisualizer = vis

            _state.update { it.copy(isRealAudioAvailable = true, isCapturing = true) }
        } catch (_: Exception) {
            // Android platform audio effect failure or device restriction -> fallback to ambient
            releaseNativeVisualizer()
            _state.update { it.copy(isRealAudioAvailable = false, isCapturing = false) }
        }
    }

    private fun startTicker() {
        if (tickerJob?.isActive == true) return

        val frameIntervalMs = when (config.effectiveTier) {
            PerformanceTier.LOW -> 33L // ~30 FPS
            PerformanceTier.NORMAL -> 22L // ~45 FPS
            PerformanceTier.HIGH -> 16L // ~60 FPS
        }

        tickerJob = scope.launch {
            while (isActive) {
                if (isAndroidAuto) {
                    delay(500)
                    continue
                }

                if (!_state.value.isRealAudioAvailable || currentTrack?.source == MusicSource.YOUTUBE) {
                    // Generate smooth procedural ambient frame
                    processor.generateAmbientFrame(isPlaying)
                }

                _state.update {
                    it.copy(
                        waveform = processor.smoothedWaveform.copyOf(),
                        fftBands = processor.smoothedBands.copyOf(),
                        energy = processor.smoothedEnergy
                    )
                }

                delay(frameIntervalMs)
            }
        }
    }

    private fun stopTicker() {
        tickerJob?.cancel()
        tickerJob = null
    }

    /**
     * Cleanly releases native Visualizer to prevent audio daemon leaks.
     */
    fun releaseNativeVisualizer() {
        try {
            nativeVisualizer?.apply {
                enabled = false
                release()
            }
        } catch (_: Exception) {
            // Ignore release exceptions
        } finally {
            nativeVisualizer = null
        }
    }

    fun onDestroy() {
        stopTicker()
        releaseNativeVisualizer()
    }
}
