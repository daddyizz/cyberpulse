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

@Composable
fun CyberPulseTheme(
    themeName: String = Constants.THEME_CYBERPUNK,
    content: @Composable () -> Unit
) {
    val cyberColors = if (themeName == Constants.THEME_OLED_BLACK) {
        OledBlackPalette
    } else {
        CyberpunkDarkPalette
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
