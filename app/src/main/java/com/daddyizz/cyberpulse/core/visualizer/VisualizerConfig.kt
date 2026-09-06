package com.daddyizz.cyberpulse.core.visualizer

/**
 * Performance settings and rendering preferences for CyberPulse visualizers.
 */
enum class PerformanceTier(val maxFps: Int, val bandCount: Int) {
    LOW(maxFps = 30, bandCount = 8),
    NORMAL(maxFps = 45, bandCount = 16),
    HIGH(maxFps = 60, bandCount = 32);

    companion object {
        fun fromName(name: String?): PerformanceTier {
            return entries.firstOrNull { it.name.equals(name, ignoreCase = true) } ?: NORMAL
        }
    }
}

data class VisualizerConfig(
    val tier: PerformanceTier = PerformanceTier.NORMAL,
    val isOledBlack: Boolean = false,
    val reduceAnimations: Boolean = false,
    val isBatterySaverActive: Boolean = false,
    val useArtworkColors: Boolean = true
) {
    /**
     * Resolves the effective rendering tier considering active battery saver settings.
     */
    val effectiveTier: PerformanceTier
        get() = if (isBatterySaverActive || reduceAnimations) PerformanceTier.LOW else tier
}
