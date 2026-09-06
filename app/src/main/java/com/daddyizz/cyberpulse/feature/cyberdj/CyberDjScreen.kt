package com.daddyizz.cyberpulse.feature.cyberdj

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.daddyizz.cyberpulse.core.recommendation.CyberDjMode
import com.daddyizz.cyberpulse.core.recommendation.CyberDjSessionState
import com.daddyizz.cyberpulse.core.recommendation.DjFeedbackAction
import com.daddyizz.cyberpulse.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CyberDjScreen(
    onNavigateBack: () -> Unit,
    onNavigateToPro: () -> Unit,
    modifier: Modifier = Modifier,
    viewModel: CyberDjViewModel = viewModel()
) {
    val sessionState by viewModel.sessionState.collectAsState()
    val playbackState by viewModel.playbackState.collectAsState()
    val isPro by viewModel.isPro.collectAsState()

    var showEndDialog by remember { mutableStateOf(false) }
    var saveSuccessMessage by remember { mutableStateOf<String?>(null) }

    Scaffold(
        modifier = modifier.fillMaxSize(),
        containerColor = BackgroundDark,
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = "Cyber DJ",
                            color = TextPrimary,
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "Music that moves with you",
                            color = NeonCyan,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Back",
                            tint = TextPrimary
                        )
                    }
                },
                actions = {
                    if (sessionState.isActive) {
                        Surface(
                            color = NeonPurple.copy(alpha = 0.2f),
                            shape = RoundedCornerShape(12.dp),
                            border = androidx.compose.foundation.BorderStroke(1.dp, NeonPurple),
                            modifier = Modifier.padding(end = 12.dp)
                        ) {
                            Text(
                                text = "SESSION ACTIVE",
                                color = NeonPurple,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                            )
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = BackgroundDark)
            )
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp),
                contentPadding = PaddingValues(vertical = 16.dp)
            ) {
                if (sessionState.isActive) {
                    item {
                        ActiveSessionHudCard(
                            sessionState = sessionState,
                            currentTrackTitle = playbackState.currentTrack?.title,
                            currentTrackArtist = playbackState.currentTrack?.artist,
                            onEndSession = { showEndDialog = true },
                            onSaveQueue = {
                                viewModel.saveQueueAsPlaylist()
                                saveSuccessMessage = "Session saved to your Playlists!"
                            }
                        )
                    }

                    if (!sessionState.lastFeedbackNotice.isNullOrBlank()) {
                        item {
                            Surface(
                                color = SurfaceVariantDark,
                                shape = RoundedCornerShape(8.dp),
                                border = androidx.compose.foundation.BorderStroke(1.dp, NeonCyan.copy(alpha = 0.4f)),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Row(
                                    modifier = Modifier.padding(12.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(imageVector = Icons.Default.Tune, contentDescription = null, tint = NeonCyan, modifier = Modifier.size(18.dp))
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(
                                        text = sessionState.lastFeedbackNotice ?: "",
                                        color = TextPrimary,
                                        fontSize = 13.sp
                                    )
                                }
                            }
                        }
                    }

                    item {
                        SessionSlidersCard(
                            currentEnergy = sessionState.currentEnergy,
                            discoveryRatio = sessionState.discoveryRatio,
                            onEnergyChange = viewModel::updateEnergy,
                            onDiscoveryChange = viewModel::updateDiscovery
                        )
                    }

                    item {
                        QuickTuningCard(
                            onFeedback = viewModel::applyFeedback
                        )
                    }
                } else {
                    item {
                        IntroHeroCard()
                    }

                    item {
                        Text(
                            text = "Select Continuous Mode",
                            color = TextPrimary,
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(top = 8.dp)
                        )
                    }

                    items(CyberDjMode.entries) { mode ->
                        val isLocked = mode.isProExclusive && !isPro
                        ModeSelectionCard(
                            mode = mode,
                            isLocked = isLocked,
                            onClick = {
                                if (isLocked) {
                                    onNavigateToPro()
                                } else {
                                    viewModel.startSession(mode)
                                }
                            }
                        )
                    }
                }
            }

            if (showEndDialog) {
                AlertDialog(
                    onDismissRequest = { showEndDialog = false },
                    containerColor = SurfaceDark,
                    title = {
                        Text("End Cyber DJ Session?", color = TextPrimary, fontWeight = FontWeight.Bold)
                    },
                    text = {
                        Text(
                            "Would you like to keep the current tracks playing as a regular queue, or stop playback?",
                            color = TextSecondary,
                            fontSize = 14.sp
                        )
                    },
                    confirmButton = {
                        Button(
                            onClick = {
                                viewModel.endSession(keepQueue = true)
                                showEndDialog = false
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = NeonCyan, contentColor = BackgroundDark)
                        ) {
                            Text("Keep Queue")
                        }
                    },
                    dismissButton = {
                        TextButton(
                            onClick = {
                                viewModel.endSession(keepQueue = false)
                                showEndDialog = false
                            }
                        ) {
                            Text("Stop & Clear", color = NeonRed)
                        }
                    }
                )
            }

            saveSuccessMessage?.let { msg ->
                Snackbar(
                    modifier = Modifier
                        .align(Alignment.BottomCenter)
                        .padding(16.dp),
                    action = {
                        TextButton(onClick = { saveSuccessMessage = null }) {
                            Text("Dismiss", color = NeonCyan)
                        }
                    }
                ) {
                    Text(msg)
                }
            }
        }
    }
}

@Composable
private fun IntroHeroCard() {
    Surface(
        color = SurfaceDark,
        shape = RoundedCornerShape(16.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, NeonCyan.copy(alpha = 0.25f)),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(44.dp)
                        .clip(CircleShape)
                        .background(NeonCyan.copy(alpha = 0.2f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(imageVector = Icons.Default.GraphicEq, contentDescription = null, tint = NeonCyan)
                }
                Spacer(modifier = Modifier.width(12.dp))
                Column {
                    Text(
                        text = "Intelligent Continuous Listening",
                        color = TextPrimary,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "Never runs out • Dynamically tuned to your pulse",
                        color = TextSecondary,
                        fontSize = 12.sp
                    )
                }
            }
            Spacer(modifier = Modifier.height(12.dp))
            Text(
                text = "Pick a mode to launch an endless queue generated from your local music, radio, and catalogs. Adjust energy and discovery on the fly.",
                color = TextSecondary,
                fontSize = 13.sp,
                lineHeight = 18.sp
            )
        }
    }
}

@Composable
private fun ActiveSessionHudCard(
    sessionState: CyberDjSessionState,
    currentTrackTitle: String?,
    currentTrackArtist: String?,
    onEndSession: () -> Unit,
    onSaveQueue: () -> Unit
) {
    Surface(
        color = SurfaceDark,
        shape = RoundedCornerShape(16.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, NeonPurple),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(10.dp)
                            .clip(CircleShape)
                            .background(NeonCyan)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "${sessionState.mode.displayName.uppercase()} MODE",
                        color = NeonCyan,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold
                    )
                }

                Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    IconButton(onClick = onSaveQueue, modifier = Modifier.size(32.dp)) {
                        Icon(imageVector = Icons.Default.BookmarkBorder, contentDescription = "Save Queue", tint = TextPrimary, modifier = Modifier.size(18.dp))
                    }
                    IconButton(onClick = onEndSession, modifier = Modifier.size(32.dp)) {
                        Icon(imageVector = Icons.Default.Close, contentDescription = "End Session", tint = NeonRed, modifier = Modifier.size(18.dp))
                    }
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            if (!currentTrackTitle.isNullOrBlank()) {
                Text(
                    text = currentTrackTitle,
                    color = TextPrimary,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Text(
                    text = currentTrackArtist ?: "",
                    color = TextSecondary,
                    fontSize = 13.sp,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            } else {
                Text(
                    text = "Preparing continuous queue...",
                    color = TextSecondary,
                    fontSize = 14.sp
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "${sessionState.remainingQueueCount} tracks queued in buffer",
                    color = TextSecondary,
                    fontSize = 12.sp
                )
                if (sessionState.isExtendingQueue) {
                    Text(
                        text = "Adding next batch...",
                        color = NeonAmber,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                } else {
                    Text(
                        text = "Endless extension active",
                        color = NeonPurple,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }
        }
    }
}

@Composable
private fun SessionSlidersCard(
    currentEnergy: Int,
    discoveryRatio: Float,
    onEnergyChange: (Int) -> Unit,
    onDiscoveryChange: (Float) -> Unit
) {
    Surface(
        color = SurfaceDark,
        shape = RoundedCornerShape(16.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = "Live Acoustic Sliders",
                color = TextPrimary,
                fontSize = 15.sp,
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(12.dp))

            // Energy Slider
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(text = "Energy", color = TextSecondary, fontSize = 13.sp)
                Text(text = "$currentEnergy%", color = NeonCyan, fontSize = 13.sp, fontWeight = FontWeight.Bold)
            }
            Slider(
                value = currentEnergy.toFloat(),
                onValueChange = { onEnergyChange(it.toInt()) },
                valueRange = 1f..100f,
                colors = SliderDefaults.colors(
                    thumbColor = NeonCyan,
                    activeTrackColor = NeonCyan,
                    inactiveTrackColor = SurfaceVariantDark
                )
            )

            Spacer(modifier = Modifier.height(8.dp))

            // Discovery Slider
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(text = "Discovery", color = TextSecondary, fontSize = 13.sp)
                Text(
                    text = if (discoveryRatio < 0.4f) "Familiar" else if (discoveryRatio < 0.7f) "Balanced" else "Novel Radar",
                    color = NeonPurple,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold
                )
            }
            Slider(
                value = discoveryRatio,
                onValueChange = onDiscoveryChange,
                valueRange = 0.0f..1.0f,
                colors = SliderDefaults.colors(
                    thumbColor = NeonPurple,
                    activeTrackColor = NeonPurple,
                    inactiveTrackColor = SurfaceVariantDark
                )
            )
        }
    }
}

@Composable
private fun QuickTuningCard(
    onFeedback: (DjFeedbackAction) -> Unit
) {
    Surface(
        color = SurfaceDark,
        shape = RoundedCornerShape(16.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = "Instant Tuning",
                color = TextPrimary,
                fontSize = 15.sp,
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(12.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                TuningButton(
                    label = "More Like This",
                    icon = Icons.Default.ThumbUp,
                    color = NeonCyan,
                    modifier = Modifier.weight(1f),
                    onClick = { onFeedback(DjFeedbackAction.MORE_LIKE_THIS) }
                )
                TuningButton(
                    label = "Less Like This",
                    icon = Icons.Default.ThumbDown,
                    color = NeonRed,
                    modifier = Modifier.weight(1f),
                    onClick = { onFeedback(DjFeedbackAction.LESS_LIKE_THIS) }
                )
            }
            Spacer(modifier = Modifier.height(8.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                TuningButton(
                    label = "More Energy",
                    icon = Icons.Default.Bolt,
                    color = NeonAmber,
                    modifier = Modifier.weight(1f),
                    onClick = { onFeedback(DjFeedbackAction.MORE_ENERGY) }
                )
                TuningButton(
                    label = "Chill Down",
                    icon = Icons.Default.Spa,
                    color = NeonCyan,
                    modifier = Modifier.weight(1f),
                    onClick = { onFeedback(DjFeedbackAction.CHILL_DOWN) }
                )
                TuningButton(
                    label = "Surprise Me",
                    icon = Icons.Default.AutoAwesome,
                    color = NeonPurple,
                    modifier = Modifier.weight(1f),
                    onClick = { onFeedback(DjFeedbackAction.SURPRISE_ME) }
                )
            }
        }
    }
}

@Composable
private fun TuningButton(
    label: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    color: Color,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Surface(
        color = SurfaceVariantDark,
        shape = RoundedCornerShape(10.dp),
        modifier = modifier.clickable(onClick = onClick)
    ) {
        Row(
            modifier = Modifier.padding(vertical = 10.dp, horizontal = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Center
        ) {
            Icon(imageVector = icon, contentDescription = null, tint = color, modifier = Modifier.size(16.dp))
            Spacer(modifier = Modifier.width(6.dp))
            Text(
                text = label,
                color = TextPrimary,
                fontSize = 11.sp,
                fontWeight = FontWeight.SemiBold,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }
    }
}

@Composable
private fun ModeSelectionCard(
    mode: CyberDjMode,
    isLocked: Boolean,
    onClick: () -> Unit
) {
    Surface(
        color = SurfaceDark,
        shape = RoundedCornerShape(12.dp),
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(
                        when (mode) {
                            CyberDjMode.DRIVE, CyberDjMode.WORKOUT -> NeonAmber.copy(alpha = 0.2f)
                            CyberDjMode.CHILL, CyberDjMode.SLEEP -> NeonCyan.copy(alpha = 0.2f)
                            else -> NeonPurple.copy(alpha = 0.2f)
                        }
                    ),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = when (mode) {
                        CyberDjMode.DRIVE -> Icons.Default.DirectionsCar
                        CyberDjMode.WORKOUT -> Icons.Default.FitnessCenter
                        CyberDjMode.CHILL -> Icons.Default.Spa
                        CyberDjMode.FOCUS -> Icons.Default.Headphones
                        CyberDjMode.PARTY -> Icons.Default.Nightlife
                        CyberDjMode.SLEEP -> Icons.Default.Bedtime
                        CyberDjMode.DISCOVER -> Icons.Default.Explore
                        CyberDjMode.THROWBACK -> Icons.Default.Album
                    },
                    contentDescription = null,
                    tint = when (mode) {
                        CyberDjMode.DRIVE, CyberDjMode.WORKOUT -> NeonAmber
                        CyberDjMode.CHILL, CyberDjMode.SLEEP -> NeonCyan
                        else -> NeonPurple
                    }
                )
            }

            Spacer(modifier = Modifier.width(14.dp))

            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = mode.displayName,
                        color = TextPrimary,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold
                    )
                    if (mode.isProExclusive) {
                        Spacer(modifier = Modifier.width(6.dp))
                        Surface(
                            color = NeonAmber.copy(alpha = 0.2f),
                            shape = RoundedCornerShape(4.dp)
                        ) {
                            Text(
                                text = "PRO",
                                color = NeonAmber,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp)
                            )
                        }
                    }
                }
                Text(
                    text = mode.description,
                    color = TextSecondary,
                    fontSize = 12.sp,
                    modifier = Modifier.padding(top = 2.dp)
                )
            }

            Icon(
                imageVector = if (isLocked) Icons.Default.Lock else Icons.Default.PlayArrow,
                contentDescription = null,
                tint = if (isLocked) NeonAmber else NeonCyan
            )
        }
    }
}
