package com.daddyizz.cyberpulse.feature.player.lyrics

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.lazy.rememberLazyListState
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
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.daddyizz.cyberpulse.core.designsystem.*
import com.daddyizz.cyberpulse.core.lyrics.LyricLine
import com.daddyizz.cyberpulse.core.lyrics.Lyrics
import com.daddyizz.cyberpulse.core.lyrics.LyricsResult
import com.daddyizz.cyberpulse.core.lyrics.LyricsType
import com.daddyizz.cyberpulse.core.model.MusicSource
import com.daddyizz.cyberpulse.core.model.Track
import kotlinx.coroutines.launch

@Composable
fun LyricsScreen(
    track: Track?,
    lyricsResult: LyricsResult?,
    currentPositionMs: Long,
    isPlaying: Boolean,
    onSeekToMs: (Long) -> Unit,
    onTogglePlayPause: () -> Unit,
    onClose: () -> Unit,
    modifier: Modifier = Modifier
) {
    val colors = LocalCyberPulseColors.current
    val listState = rememberLazyListState()
    val coroutineScope = rememberCoroutineScope()

    val lyrics = (lyricsResult as? LyricsResult.Success)?.lyrics
    val isSynced = lyrics?.isSynced == true

    // Compute active lyric line
    val activeLineIndex = remember(lyrics, currentPositionMs) {
        lyrics?.findActiveLineIndex(currentPositionMs) ?: -1
    }

    // Auto-scroll control state
    var isUserScrolledManually by remember { mutableStateOf(false) }

    // Detect user dragging to pause auto-follow
    LaunchedEffect(listState.isScrollInProgress) {
        if (listState.isScrollInProgress) {
            isUserScrolledManually = true
        }
    }

    // Auto-scroll to active line when not manually scrolled
    LaunchedEffect(activeLineIndex, isUserScrolledManually) {
        if (isSynced && !isUserScrolledManually && activeLineIndex >= 0 && activeLineIndex < (lyrics?.lines?.size ?: 0)) {
            coroutineScope.launch {
                listState.animateScrollToItem(
                    index = (activeLineIndex - 2).coerceAtLeast(0)
                )
            }
        }
    }

    Scaffold(
        modifier = modifier
            .fillMaxSize()
            .statusBarsPadding(),
        containerColor = colors.backgroundPrimary,
        topBar = {
            // Header with artwork thumbnail and close button
            Surface(
                modifier = Modifier.fillMaxWidth(),
                color = colors.backgroundPrimary
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = CyberSpacing.screenHorizontal, vertical = 12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(
                        modifier = Modifier.weight(1f),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        // Artwork thumbnail
                        if (track?.artworkUri != null) {
                            AsyncImage(
                                model = track.artworkUri,
                                contentDescription = null,
                                modifier = Modifier
                                    .size(44.dp)
                                    .clip(RoundedCornerShape(CyberRadius.sm)),
                                contentScale = ContentScale.Crop
                            )
                        } else {
                            Box(
                                modifier = Modifier
                                    .size(44.dp)
                                    .clip(RoundedCornerShape(CyberRadius.sm))
                                    .background(colors.surfaceElevated),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.MusicNote,
                                    contentDescription = null,
                                    tint = colors.primaryAccent,
                                    modifier = Modifier.size(22.dp)
                                )
                            }
                        }

                        Column {
                            Text(
                                text = track?.title ?: "No Track",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = colors.textPrimary,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                            Text(
                                text = track?.artist ?: "Unknown Artist",
                                style = MaterialTheme.typography.bodySmall,
                                color = colors.textSecondary,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        }
                    }

                    IconButton(
                        onClick = onClose,
                        modifier = Modifier
                            .size(36.dp)
                            .clip(CircleShape)
                            .background(colors.surfaceCard)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Close,
                            contentDescription = "Close",
                            tint = colors.textPrimary,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                }
            }
        },
        bottomBar = {
            // Floating Mini Playback Bar
            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .navigationBarsPadding()
                    .padding(horizontal = CyberSpacing.screenHorizontal, vertical = 12.dp),
                shape = RoundedCornerShape(CyberRadius.md),
                color = colors.surfaceElevated,
                border = androidx.compose.foundation.BorderStroke(1.dp, colors.borderSubtle)
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 10.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    val currentSec = currentPositionMs / 1000L
                    val min = currentSec / 60
                    val sec = currentSec % 60
                    Text(
                        text = String.format("%02d:%02d", min, sec),
                        style = MaterialTheme.typography.labelMedium,
                        color = colors.primaryAccent,
                        fontWeight = FontWeight.SemiBold
                    )

                    IconButton(
                        onClick = onTogglePlayPause,
                        modifier = Modifier
                            .size(42.dp)
                            .clip(CircleShape)
                            .background(colors.primaryAccent)
                    ) {
                        Icon(
                            imageVector = if (isPlaying) Icons.Default.Pause else Icons.Default.PlayArrow,
                            contentDescription = if (isPlaying) "Pause" else "Play",
                            tint = Color.Black
                        )
                    }
                }
            }
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            when {
                // 1. Loading
                lyricsResult == null -> {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator(
                            color = colors.primaryAccent,
                            modifier = Modifier.size(36.dp)
                        )
                    }
                }

                // 2. Unavailable / Error State
                lyricsResult is LyricsResult.Unavailable || lyricsResult is LyricsResult.Error -> {
                    val message = when (lyricsResult) {
                        is LyricsResult.Unavailable -> lyricsResult.reason
                        is LyricsResult.Error -> lyricsResult.error.message
                        else -> "Lyrics unavailable"
                    }
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(horizontal = CyberSpacing.screenHorizontal),
                        contentAlignment = Alignment.Center
                    ) {
                        Surface(
                            modifier = Modifier.fillMaxWidth(0.9f),
                            shape = RoundedCornerShape(CyberRadius.md),
                            color = colors.surfaceCard,
                            border = androidx.compose.foundation.BorderStroke(1.dp, colors.borderSubtle)
                        ) {
                            Column(
                                modifier = Modifier.padding(CyberSpacing.lg),
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.SpeakerNotesOff,
                                    contentDescription = null,
                                    tint = colors.textMuted,
                                    modifier = Modifier.size(40.dp)
                                )
                                Text(
                                    text = "Lyrics aren't available for this track",
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = colors.textPrimary,
                                    textAlign = TextAlign.Center
                                )
                                Text(
                                    text = message,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = colors.textSecondary,
                                    textAlign = TextAlign.Center
                                )
                            }
                        }
                    }
                }

                // 3. Valid Lyrics (Synced or Plain)
                lyrics != null -> {
                    LazyColumn(
                        state = listState,
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(horizontal = CyberSpacing.screenHorizontal),
                        contentPadding = PaddingValues(top = 20.dp, bottom = 80.dp),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        itemsIndexed(lyrics.lines) { index, line ->
                            val isActive = index == activeLineIndex

                            LyricLineItem(
                                line = line,
                                isActive = isActive,
                                isSynced = isSynced,
                                isSeekable = track?.source != MusicSource.RADIO,
                                onClick = {
                                    if (line.startTimeMs != null && track?.source != MusicSource.RADIO) {
                                        onSeekToMs(line.startTimeMs)
                                        isUserScrolledManually = false
                                    }
                                }
                            )
                        }

                        // Legal & Attribution Notice
                        item {
                            Spacer(modifier = Modifier.height(24.dp))
                            Column(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                if (!lyrics.providerAttribution.isNullOrBlank()) {
                                    Text(
                                        text = "Lyrics provided by ${lyrics.providerAttribution}",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = colors.textMuted
                                    )
                                }
                                if (!lyrics.copyrightNotice.isNullOrBlank()) {
                                    Text(
                                        text = lyrics.copyrightNotice,
                                        style = MaterialTheme.typography.labelSmall,
                                        color = colors.textMuted,
                                        textAlign = TextAlign.Center
                                    )
                                }
                            }
                        }
                    }

                    // Floating "Return to current line" button (when manually scrolled)
                    AnimatedVisibility(
                        visible = isUserScrolledManually && isSynced && activeLineIndex >= 0,
                        enter = fadeIn(),
                        exit = fadeOut(),
                        modifier = Modifier
                            .align(Alignment.BottomCenter)
                            .padding(bottom = 20.dp)
                    ) {
                        Button(
                            onClick = {
                                isUserScrolledManually = false
                                coroutineScope.launch {
                                    listState.animateScrollToItem(
                                        index = (activeLineIndex - 2).coerceAtLeast(0)
                                    )
                                }
                            },
                            shape = RoundedCornerShape(CyberRadius.pill),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = colors.primaryAccent,
                                contentColor = Color.Black
                            ),
                            elevation = ButtonDefaults.buttonElevation(defaultElevation = 6.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.ArrowDownward,
                                contentDescription = null,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "Return to current line",
                                fontWeight = FontWeight.Bold,
                                style = MaterialTheme.typography.labelMedium
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun LyricLineItem(
    line: LyricLine,
    isActive: Boolean,
    isSynced: Boolean,
    isSeekable: Boolean,
    onClick: () -> Unit
) {
    val colors = LocalCyberPulseColors.current

    val textColor = when {
        !isSynced -> colors.textPrimary
        isActive -> colors.primaryAccent
        else -> colors.textSecondary.copy(alpha = 0.45f)
    }

    val fontSize = if (isActive && isSynced) 22.sp else 18.sp
    val fontWeight = if (isActive && isSynced) FontWeight.Bold else FontWeight.Medium

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(CyberRadius.sm))
            .clickable(enabled = isSynced && isSeekable, onClick = onClick)
            .padding(vertical = 8.dp, horizontal = 4.dp)
    ) {
        Text(
            text = line.text,
            style = MaterialTheme.typography.bodyLarge.copy(
                fontSize = fontSize,
                fontWeight = fontWeight,
                lineHeight = (fontSize.value * 1.4f).sp
            ),
            color = textColor,
            textAlign = TextAlign.Start
        )
    }
}
