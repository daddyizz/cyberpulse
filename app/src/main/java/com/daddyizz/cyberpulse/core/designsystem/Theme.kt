package com.daddyizz.cyberpulse.core.designsystem

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color
import com.daddyizz.cyberpulse.core.common.Constants

data class CyberPulseColors(
    val background: Color,
    val surface: Color,
    val surfaceElevated: Color,
    val surfaceCard: Color,
    val border: Color,
    val primaryAccent: Color,
    val secondaryAccent: Color,
    val tertiaryAccent: Color,
    val successAccent: Color,
    val textPrimary: Color,
    val textSecondary: Color,
    val textMuted: Color
)

val LocalCyberPulseColors = staticCompositionLocalOf {
    CyberPulseColors(
        background = CyberBackgroundPrimary,
        surface = CyberSurfaceSecondary,
        surfaceElevated = CyberSurfaceElevated,
        surfaceCard = CyberSurfaceCard,
        border = CyberBorderSubtle,
        primaryAccent = CyberNeonCyan,
        secondaryAccent = CyberElectricPurple,
        tertiaryAccent = CyberPink,
        successAccent = CyberAcidGreen,
        textPrimary = CyberTextPrimary,
        textSecondary = CyberTextSecondary,
        textMuted = CyberTextMuted
    )
}

val CyberpunkDarkPalette = CyberPulseColors(
    background = CyberBackgroundPrimary,
    surface = CyberSurfaceSecondary,
    surfaceElevated = CyberSurfaceElevated,
    surfaceCard = CyberSurfaceCard,
    border = CyberBorderSubtle,
    primaryAccent = CyberNeonCyan,
    secondaryAccent = CyberElectricPurple,
    tertiaryAccent = CyberPink,
    successAccent = CyberAcidGreen,
    textPrimary = CyberTextPrimary,
    textSecondary = CyberTextSecondary,
    textMuted = CyberTextMuted
)

val OledBlackPalette = CyberPulseColors(
    background = CyberOledBackground,
    surface = CyberOledSurface,
    surfaceElevated = CyberOledElevated,
    surfaceCard = CyberSurfaceCard,
    border = CyberBorderSubtle,
    primaryAccent = CyberNeonCyan,
    secondaryAccent = CyberElectricPurple,
    tertiaryAccent = CyberPink,
    successAccent = CyberAcidGreen,
    textPrimary = CyberTextPrimary,
    textSecondary = CyberTextSecondary,
    textMuted = CyberTextMuted
)

/**
 * Block 7: CyberPulse Pro Exclusive Theme — Synthwave Pro.
 * Deep neon sunset violet palette, hot magenta accents, and retro golden amber glow.
 */
val SynthwaveProPalette = CyberPulseColors(
    background = Color(0xFF130924),
    surface = Color(0xFF1E1038),
    surfaceElevated = Color(0xFF2E1752),
    surfaceCard = Color(0xFF251345),
    border = Color(0xFFFF5E3A).copy(alpha = 0.35f),
    primaryAccent = Color(0xFFFF2ED1),
    secondaryAccent = Color(0xFFFF7B00),
    tertiaryAccent = Color(0xFF00F5FF),
    successAccent = Color(0xFF00FFB2),
    textPrimary = Color(0xFFFFF0F5),
    textSecondary = Color(0xFFD6BFE6),
    textMuted = Color(0xFF8E73A6)
)

@Composable
fun CyberPulseTheme(
    themeName: String = Constants.THEME_CYBERPUNK,
    content: @Composable () -> Unit
) {
    val cyberColors = when (themeName) {
        Constants.THEME_OLED_BLACK -> OledBlackPalette
        Constants.THEME_SYNTHWAVE_PRO -> SynthwaveProPalette
        else -> CyberpunkDarkPalette
    }

    val materialColorScheme = darkColorScheme(
        primary = cyberColors.primaryAccent,
        secondary = cyberColors.secondaryAccent,
        tertiary = cyberColors.tertiaryAccent,
        background = cyberColors.background,
        surface = cyberColors.surface,
        onPrimary = Color.Black,
        onSecondary = Color.White,
        onBackground = cyberColors.textPrimary,
        onSurface = cyberColors.textPrimary
    )

    CompositionLocalProvider(
        LocalCyberPulseColors provides cyberColors
    ) {
        MaterialTheme(
            colorScheme = materialColorScheme,
            typography = CyberTypography,
            content = content
        )
    }
}

object CyberPulseThemeDefaults {
    val colors: CyberPulseColors
        @Composable
        get() = LocalCyberPulseColors.current
}

typealias CyberColors = CyberPulseColors

val CyberPulseColors.backgroundSecondary: Color get() = surface
val CyberPulseColors.surfaceSecondary: Color get() = surface
val CyberPulseColors.borderHighlight: Color get() = border
