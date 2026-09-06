package com.daddyizz.cyberpulse.core.visualizer

/**
 * Immutable UI state for the CyberPulse visualizer system.
 */
data class VisualizerState(
    val mode: VisualizerMode = VisualizerMode.NEON_WAVE,
    val isRealAudioAvailable: Boolean = false,
    val isProLocked: Boolean = false,
    val waveform: FloatArray = FloatArray(64),
    val fftBands: FloatArray = FloatArray(16),
    val energy: Float = 0f,
    val isCapturing: Boolean = false,
    val isBatterySaverActive: Boolean = false,
    val isReduceAnimationsActive: Boolean = false,
    val isAndroidAuto: Boolean = false,
    val captureDisabledReason: String? = null
) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as VisualizerState
        if (mode != other.mode) return false
        if (isRealAudioAvailable != other.isRealAudioAvailable) return false
        if (isProLocked != other.isProLocked) return false
        if (!waveform.contentEquals(other.waveform)) return false
        if (!fftBands.contentEquals(other.fftBands)) return false
        if (energy != other.energy) return false
        if (isCapturing != other.isCapturing) return false
        if (isBatterySaverActive != other.isBatterySaverActive) return false
        if (isReduceAnimationsActive != other.isReduceAnimationsActive) return false
        if (isAndroidAuto != other.isAndroidAuto) return false
        if (captureDisabledReason != other.captureDisabledReason) return false

        return true
    }

    override fun hashCode(): Int {
        var result = mode.hashCode()
        result = 31 * result + isRealAudioAvailable.hashCode()
        result = 31 * result + isProLocked.hashCode()
        result = 31 * result + waveform.contentHashCode()
        result = 31 * result + fftBands.contentHashCode()
        result = 31 * result + energy.hashCode()
        result = 31 * result + isCapturing.hashCode()
        result = 31 * result + isBatterySaverActive.hashCode()
        result = 31 * result + isReduceAnimationsActive.hashCode()
        result = 31 * result + isAndroidAuto.hashCode()
        result = 31 * result + (captureDisabledReason?.hashCode() ?: 0)
        return result
    }
}
