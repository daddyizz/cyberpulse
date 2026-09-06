package com.daddyizz.cyberpulse.core.visualizer

import kotlin.math.abs
import kotlin.math.cos
import kotlin.math.sin
import kotlin.math.sqrt

/**
 * High-performance processor for audio visualization buffers.
 * Maintains fixed pre-allocated arrays to avoid garbage collection pressure in 60 FPS rendering.
 * Provides peak decay smoothing and ambient procedural synthesis for fallback modes.
 */
class AudioLevelProcessor(
    private val bandCount: Int = 16,
    private val waveformPoints: Int = 64
) {

    // Pre-allocated output arrays (reused every frame)
    val smoothedBands = FloatArray(bandCount)
    val smoothedWaveform = FloatArray(waveformPoints)
    var smoothedEnergy: Float = 0f
        private set

    // Decay parameters
    private val attackRate = 0.65f
    private val decayRate = 0.82f

    // Ambient procedural state
    private var ambientPhase = 0f

    /**
     * Ingests raw PCM waveform bytes (from Android Visualizer capture)
     * and updates the normalized smoothedWaveform.
     */
    fun processWaveform(rawWaveform: ByteArray?) {
        if (rawWaveform == null || rawWaveform.isEmpty()) {
            decayAll()
            return
        }

        val step = (rawWaveform.size / waveformPoints).coerceAtLeast(1)
        var sumSquares = 0f

        for (i in 0 until waveformPoints) {
            val rawIndex = (i * step).coerceIn(0, rawWaveform.size - 1)
            // Visualizer waveform byte is unsigned 0..255, center is 128
            val sample = (rawWaveform[rawIndex].toInt() and 0xFF) - 128
            val normalized = (sample / 128f).coerceIn(-1f, 1f)

            // Apply smoothing
            val current = smoothedWaveform[i]
            smoothedWaveform[i] = if (abs(normalized) > abs(current)) {
                current + (normalized - current) * attackRate
            } else {
                current * decayRate
            }

            sumSquares += normalized * normalized
        }

        val instantRms = sqrt(sumSquares / waveformPoints).coerceIn(0f, 1f)
        smoothedEnergy = smoothedEnergy + (instantRms - smoothedEnergy) * attackRate
    }

    /**
     * Ingests raw FFT bytes (from Android Visualizer capture)
     * and updates the normalized frequency bands.
     */
    fun processFft(rawFft: ByteArray?) {
        if (rawFft == null || rawFft.size < 4) {
            decayBands()
            return
        }

        // Android Visualizer FFT layout:
        // rawFft[0] = DC real, rawFft[1] = Nyquist real
        // rawFft[2k] = real, rawFft[2k+1] = imag
        val n = rawFft.size / 2
        val binSize = (n / bandCount).coerceAtLeast(1)

        for (b in 0 until bandCount) {
            var bandMagnitudeSum = 0f
            val start = (b * binSize).coerceIn(1, n - 1)
            val end = ((b + 1) * binSize).coerceIn(1, n - 1)

            for (k in start until end) {
                val real = rawFft[2 * k].toFloat()
                val imag = rawFft[2 * k + 1].toFloat()
                bandMagnitudeSum += sqrt(real * real + imag * imag)
            }

            val avgMagnitude = bandMagnitudeSum / (end - start).coerceAtLeast(1)
            val normalized = (avgMagnitude / 64f).coerceIn(0f, 1f)

            if (normalized > smoothedBands[b]) {
                smoothedBands[b] = smoothedBands[b] + (normalized - smoothedBands[b]) * attackRate
            } else {
                smoothedBands[b] = smoothedBands[b] * decayRate
            }
        }
    }

    /**
     * Generates smooth, organic cyberpunk pulsing waveforms and spectral bars
     * when real audio session capture is not available (e.g. ambient fallback,
     * permission missing, or YouTube embedded playback).
     */
    fun generateAmbientFrame(isPlaying: Boolean, tempoPulse: Float = 1.0f) {
        if (!isPlaying) {
            decayAll()
            return
        }

        ambientPhase += 0.05f * tempoPulse

        // Procedural energy pulse
        val basePulse = (sin(ambientPhase.toDouble()) * 0.35 + 0.55).toFloat()
        smoothedEnergy = smoothedEnergy + (basePulse - smoothedEnergy) * 0.2f

        // Procedural waveform: dual sine harmonic with phase displacement
        for (i in 0 until waveformPoints) {
            val x = (i.toFloat() / waveformPoints.toFloat()) * 2f * Math.PI.toFloat()
            val wave = (sin(x * 2f + ambientPhase) * 0.5f + cos(x * 4f - ambientPhase * 0.7f) * 0.3f) * smoothedEnergy
            smoothedWaveform[i] = wave.coerceIn(-1f, 1f)
        }

        // Procedural frequency bands: cyberpunk EQ curve with sub-bass emphasis
        for (b in 0 until bandCount) {
            val freqOffset = b.toFloat() * 0.35f
            val bandPulse = (sin(ambientPhase * 1.5f + freqOffset) * 0.4f + 0.6f).toFloat()
            // High frequencies roll off, bass boosted
            val eqCurve = (1.0f - (b.toFloat() / bandCount.toFloat()) * 0.45f)
            val target = (bandPulse * eqCurve * smoothedEnergy).coerceIn(0.08f, 1.0f)
            smoothedBands[b] = smoothedBands[b] + (target - smoothedBands[b]) * 0.25f
        }
    }

    private fun decayBands() {
        for (i in smoothedBands.indices) {
            smoothedBands[i] *= decayRate
        }
    }

    private fun decayAll() {
        decayBands()
        for (i in smoothedWaveform.indices) {
            smoothedWaveform[i] *= decayRate
        }
        smoothedEnergy *= decayRate
    }
}
