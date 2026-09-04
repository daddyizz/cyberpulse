package com.daddyizz.cyberpulse.feature.settings

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Check
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.daddyizz.cyberpulse.core.common.Constants
import com.daddyizz.cyberpulse.core.designsystem.*

@Composable
fun SettingsScreen(
    viewModel: SettingsViewModel,
    onBackClick: () -> Unit,
    onComingSoon: (String) -> Unit,
    onOpenPlaybackLab: () -> Unit = {},
    modifier: Modifier = Modifier
) {
    val prefs by viewModel.preferences.collectAsState()
    val colors = LocalCyberPulseColors.current

    Column(
        modifier = modifier
            .fillMaxSize()
            .statusBarsPadding()
    ) {
        CyberTopBar(
            title = "Settings",
            navigationIcon = {
                IconButton(onClick = onBackClick) {
                    Icon(
                        imageVector = Icons.Default.ArrowBack,
                        contentDescription = "Back",
                        tint = colors.textPrimary
                    )
                }
            }
        )

        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = CyberSpacing.screenHorizontal),
            contentPadding = PaddingValues(bottom = 60.dp)
        ) {
            // Section 1: Appearance
            item {
                CyberSectionHeader(title = "Appearance")
                Spacer(modifier = Modifier.height(CyberSpacing.xs))
                CyberCard(modifier = Modifier.fillMaxWidth()) {
                    Text(
                        text = "Visual Theme",
                        style = MaterialTheme.typography.titleMedium,
                        color = colors.textPrimary
                    )
                    Spacer(modifier = Modifier.height(CyberSpacing.sm))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(CyberSpacing.md)
                    ) {
                        // Cyberpunk option
                        ThemeSelectionCard(
                            title = "Cyberpunk",
                            subtitle = "#07090F Base",
                            isSelected = prefs.theme == Constants.THEME_CYBERPUNK,
                            previewColor = Color(0xFF07090F),
                            onClick = { viewModel.setTheme(Constants.THEME_CYBERPUNK) },
                            modifier = Modifier.weight(1f)
                        )
                        // OLED Black option
                        ThemeSelectionCard(
                            title = "OLED Black",
                            subtitle = "#000000 True Black",
                            isSelected = prefs.theme == Constants.THEME_OLED_BLACK,
                            previewColor = Color(0xFF000000),
                            onClick = { viewModel.setTheme(Constants.THEME_OLED_BLACK) },
                            modifier = Modifier.weight(1f)
                        )
                    }

                    Spacer(modifier = Modifier.height(CyberSpacing.md))

                    SettingsSwitchRow(
                        title = "Reduce Animations",
                        description = "Minimize motion effects for battery conservation or accessibility",
                        checked = prefs.reduceAnimations,
                        onCheckedChange = { viewModel.toggleReduceAnimations(it) }
                    )

                    Spacer(modifier = Modifier.height(CyberSpacing.sm))

                    SettingsSwitchRow(
                        title = "Dynamic Backgrounds",
                        description = "Render ambient cybernetic atmospheric gradients in headers",
                        checked = prefs.dynamicBackgrounds,
                        onCheckedChange = { viewModel.toggleDynamicBackgrounds(it) }
                    )
                }
                Spacer(modifier = Modifier.height(CyberSpacing.sectionSpacing))
            }

            // Section 2: Data Saver
            item {
                CyberSectionHeader(title = "Data Saver")
                CyberCard(modifier = Modifier.fillMaxWidth()) {
                    SettingsSwitchRow(
                        title = "Data Saver Mode",
                        description = "Compress preview metadata and limit background prefetching",
                        checked = prefs.dataSaver,
                        onCheckedChange = { viewModel.toggleDataSaver(it) }
                    )
                }
                Spacer(modifier = Modifier.height(CyberSpacing.sectionSpacing))
            }

            // Section 3: Privacy & Personalization
            item {
                CyberSectionHeader(title = "Privacy & Intelligence")
                CyberCard(modifier = Modifier.fillMaxWidth()) {
                    SettingsSwitchRow(
                        title = "Personalized Recommendations",
                        description = "Enable algorithmic taste tracking to tune discovery feeds",
                        checked = prefs.recommendationsEnabled,
                        onCheckedChange = { viewModel.toggleRecommendations(it) }
                    )
                }
                Spacer(modifier = Modifier.height(CyberSpacing.sectionSpacing))
            }

            // Section 4: Playback & Engine Diagnostics
            item {
                CyberSectionHeader(title = "Playback & Audio Engine")
                CyberCard(modifier = Modifier.fillMaxWidth()) {
                    SettingsNavigationRow(
                        title = "Playback Lab (Block 3A)",
                        subtitle = "AndroidX Media3 diagnostics & test catalog",
                        onClick = onOpenPlaybackLab
                    )
                    Spacer(modifier = Modifier.height(CyberSpacing.sm))
                    SettingsNavigationRow(
                        title = "Audio Engine Quality",
                        subtitle = "Lossless 320kbps (Configurable)",
                        onClick = { onComingSoon("Playback Audio Engine") }
                    )
                    Spacer(modifier = Modifier.height(CyberSpacing.sm))
                    SettingsNavigationRow(
                        title = "Equalizer & Spatial Pulse",
                        subtitle = "Hardware DSP tuner (Future Block)",
                        onClick = { onComingSoon("Spatial Equalizer") }
                    )
                }
                Spacer(modifier = Modifier.height(CyberSpacing.sectionSpacing))
            }

            // Section 5: About
            item {
                CyberSectionHeader(title = "About")
                CyberCard(modifier = Modifier.fillMaxWidth()) {
                    Text(
                        text = "CyberPulse Music",
                        style = MaterialTheme.typography.titleLarge,
                        color = colors.textPrimary
                    )
                    Text(
                        text = "Version 1.0.0-block1 • Build Block 1",
                        style = MaterialTheme.typography.bodyMedium,
                        color = colors.primaryAccent
                    )
                    Spacer(modifier = Modifier.height(CyberSpacing.xs))
                    Text(
                        text = "Package: com.daddyizz.cyberpulse\nArchitecture: Native Kotlin + Jetpack Compose + Material 3\nTarget: Android 14 (API 34) / Min SDK 24",
                        style = MaterialTheme.typography.labelMedium,
                        color = colors.textSecondary
                    )
                }
            }
        }
    }
}

@Composable
private fun ThemeSelectionCard(
    title: String,
    subtitle: String,
    isSelected: Boolean,
    previewColor: Color,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val colors = LocalCyberPulseColors.current
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(CyberRadius.md))
            .background(previewColor)
            .border(
                width = if (isSelected) 2.dp else 1.dp,
                color = if (isSelected) colors.primaryAccent else colors.border,
                shape = RoundedCornerShape(CyberRadius.md)
            )
            .clickable(onClick = onClick)
            .padding(CyberSpacing.md)
    ) {
        Column {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleMedium,
                    color = colors.textPrimary
                )
                if (isSelected) {
                    Icon(
                        imageVector = Icons.Default.Check,
                        contentDescription = "Selected",
                        tint = colors.primaryAccent,
                        modifier = Modifier.size(18.dp)
                    )
                }
            }
            Text(
                text = subtitle,
                style = MaterialTheme.typography.labelMedium,
                color = colors.textSecondary
            )
        }
    }
}

@Composable
private fun SettingsSwitchRow(
    title: String,
    description: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit
) {
    val colors = LocalCyberPulseColors.current
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = title,
                style = MaterialTheme.typography.titleMedium,
                color = colors.textPrimary
            )
            Text(
                text = description,
                style = MaterialTheme.typography.bodyMedium,
                color = colors.textSecondary
            )
        }
        Spacer(modifier = Modifier.width(CyberSpacing.md))
        Switch(
            checked = checked,
            onCheckedChange = onCheckedChange,
            colors = SwitchDefaults.colors(
                checkedThumbColor = Color(0xFF07090F),
                checkedTrackColor = colors.primaryAccent,
                uncheckedThumbColor = colors.textSecondary,
                uncheckedTrackColor = colors.surfaceSecondary
            )
        )
    }
}

@Composable
private fun SettingsNavigationRow(
    title: String,
    subtitle: String,
    onClick: () -> Unit
) {
    val colors = LocalCyberPulseColors.current
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(vertical = CyberSpacing.xs),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = title,
                style = MaterialTheme.typography.titleMedium,
                color = colors.textPrimary
            )
            Text(
                text = subtitle,
                style = MaterialTheme.typography.bodyMedium,
                color = colors.textSecondary
            )
        }
        Text(
            text = "Configure",
            style = MaterialTheme.typography.labelMedium,
            color = colors.primaryAccent
        )
    }
}
