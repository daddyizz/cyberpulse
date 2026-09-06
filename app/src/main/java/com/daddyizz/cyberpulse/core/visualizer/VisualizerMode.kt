package com.daddyizz.cyberpulse.core.visualizer

/**
 * CyberPulse visualizer modes.
 * Features 5 distinct original cyberpunk aesthetic modes.
 * Free tier includes Neon Wave.
 * Advanced modes are gated behind CyberPulse Pro.
 */
enum class VisualizerMode(
    val displayName: String,
    val isPro: Boolean,
    val description: String
) {
    NEON_WAVE(
        displayName = "Neon Wave",
        isPro = false,
        description = "High-voltage oscilloscope wave reacting to active waveform and bass frequencies."
    ),
    SPECTRUM_PULSE(
        displayName = "Spectrum Pulse",
        isPro = true,
        description = "Multi-band vertical cyberpunk equalizer bars pulsing with live spectral energy."
    ),
    CYBER_GRID(
        displayName = "Cyber Grid",
        isPro = true,
        description = "Perspective 3D synthwave wireframe grid undulating to track tempo."
    ),
    ORBITAL_PULSE(
        displayName = "Orbital Pulse",
        isPro = true,
        description = "Concentric radial rings and orbiting cyber nodes expanding on sub-bass transients."
    ),
    PARTICLE_FLOW(
        displayName = "Particle Flow",
        isPro = true,
        description = "Floating neon stardust and kinetic flux particles surging with dynamic intensity."
    );

    companion object {
        val FREE_MODES = entries.filter { !it.isPro }
        val PRO_MODES = entries.filter { it.isPro }

        fun fromName(name: String?): VisualizerMode {
            return entries.firstOrNull { it.name.equals(name, ignoreCase = true) } ?: NEON_WAVE
        }
    }
}
