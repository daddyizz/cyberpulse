package com.daddyizz.cyberpulse.feature.settings

import android.app.Activity
import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.daddyizz.cyberpulse.CyberPulseApplication
import com.daddyizz.cyberpulse.core.billing.RestoreResult
import com.daddyizz.cyberpulse.core.common.Constants
import com.daddyizz.cyberpulse.core.designsystem.*
import kotlinx.coroutines.launch

@Composable
fun SettingsScreen(
    viewModel: SettingsViewModel,
    onBackClick: () -> Unit,
    onComingSoon: (String) -> Unit,
    onOpenPlaybackLab: () -> Unit = {},
    onNavigateToPro: () -> Unit = {},
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val activity = context as? Activity
    val prefs by viewModel.preferences.collectAsState()
    val colors = LocalCyberPulseColors.current
    val coroutineScope = rememberCoroutineScope()
    val snackbarHostState = remember { SnackbarHostState() }

    val app = remember { CyberPulseApplication.instance }
    val isPro by app.entitlementRepository.isPro.collectAsState()
    val isPrivacyOptionsRequired by app.consentManager.isPrivacyOptionsRequired.collectAsState()

    var isRestoring by remember { mutableStateOf(false) }
    var showStorageDialog by remember { mutableStateOf(false) }
    var showPrivacyDialog by remember { mutableStateOf(false) }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        containerColor = Color.Transparent,
        modifier = modifier.fillMaxSize()
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
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
                // CyberPulse Pro Upsell / Membership Card
                item {
                    Spacer(modifier = Modifier.height(CyberSpacing.sm))
                    Surface(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(CyberRadius.md))
                            .clickable(onClick = onNavigateToPro)
                            .border(
                                width = 1.dp,
                                brush = Brush.horizontalGradient(
                                    listOf(colors.primaryAccent, colors.secondaryAccent)
                                ),
                                shape = RoundedCornerShape(CyberRadius.md)
                            ),
                        color = colors.surfaceElevated
                    ) {
                        Row(
                            modifier = Modifier.padding(16.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(44.dp)
                                    .clip(CircleShape)
                                    .background(
                                        Brush.linearGradient(
                                            listOf(colors.primaryAccent, colors.secondaryAccent)
                                        )
                                    ),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Bolt,
                                    contentDescription = null,
                                    tint = Color.Black,
                                    modifier = Modifier.size(24.dp)
                                )
                            }
                            Spacer(modifier = Modifier.width(12.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text(
                                        text = "CyberPulse Pro",
                                        style = MaterialTheme.typography.titleMedium,
                                        fontWeight = FontWeight.Bold,
                                        color = colors.textPrimary
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Surface(
                                        color = if (isPro) colors.successAccent.copy(alpha = 0.2f) else colors.primaryAccent.copy(alpha = 0.2f),
                                        shape = RoundedCornerShape(CyberRadius.xs)
                                    ) {
                                        Text(
                                            text = if (isPro) "ACTIVE" else "UPGRADE",
                                            color = if (isPro) colors.successAccent else colors.primaryAccent,
                                            fontSize = 10.sp,
                                            fontWeight = FontWeight.Bold,
                                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                        )
                                    }
                                }
                                Text(
                                    text = if (isPro) "Pro active • No CyberPulse ads • Synthwave Pro unlocked" else "Zero CyberPulse ads, exclusive themes & priority features",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = colors.textSecondary
                                )
                            }
                            Icon(
                                imageVector = Icons.Default.ChevronRight,
                                contentDescription = "Open Pro",
                                tint = colors.textMuted
                            )
                        }
                    }
                    Spacer(modifier = Modifier.height(CyberSpacing.md))
                }

                // Section 1: Appearance & Themes
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

                        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
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

                            // Synthwave Pro Exclusive Theme Card
                            ThemeSelectionCard(
                                title = "Synthwave Pro",
                                subtitle = "Sunset Violet & Neon Amber (PRO)",
                                isSelected = prefs.theme == Constants.THEME_SYNTHWAVE_PRO,
                                previewColor = Color(0xFF130924),
                                isProLocked = !isPro,
                                onClick = {
                                    if (isPro) {
                                        viewModel.setTheme(Constants.THEME_SYNTHWAVE_PRO)
                                    } else {
                                        onNavigateToPro()
                                    }
                                },
                                modifier = Modifier.fillMaxWidth()
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
                }

                // Section 2: Subscription & Privacy Controls
                item {
                    Spacer(modifier = Modifier.height(CyberSpacing.md))
                    CyberSectionHeader(title = "Subscription & Privacy")
                    Spacer(modifier = Modifier.height(CyberSpacing.xs))
                    CyberCard(modifier = Modifier.fillMaxWidth()) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable(onClick = onNavigateToPro)
                                .padding(vertical = 4.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(
                                    text = "Membership Status",
                                    style = MaterialTheme.typography.titleMedium,
                                    color = colors.textPrimary
                                )
                                Text(
                                    text = if (isPro) "CyberPulse Pro (Active)" else "CyberPulse Free",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = if (isPro) colors.primaryAccent else colors.textSecondary
                                )
                            }
                            Text(
                                text = if (isPro) "Manage" else "Upgrade",
                                color = colors.primaryAccent,
                                fontWeight = FontWeight.Bold,
                                style = MaterialTheme.typography.labelLarge
                            )
                        }

                        HorizontalDivider(
                            modifier = Modifier.padding(vertical = CyberSpacing.sm),
                            color = colors.border.copy(alpha = 0.5f)
                        )

                        // Restore Purchases
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable {
                                    if (!isRestoring) {
                                        isRestoring = true
                                        coroutineScope.launch {
                                            val result = app.entitlementRepository.restorePurchases()
                                            isRestoring = false
                                            val message = when (result) {
                                                is RestoreResult.Restored -> "Purchases restored! CyberPulse Pro is active."
                                                is RestoreResult.NoPurchasesFound -> "No active CyberPulse Pro purchase found."
                                                is RestoreResult.Error -> "Restore failed: ${result.message}"
                                            }
                                            snackbarHostState.showSnackbar(message)
                                        }
                                    }
                                }
                                .padding(vertical = 4.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(
                                    text = "Restore Purchases",
                                    style = MaterialTheme.typography.titleMedium,
                                    color = colors.textPrimary
                                )
                                Text(
                                    text = "Sync Google Play purchases to this device",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = colors.textSecondary
                                )
                            }
                            Icon(Icons.Default.Refresh, contentDescription = null, tint = colors.primaryAccent)
                        }

                        // Privacy Choices (Google UMP)
                        if (activity != null) {
                            HorizontalDivider(
                                modifier = Modifier.padding(vertical = CyberSpacing.sm),
                                color = colors.border.copy(alpha = 0.5f)
                            )
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable {
                                        app.consentManager.showPrivacyOptionsForm(activity)
                                    }
                                    .padding(vertical = 4.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column {
                                    Text(
                                        text = "Privacy Choices",
                                        style = MaterialTheme.typography.titleMedium,
                                        color = colors.textPrimary
                                    )
                                    Text(
                                        text = "Review and update advertising consent settings",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = colors.textSecondary
                                    )
                                }
                                Icon(Icons.Default.Shield, contentDescription = null, tint = colors.primaryAccent)
                            }
                        }

                        // Informational YouTube disclosure
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "Note: CyberPulse Pro removes CyberPulse ads only; embedded YouTube streams manage their own standard playback rules.",
                            style = MaterialTheme.typography.bodySmall,
                            color = colors.textMuted,
                            lineHeight = 15.sp
                        )
                    }
                }    Spacer(modifier = Modifier.height(CyberSpacing.sectionSpacing))
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

            // Section 3: AI Privacy & Personalization Controls
            item {
                CyberSectionHeader(title = "AI Discovery & Privacy")
                CyberCard(modifier = Modifier.fillMaxWidth()) {
                    SettingsSwitchRow(
                        title = "Personalized AI Taste Engine",
                        description = "Allow Cyber DJ and AI Playlists to consult your listening history and likes",
                        checked = prefs.personalizedAiEnabled,
                        onCheckedChange = { viewModel.togglePersonalizedAi(it) }
                    )

                    HorizontalDivider(
                        modifier = Modifier.padding(vertical = CyberSpacing.sm),
                        color = colors.border.copy(alpha = 0.5f)
                    )

                    SettingsSwitchRow(
                        title = "Keep Listening History",
                        description = "Store playback logs locally to improve future session recommendations",
                        checked = prefs.keepListeningHistory,
                        onCheckedChange = { viewModel.toggleKeepListeningHistory(it) }
                    )

                    HorizontalDivider(
                        modifier = Modifier.padding(vertical = CyberSpacing.sm),
                        color = colors.border.copy(alpha = 0.5f)
                    )

                    SettingsSwitchRow(
                        title = "Allow Explicit Content",
                        description = "Permit tracks with explicit lyrics in AI and DJ discovery queues",
                        checked = prefs.allowExplicitContent,
                        onCheckedChange = { viewModel.toggleAllowExplicit(it) }
                    )

                    HorizontalDivider(
                        modifier = Modifier.padding(vertical = CyberSpacing.sm),
                        color = colors.border.copy(alpha = 0.5f)
                    )

                    // Clear AI Cache & Session History
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable {
                                viewModel.resetAiEngine()
                                coroutineScope.launch {
                                    snackbarHostState.showSnackbar("AI Session cache and generated history cleared.")
                                }
                            }
                            .padding(vertical = 4.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = "Clear AI Generation Cache",
                                style = MaterialTheme.typography.titleMedium,
                                color = colors.textPrimary
                            )
                            Text(
                                text = "Delete recent AI playlists and reset live session feedback",
                                style = MaterialTheme.typography.bodySmall,
                                color = colors.textSecondary
                            )
                        }
                        Icon(Icons.Default.DeleteOutline, contentDescription = null, tint = colors.textSecondary)
                    }

                    Spacer(modifier = Modifier.height(CyberSpacing.sm))

                    // Zero-Knowledge Privacy Badge / Notice
                    Text(
                        text = "🔒 Privacy Shield: When Personalized AI is OFF, CyberPulse generates queues using zero-history acoustic prompts only. No listening logs are ever transmitted.",
                        style = MaterialTheme.typography.bodySmall,
                        color = colors.textMuted,
                        lineHeight = 15.sp
                    )
                }
                Spacer(modifier = Modifier.height(CyberSpacing.sectionSpacing))
            }

            // Section 4: Playback & Engine Diagnostics
            item {
                CyberSectionHeader(title = "Playback & Audio Engine")
                CyberCard(modifier = Modifier.fillMaxWidth()) {
                    if (com.daddyizz.cyberpulse.BuildConfig.DEBUG) {
                        SettingsNavigationRow(
                            title = "Playback Lab (Diagnostics)",
                            subtitle = "AndroidX Media3 diagnostics & test catalog (Debug Only)",
                            onClick = onOpenPlaybackLab
                        )
                        Spacer(modifier = Modifier.height(CyberSpacing.sm))
                    }
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

            // Section 5: Storage & Cache (Block 10)
            item {
                CyberSectionHeader(title = "Storage & Cache")
                CyberCard(modifier = Modifier.fillMaxWidth()) {
                    SettingsNavigationRow(
                        title = "Storage Management",
                        subtitle = "Inspect artwork, lyrics, metadata cache & free up disk space",
                        onClick = { showStorageDialog = true }
                    )
                }
                Spacer(modifier = Modifier.height(CyberSpacing.sectionSpacing))
            }

            // Section 6: Privacy & Legal (Block 10)
            item {
                CyberSectionHeader(title = "Privacy & Legal Policies")
                CyberCard(modifier = Modifier.fillMaxWidth()) {
                    SettingsNavigationRow(
                        title = "Privacy Policy & Terms",
                        subtitle = "Data safety disclosures, API attributions, data deletion portal",
                        onClick = { showPrivacyDialog = true }
                    )
                }
                Spacer(modifier = Modifier.height(CyberSpacing.sectionSpacing))
            }

            // Section 7: About
            item {
                CyberSectionHeader(title = "About")
                CyberCard(modifier = Modifier.fillMaxWidth()) {
                    Text(
                        text = "CyberPulse Music",
                        style = MaterialTheme.typography.titleLarge,
                        color = colors.textPrimary
                    )
                    Text(
                        text = "Version 1.0.0 (Release Build 10)",
                        style = MaterialTheme.typography.bodyMedium,
                        color = colors.primaryAccent
                    )
                    Spacer(modifier = Modifier.height(CyberSpacing.xs))
                    Text(
                        text = "Package: com.daddyizz.cyberpulse\nArchitecture: Native Kotlin + Jetpack Compose + Material 3\nTarget: Android 14 (API 34) / Min SDK 24\nSecurity: Strict HTTPS, ProGuard Hardening, Zero-Knowledge Guest Mode",
                        style = MaterialTheme.typography.labelMedium,
                        color = colors.textSecondary
                    )
                }
            }
        }
    }

    if (showStorageDialog) {
        StorageCacheDialog(onDismiss = { showStorageDialog = false })
    }

    if (showPrivacyDialog) {
        PrivacyLegalDialog(onDismiss = { showPrivacyDialog = false })
    }
}

@Composable
private fun ThemeSelectionCard(
    title: String,
    subtitle: String,
    isSelected: Boolean,
    previewColor: Color,
    onClick: () -> Unit,
    isProLocked: Boolean = false,
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
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = title,
                        style = MaterialTheme.typography.titleMedium,
                        color = colors.textPrimary
                    )
                    if (isProLocked) {
                        Spacer(modifier = Modifier.width(6.dp))
                        Surface(
                            color = colors.primaryAccent.copy(alpha = 0.2f),
                            shape = RoundedCornerShape(CyberRadius.xs)
                        ) {
                            Text(
                                text = "PRO",
                                color = colors.primaryAccent,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp)
                            )
                        }
                    }
                }
                if (isSelected) {
                    Icon(
                        imageVector = Icons.Default.Check,
                        contentDescription = "Selected",
                        tint = colors.primaryAccent,
                        modifier = Modifier.size(18.dp)
                    )
                } else if (isProLocked) {
                    Icon(
                        imageVector = Icons.Default.Lock,
                        contentDescription = "Pro Required",
                        tint = colors.textMuted,
                        modifier = Modifier.size(16.dp)
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
