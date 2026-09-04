package com.daddyizz.cyberpulse.feature.onboarding

import android.Manifest
import android.os.Build
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.daddyizz.cyberpulse.core.designsystem.*

@Composable
fun OnboardingScreen(
    viewModel: OnboardingViewModel,
    onComplete: () -> Unit,
    modifier: Modifier = Modifier
) {
    val uiState by viewModel.uiState.collectAsState()
    val colors = LocalCyberPulseColors.current

    // Android 13+ Notification Permission Launcher
    val notificationPermissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        viewModel.setNotificationChoice(isGranted)
    }

    CyberPulseBackground(modifier = modifier) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .statusBarsPadding()
                .navigationBarsPadding()
                .padding(CyberSpacing.screenHorizontal),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Top Progress Bar indicator (steps 1 to 6)
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = CyberSpacing.md),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                for (step in 1..6) {
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .height(4.dp)
                            .clip(RoundedCornerShape(2.dp))
                            .background(
                                if (step <= uiState.currentStep) colors.primaryAccent else colors.border
                            )
                    )
                }
            }

            Spacer(modifier = Modifier.height(CyberSpacing.md))

            // Step Content
            AnimatedContent(
                targetState = uiState.currentStep,
                transitionSpec = {
                    if (targetState > initialState) {
                        slideInHorizontally { width -> width } + fadeIn() togetherWith
                                slideOutHorizontally { width -> -width } + fadeOut()
                    } else {
                        slideInHorizontally { width -> -width } + fadeIn() togetherWith
                                slideOutHorizontally { width -> width } + fadeOut()
                    }
                },
                modifier = Modifier.weight(1f),
                label = "OnboardingStepAnimation"
            ) { step ->
                when (step) {
                    1 -> Step1Welcome(onNext = { viewModel.nextStep() })
                    2 -> Step2Genres(
                        genres = viewModel.availableGenres,
                        selected = uiState.selectedGenres,
                        onToggle = { viewModel.toggleGenre(it) },
                        onContinue = { viewModel.nextStep() },
                        onSkip = { viewModel.nextStep() }
                    )
                    3 -> Step3Artists(
                        artists = viewModel.availableArtists,
                        selected = uiState.selectedArtists,
                        onToggle = { viewModel.toggleArtist(it) },
                        onContinue = { viewModel.nextStep() },
                        onSkip = { viewModel.nextStep() }
                    )
                    4 -> Step4Personalization(
                        enabled = uiState.personalizedRecommendations,
                        onToggle = { viewModel.togglePersonalization(it) },
                        onContinue = { viewModel.nextStep() }
                    )
                    5 -> Step5Notifications(
                        onRequestPermission = {
                            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                                notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
                            } else {
                                viewModel.setNotificationChoice(true)
                            }
                        },
                        onSkip = { viewModel.setNotificationChoice(false) }
                    )
                    6 -> Step6Ready(
                        onEnter = { viewModel.completeOnboarding(onComplete) }
                    )
                }
            }
        }
    }
}

@Composable
private fun Step1Welcome(onNext: () -> Unit) {
    val colors = LocalCyberPulseColors.current
    Column(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.SpaceBetween
    ) {
        Spacer(modifier = Modifier.weight(0.2f))

        // CyberPulse glowing emblem
        Box(
            modifier = Modifier
                .size(110.dp)
                .clip(RoundedCornerShape(CyberRadius.xl))
                .background(Brush.radialGradient(listOf(colors.secondaryAccent.copy(alpha = 0.3f), colors.surfaceSecondary)))
                .border(2.dp, colors.primaryAccent, RoundedCornerShape(CyberRadius.xl)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Default.GraphicEq,
                contentDescription = "CyberPulse Pulse Logo",
                tint = colors.primaryAccent,
                modifier = Modifier.size(54.dp)
            )
        }

        Spacer(modifier = Modifier.height(CyberSpacing.xxl))

        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                text = "Your Music. Your Universe.",
                style = MaterialTheme.typography.displayLarge,
                textAlign = TextAlign.Center,
                color = colors.textPrimary
            )
            Spacer(modifier = Modifier.height(CyberSpacing.md))
            Text(
                text = "“Discover, organize and experience music in a whole new way.”",
                style = MaterialTheme.typography.bodyLarge,
                textAlign = TextAlign.Center,
                color = colors.textSecondary,
                modifier = Modifier.padding(horizontal = CyberSpacing.lg)
            )
        }

        Spacer(modifier = Modifier.weight(0.8f))

        CyberPrimaryButton(
            text = "Get Started",
            onClick = onNext,
            icon = Icons.Default.ArrowForward
        )
        Spacer(modifier = Modifier.height(CyberSpacing.lg))
    }
}

@Composable
private fun Step2Genres(
    genres: List<String>,
    selected: Set<String>,
    onToggle: (String) -> Unit,
    onContinue: () -> Unit,
    onSkip: () -> Unit
) {
    val colors = LocalCyberPulseColors.current
    Column(modifier = Modifier.fillMaxSize()) {
        Text(
            text = "What moves you?",
            style = MaterialTheme.typography.displayLarge,
            color = colors.textPrimary
        )
        Spacer(modifier = Modifier.height(CyberSpacing.xs))
        Text(
            text = "Select genres you vibe with. You can change this anytime.",
            style = MaterialTheme.typography.bodyMedium,
            color = colors.textSecondary
        )
        Spacer(modifier = Modifier.height(CyberSpacing.lg))

        LazyVerticalGrid(
            columns = GridCells.Adaptive(minSize = 100.dp),
            modifier = Modifier.weight(1f),
            horizontalArrangement = Arrangement.spacedBy(CyberSpacing.sm),
            verticalArrangement = Arrangement.spacedBy(CyberSpacing.sm)
        ) {
            items(genres) { genre ->
                CyberChip(
                    text = genre,
                    isSelected = selected.contains(genre),
                    onToggle = { onToggle(genre) }
                )
            }
        }

        Spacer(modifier = Modifier.height(CyberSpacing.md))
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(CyberSpacing.md)
        ) {
            CyberSecondaryButton(
                text = "Skip",
                onClick = onSkip,
                modifier = Modifier.weight(1f)
            )
            CyberPrimaryButton(
                text = "Continue (${selected.size})",
                onClick = onContinue,
                modifier = Modifier.weight(2f)
            )
        }
        Spacer(modifier = Modifier.height(CyberSpacing.lg))
    }
}

@Composable
private fun Step3Artists(
    artists: List<com.daddyizz.cyberpulse.core.model.Artist>,
    selected: Set<String>,
    onToggle: (String) -> Unit,
    onContinue: () -> Unit,
    onSkip: () -> Unit
) {
    val colors = LocalCyberPulseColors.current
    Column(modifier = Modifier.fillMaxSize()) {
        Text(
            text = "Favorite Artists",
            style = MaterialTheme.typography.displayLarge,
            color = colors.textPrimary
        )
        Spacer(modifier = Modifier.height(CyberSpacing.xs))
        Text(
            text = "Choose sonic architects to calibrate your personal frequency.",
            style = MaterialTheme.typography.bodyMedium,
            color = colors.textSecondary
        )
        Spacer(modifier = Modifier.height(CyberSpacing.lg))

        LazyVerticalGrid(
            columns = GridCells.Fixed(2),
            modifier = Modifier.weight(1f),
            horizontalArrangement = Arrangement.spacedBy(CyberSpacing.md),
            verticalArrangement = Arrangement.spacedBy(CyberSpacing.md)
        ) {
            items(artists) { artist ->
                val isSelected = selected.contains(artist.id)
                CyberCard(
                    modifier = Modifier.fillMaxWidth(),
                    onClick = { onToggle(artist.id) },
                    borderColor = if (isSelected) colors.primaryAccent else colors.border,
                    backgroundColor = if (isSelected) colors.primaryAccent.copy(alpha = 0.08f) else colors.surfaceCard
                ) {
                    Box(
                        modifier = Modifier
                            .size(72.dp)
                            .align(Alignment.CenterHorizontally)
                            .clip(CircleShape)
                            .border(1.5.dp, if (isSelected) colors.primaryAccent else colors.border, CircleShape)
                            .background(Brush.sweepGradient(listOf(colors.surfaceElevated, colors.secondaryAccent, colors.primaryAccent))),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Person,
                            contentDescription = artist.name,
                            tint = colors.textPrimary
                        )
                    }
                    Spacer(modifier = Modifier.height(CyberSpacing.sm))
                    Text(
                        text = artist.name,
                        style = MaterialTheme.typography.titleMedium,
                        color = colors.textPrimary,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.fillMaxWidth()
                    )
                    Text(
                        text = artist.genres.joinToString(" • "),
                        style = MaterialTheme.typography.labelMedium,
                        color = colors.textSecondary,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(CyberSpacing.md))
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(CyberSpacing.md)
        ) {
            CyberSecondaryButton(
                text = "Skip",
                onClick = onSkip,
                modifier = Modifier.weight(1f)
            )
            CyberPrimaryButton(
                text = "Continue (${selected.size})",
                onClick = onContinue,
                modifier = Modifier.weight(2f)
            )
        }
        Spacer(modifier = Modifier.height(CyberSpacing.lg))
    }
}

@Composable
private fun Step4Personalization(
    enabled: Boolean,
    onToggle: (Boolean) -> Unit,
    onContinue: () -> Unit
) {
    val colors = LocalCyberPulseColors.current
    Column(
        modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.SpaceBetween
    ) {
        Column {
            Text(
                text = "Personalization",
                style = MaterialTheme.typography.displayLarge,
                color = colors.textPrimary
            )
            Spacer(modifier = Modifier.height(CyberSpacing.sm))
            Text(
                text = "“CyberPulse will use your listening activity to improve recommendations.”",
                style = MaterialTheme.typography.bodyLarge,
                color = colors.textSecondary
            )
            Spacer(modifier = Modifier.height(CyberSpacing.xl))

            CyberCard(modifier = Modifier.fillMaxWidth()) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "Personalized Recommendations",
                            style = MaterialTheme.typography.titleMedium,
                            color = colors.textPrimary
                        )
                        Text(
                            text = "Enable dynamic queue tuning and audio mixes based on your temporal habits.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = colors.textSecondary
                        )
                    }
                    Switch(
                        checked = enabled,
                        onCheckedChange = onToggle,
                        colors = SwitchDefaults.colors(
                            checkedThumbColor = Color(0xFF07090F),
                            checkedTrackColor = colors.primaryAccent,
                            uncheckedThumbColor = colors.textSecondary,
                            uncheckedTrackColor = colors.surfaceSecondary
                        )
                    )
                }
            }
        }

        CyberPrimaryButton(
            text = "Continue",
            onClick = onContinue
        )
    }
}

@Composable
private fun Step5Notifications(
    onRequestPermission: () -> Unit,
    onSkip: () -> Unit
) {
    val colors = LocalCyberPulseColors.current
    Column(
        modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.SpaceBetween,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Spacer(modifier = Modifier.height(CyberSpacing.xl))
            Box(
                modifier = Modifier
                    .size(80.dp)
                    .clip(CircleShape)
                    .background(colors.surfaceElevated)
                    .border(1.dp, colors.secondaryAccent, CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.NotificationsActive,
                    contentDescription = "Notifications",
                    tint = colors.secondaryAccent,
                    modifier = Modifier.size(36.dp)
                )
            }
            Spacer(modifier = Modifier.height(CyberSpacing.xl))
            Text(
                text = "Stay in the Loop",
                style = MaterialTheme.typography.displayLarge,
                color = colors.textPrimary,
                textAlign = TextAlign.Center
            )
            Spacer(modifier = Modifier.height(CyberSpacing.sm))
            Text(
                text = "“Get updates about new music and playlists.”",
                style = MaterialTheme.typography.bodyLarge,
                color = colors.textSecondary,
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(horizontal = CyberSpacing.lg)
            )
        }

        Column(modifier = Modifier.fillMaxWidth()) {
            CyberPrimaryButton(
                text = "Enable Notifications",
                onClick = onRequestPermission,
                icon = Icons.Default.Notifications
            )
            Spacer(modifier = Modifier.height(CyberSpacing.sm))
            CyberSecondaryButton(
                text = "Not Now",
                onClick = onSkip
            )
            Spacer(modifier = Modifier.height(CyberSpacing.lg))
        }
    }
}

@Composable
private fun Step6Ready(onEnter: () -> Unit) {
    val colors = LocalCyberPulseColors.current
    Column(
        modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.SpaceBetween,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(modifier = Modifier.weight(0.3f))
        Box(
            modifier = Modifier
                .size(100.dp)
                .clip(CircleShape)
                .background(Brush.linearGradient(listOf(colors.primaryAccent, colors.secondaryAccent))),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Default.Check,
                contentDescription = "Success check",
                tint = Color(0xFF07090F),
                modifier = Modifier.size(54.dp)
            )
        }
        Spacer(modifier = Modifier.height(CyberSpacing.xl))
        Text(
            text = "You're ready.",
            style = MaterialTheme.typography.displayLarge,
            color = colors.textPrimary,
            textAlign = TextAlign.Center
        )
        Spacer(modifier = Modifier.height(CyberSpacing.sm))
        Text(
            text = "Your CyberPulse engine is calibrated. Immerse in the pulse of futuristic sound.",
            style = MaterialTheme.typography.bodyLarge,
            color = colors.textSecondary,
            textAlign = TextAlign.Center,
            modifier = Modifier.padding(horizontal = CyberSpacing.xl)
        )
        Spacer(modifier = Modifier.weight(0.7f))

        CyberPrimaryButton(
            text = "Enter CyberPulse",
            onClick = onEnter,
            icon = Icons.Default.ElectricBolt
        )
        Spacer(modifier = Modifier.height(CyberSpacing.lg))
    }
}
