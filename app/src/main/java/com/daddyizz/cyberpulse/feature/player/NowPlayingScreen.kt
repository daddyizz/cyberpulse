package com.daddyizz.cyberpulse.feature.player

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.daddyizz.cyberpulse.core.designsystem.*
import com.daddyizz.cyberpulse.core.model.MusicSource
import com.daddyizz.cyberpulse.core.model.Track

@Composable
fun NowPlayingScreen(
    viewModel: PlayerViewModel,
    onCollapseClick: () -> Unit,
    onOpenLyrics: () -> Unit,
    onOpenQueue: () -> Unit,
    onOpenArtist: ((String) -> Unit)? = null,
    onOpenAlbum: ((String) -> Unit)? = null,
    onOpenTrackActions: ((Track) -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    val uiState by viewModel.uiState.collectAsState()
    val track = uiState.currentTrack ?: return
    val colors = LocalCyberPulseColors.current

    val currentSeconds = uiState.currentPositionSeconds
    val totalSeconds = if (uiState.durationSeconds > 0) {
        uiState.durationSeconds
    } else if (track.durationSeconds > 0) {
        track.durationSeconds
    } else {
        214L
    }

    // Live smooth scrubbing state
    var isScrubbing by remember { mutableStateOf(false) }
    var scrubFraction by remember { mutableFloatStateOf(0f) }

    val displayFraction = if (isScrubbing) scrubFraction else uiState.progressFraction
    val displayCurrentSeconds = if (isScrubbing) {
        (scrubFraction * totalSeconds).toLong()
    } else {
        currentSeconds
    }

    CyberPulseBackground(modifier = modifier) {
        BoxWithConstraints(
            modifier = Modifier
                .fillMaxSize()
                .statusBarsPadding()
                .navigationBarsPadding()
                .padding(horizontal = CyberSpacing.screenHorizontal)
        ) {
            val isWide = maxWidth > 600.dp

            if (isWide) {
                // Wide / Tablet / Landscape 2-Column Layout
                Row(
                    modifier = Modifier.fillMaxSize(),
                    horizontalArrangement = Arrangement.spacedBy(CyberSpacing.xl),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Left Column: Artwork + Source Badge
                    Column(
                        modifier = Modifier
                            .weight(1f)
                            .fillMaxHeight(),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        IconButton(
                            onClick = onCollapseClick,
                            modifier = Modifier.align(Alignment.Start)
                        ) {
                            Icon(
                                imageVector = Icons.Default.KeyboardArrowDown,
                                contentDescription = "Collapse",
                                tint = colors.textPrimary,
                                modifier = Modifier.size(32.dp)
                            )
                        }
                        Spacer(modifier = Modifier.height(CyberSpacing.sm))
                        Box(
                            modifier = Modifier
                                .size(260.dp)
                                .clip(RoundedCornerShape(CyberRadius.lg))
                                .border(1.5.dp, colors.borderHighlight, RoundedCornerShape(CyberRadius.lg)),
                            contentAlignment = Alignment.Center
                        ) {
                            CyberArtworkPlaceholder(
                                keyName = track.placeholderArtworkKey,
                                modifier = Modifier.fillMaxSize(),
                                shape = RoundedCornerShape(CyberRadius.lg)
                            )
                            if (uiState.isBuffering) {
                                CircularProgressIndicator(
                                    modifier = Modifier.size(48.dp),
                                    color = colors.primaryAccent,
                                    strokeWidth = 3.dp
                                )
                            }
                        }
                        Spacer(modifier = Modifier.height(CyberSpacing.md))
                        SourceBadge(source = track.source, colors = colors)
                    }

                    // Right Column: Controls, Track Meta, Progress, Bottom Buttons
                    Column(
                        modifier = Modifier
                            .weight(1.2f)
                            .fillMaxHeight(),
                        verticalArrangement = Arrangement.SpaceEvenly
                    ) {
                        TrackMetaHeader(
                            track = track,
                            colors = colors,
                            uiState = uiState,
                            onOpenArtist = onOpenArtist,
                            onOpenAlbum = onOpenAlbum,
                            onOpenTrackActions = onOpenTrackActions,
                            onToggleFavorite = { viewModel.toggleFavorite() }
                        )

                        ScrubbingSlider(
                            fraction = displayFraction,
                            currentSeconds = displayCurrentSeconds,
                            totalSeconds = totalSeconds,
                            colors = colors,
                            onScrub = { fraction ->
                                isScrubbing = true
                                scrubFraction = fraction
                            },
                            onScrubEnd = {
                                isScrubbing = false
                                viewModel.seekTo((scrubFraction * totalSeconds).toLong())
                            }
                        )

                        MainControlsRow(
                            uiState = uiState,
                            colors = colors,
                            viewModel = viewModel
                        )

                        BottomActionsRow(
                            uiState = uiState,
                            colors = colors,
                            onOpenLyrics = onOpenLyrics,
                            onOpenQueue = onOpenQueue
                        )
                    }
                }
            } else {
                // Portrait Mobile Layout
                Column(
                    modifier = Modifier.fillMaxSize(),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.SpaceBetween
                ) {
                    // Top Bar: Collapse Chevron, Header Title, Overflow Menu
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(56.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        IconButton(onClick = onCollapseClick) {
                            Icon(
                                imageVector = Icons.Default.KeyboardArrowDown,
                                contentDescription = "Collapse player",
                                tint = colors.textPrimary,
                                modifier = Modifier.size(32.dp)
                            )
                        }
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(
                                text = if (uiState.isBuffering) "BUFFERING PULSE..." else "PLAYING FROM PLAYLIST",
                                style = MaterialTheme.typography.labelMedium.copy(fontSize = 10.sp, letterSpacing = 1.sp),
                                color = if (uiState.isBuffering) colors.primaryAccent else colors.textMuted
                            )
                            Text(
                                text = track.album,
                                style = MaterialTheme.typography.titleMedium,
                                color = colors.textPrimary,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        }
                        IconButton(onClick = {
                            if (onOpenTrackActions != null) {
                                onOpenTrackActions(track)
                            } else {
                                viewModel.openTrackMenu(track)
                            }
                        }) {
                            Icon(
                                imageVector = Icons.Default.MoreVert,
                                contentDescription = "Options",
                                tint = colors.textPrimary
                            )
                        }
                    }

                    // Notice / Capability Banner if present
                    if (uiState.capabilityNotice != null) {
                        Surface(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = CyberSpacing.xs),
                            shape = RoundedCornerShape(CyberRadius.sm),
                            color = colors.surfaceElevated,
                            border = androidx.compose.foundation.BorderStroke(1.dp, colors.secondaryAccent)
                        ) {
                            Row(
                                modifier = Modifier.padding(CyberSpacing.sm),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Info,
                                    contentDescription = "Notice",
                                    tint = colors.secondaryAccent,
                                    modifier = Modifier.size(20.dp)
                                )
                                Spacer(modifier = Modifier.width(CyberSpacing.sm))
                                Text(
                                    text = uiState.capabilityNotice ?: "",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = colors.textPrimary,
                                    modifier = Modifier.weight(1f)
                                )
                                IconButton(onClick = { viewModel.clearCapabilityNotice() }) {
                                    Icon(
                                        imageVector = Icons.Default.Close,
                                        contentDescription = "Dismiss",
                                        tint = colors.textMuted,
                                        modifier = Modifier.size(16.dp)
                                    )
                                }
                            }
                        }
                    }

                    // Playback Error Banner if present
                    if (uiState.playbackError != null) {
                        Surface(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = CyberSpacing.xs),
                            shape = RoundedCornerShape(CyberRadius.sm),
                            color = colors.surfaceElevated,
                            border = androidx.compose.foundation.BorderStroke(1.dp, colors.tertiaryAccent)
                        ) {
                            Row(
                                modifier = Modifier.padding(CyberSpacing.sm),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Warning,
                                    contentDescription = "Error",
                                    tint = colors.tertiaryAccent,
                                    modifier = Modifier.size(20.dp)
                                )
                                Spacer(modifier = Modifier.width(CyberSpacing.sm))
                                Text(
                                    text = uiState.playbackError?.userMessage ?: "Playback error",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = colors.textPrimary,
                                    modifier = Modifier.weight(1f)
                                )
                                IconButton(onClick = { viewModel.dismissError() }) {
                                    Icon(
                                        imageVector = Icons.Default.Close,
                                        contentDescription = "Dismiss",
                                        tint = colors.textMuted,
                                        modifier = Modifier.size(16.dp)
                                    )
                                }
                            }
                        }
                    }

                    // Hero Artwork
                    Box(
                        modifier = Modifier
                            .size(280.dp)
                            .clip(RoundedCornerShape(CyberRadius.lg))
                            .border(1.5.dp, colors.borderHighlight, RoundedCornerShape(CyberRadius.lg)),
                        contentAlignment = Alignment.Center
                    ) {
                        CyberArtworkPlaceholder(
                            keyName = track.placeholderArtworkKey,
                            modifier = Modifier.fillMaxSize(),
                            shape = RoundedCornerShape(CyberRadius.lg)
                        )
                        if (uiState.isBuffering) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(48.dp),
                                color = colors.primaryAccent,
                                strokeWidth = 3.dp
                            )
                        }
                    }

                    // Source Badge & Hi-Res Output Indicator
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        SourceBadge(source = track.source, colors = colors)
                        Surface(
                            shape = RoundedCornerShape(CyberRadius.full),
                            color = colors.surfaceSecondary,
                            border = androidx.compose.foundation.BorderStroke(1.dp, colors.border)
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Headphones,
                                    contentDescription = null,
                                    tint = colors.primaryAccent,
                                    modifier = Modifier.size(12.dp)
                                )
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(
                                    text = "Lossless 48kHz",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = colors.textSecondary
                                )
                            }
                        }
                    }

                    // Track Meta Header
                    TrackMetaHeader(
                        track = track,
                        colors = colors,
                        uiState = uiState,
                        onOpenArtist = onOpenArtist,
                        onOpenAlbum = onOpenAlbum,
                        onOpenTrackActions = onOpenTrackActions,
                        onToggleFavorite = { viewModel.toggleFavorite() }
                    )

                    // Progress Slider with Live Smooth Scrubbing
                    ScrubbingSlider(
                        fraction = displayFraction,
                        currentSeconds = displayCurrentSeconds,
                        totalSeconds = totalSeconds,
                        colors = colors,
                        onScrub = { fraction ->
                            isScrubbing = true
                            scrubFraction = fraction
                        },
                        onScrubEnd = {
                            isScrubbing = false
                            viewModel.seekTo((scrubFraction * totalSeconds).toLong())
                        }
                    )

                    // Main Playback Controls
                    MainControlsRow(
                        uiState = uiState,
                        colors = colors,
                        viewModel = viewModel
                    )

                    // Bottom Bar: Lyrics & Queue
                    BottomActionsRow(
                        uiState = uiState,
                        colors = colors,
                        onOpenLyrics = onOpenLyrics,
                        onOpenQueue = onOpenQueue
                    )
                }
            }
        }
    }
}

@Composable
private fun SourceBadge(
    source: MusicSource,
    colors: CyberPulseColors
) {
    val (label, accent) = when (source) {
        MusicSource.LOCAL_DEMO -> "LOCAL DEMO PULSE" to colors.primaryAccent
        MusicSource.YOUTUBE -> "YOUTUBE METADATA DISCOVERY" to colors.secondaryAccent
        else -> "STREAMING PULSE" to colors.primaryAccent
    }
    Surface(
        shape = RoundedCornerShape(CyberRadius.full),
        color = accent.copy(alpha = 0.15f),
        border = androidx.compose.foundation.BorderStroke(1.dp, accent.copy(alpha = 0.6f))
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall.copy(fontSize = 9.sp, letterSpacing = 0.5.sp),
            color = accent,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
        )
    }
}

@Composable
private fun TrackMetaHeader(
    track: Track,
    colors: CyberPulseColors,
    uiState: PlayerUiState,
    onOpenArtist: ((String) -> Unit)?,
    onOpenAlbum: ((String) -> Unit)?,
    onOpenTrackActions: ((Track) -> Unit)?,
    onToggleFavorite: () -> Unit
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = track.title,
                style = MaterialTheme.typography.headlineLarge,
                color = colors.textPrimary,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            Spacer(modifier = Modifier.height(CyberSpacing.xxs))
            Text(
                text = track.artist,
                style = MaterialTheme.typography.titleLarge,
                color = if (onOpenArtist != null && track.artistId != null) colors.primaryAccent else colors.textSecondary,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
                modifier = if (onOpenArtist != null && track.artistId != null) {
                    Modifier.clickable { onOpenArtist(track.artistId) }
                } else Modifier
            )
        }
        IconButton(
            onClick = onToggleFavorite,
            modifier = Modifier.size(48.dp)
        ) {
            Icon(
                imageVector = if (track.isLiked) Icons.Default.Favorite else Icons.Default.FavoriteBorder,
                contentDescription = "Favorite",
                tint = if (track.isLiked) colors.tertiaryAccent else colors.textSecondary,
                modifier = Modifier.size(28.dp)
            )
        }
    }
}

@Composable
private fun ScrubbingSlider(
    fraction: Float,
    currentSeconds: Long,
    totalSeconds: Long,
    colors: CyberPulseColors,
    onScrub: (Float) -> Unit,
    onScrubEnd: () -> Unit
) {
    Column(modifier = Modifier.fillMaxWidth()) {
        Slider(
            value = fraction.coerceIn(0f, 1f),
            onValueChange = onScrub,
            onValueChangeFinished = onScrubEnd,
            colors = SliderDefaults.colors(
                thumbColor = colors.primaryAccent,
                activeTrackColor = colors.primaryAccent,
                inactiveTrackColor = colors.border
            ),
            modifier = Modifier.fillMaxWidth()
        )
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            val curMin = currentSeconds / 60
            val curSec = currentSeconds % 60
            val totMin = totalSeconds / 60
            val totSec = totalSeconds % 60
            Text(
                text = "%d:%02d".format(curMin, curSec),
                style = MaterialTheme.typography.labelMedium,
                color = colors.textMuted
            )
            Text(
                text = "%d:%02d".format(totMin, totSec),
                style = MaterialTheme.typography.labelMedium,
                color = colors.textMuted
            )
        }
    }
}

@Composable
private fun MainControlsRow(
    uiState: PlayerUiState,
    colors: CyberPulseColors,
    viewModel: PlayerViewModel
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        IconButton(
            onClick = { viewModel.toggleShuffle() },
            modifier = Modifier.size(48.dp)
        ) {
            Icon(
                imageVector = Icons.Default.Shuffle,
                contentDescription = "Shuffle",
                tint = if (uiState.isShuffleEnabled) colors.primaryAccent else colors.textMuted,
                modifier = Modifier.size(24.dp)
            )
        }

        IconButton(
            onClick = { viewModel.skipPrevious() },
            modifier = Modifier.size(48.dp)
        ) {
            Icon(
                imageVector = Icons.Default.SkipPrevious,
                contentDescription = "Previous",
                tint = colors.textPrimary,
                modifier = Modifier.size(36.dp)
            )
        }

        // Main Play/Pause Button with Neon Glow
        Box(
            modifier = Modifier
                .size(68.dp)
                .clip(CircleShape)
                .background(colors.primaryAccent)
                .clickable { viewModel.togglePlayPause() },
            contentAlignment = Alignment.Center
        ) {
            if (uiState.isBuffering) {
                CircularProgressIndicator(
                    modifier = Modifier.size(32.dp),
                    color = Color(0xFF07090F),
                    strokeWidth = 3.dp
                )
            } else {
                Icon(
                    imageVector = if (uiState.isPlaying) Icons.Default.Pause else Icons.Default.PlayArrow,
                    contentDescription = if (uiState.isPlaying) "Pause" else "Play",
                    tint = Color(0xFF07090F),
                    modifier = Modifier.size(38.dp)
                )
            }
        }

        IconButton(
            onClick = { viewModel.skipNext() },
            modifier = Modifier.size(48.dp)
        ) {
            Icon(
                imageVector = Icons.Default.SkipNext,
                contentDescription = "Next",
                tint = colors.textPrimary,
                modifier = Modifier.size(36.dp)
            )
        }

        IconButton(
            onClick = { viewModel.toggleRepeat() },
            modifier = Modifier.size(48.dp)
        ) {
            Icon(
                imageVector = if (uiState.repeatMode == androidx.media3.common.Player.REPEAT_MODE_ONE) Icons.Default.RepeatOne else Icons.Default.Repeat,
                contentDescription = "Repeat Mode",
                tint = if (uiState.isRepeatEnabled) colors.primaryAccent else colors.textMuted,
                modifier = Modifier.size(24.dp)
            )
        }
    }
}

@Composable
private fun BottomActionsRow(
    uiState: PlayerUiState,
    colors: CyberPulseColors,
    onOpenLyrics: () -> Unit,
    onOpenQueue: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = CyberSpacing.lg),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(
            modifier = Modifier
                .clip(RoundedCornerShape(CyberRadius.full))
                .background(colors.surfaceSecondary)
                .border(1.dp, colors.border, RoundedCornerShape(CyberRadius.full))
                .clickable(onClick = onOpenLyrics)
                .padding(horizontal = CyberSpacing.md, vertical = CyberSpacing.xs),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Default.Lyrics,
                contentDescription = "Lyrics",
                tint = colors.primaryAccent,
                modifier = Modifier.size(16.dp)
            )
            Spacer(modifier = Modifier.width(CyberSpacing.xs))
            Text(
                text = "Lyrics",
                style = MaterialTheme.typography.labelMedium,
                color = colors.textPrimary
            )
        }

        Row(
            modifier = Modifier
                .clip(RoundedCornerShape(CyberRadius.full))
                .background(colors.surfaceSecondary)
                .border(1.dp, colors.border, RoundedCornerShape(CyberRadius.full))
                .clickable(onClick = onOpenQueue)
                .padding(horizontal = CyberSpacing.md, vertical = CyberSpacing.xs),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Default.QueueMusic,
                contentDescription = "Queue",
                tint = colors.primaryAccent,
                modifier = Modifier.size(16.dp)
            )
            Spacer(modifier = Modifier.width(CyberSpacing.xs))
            val queueCount = if (uiState.queue.isNotEmpty()) uiState.queue.size else 1
            Text(
                text = "Queue ($queueCount)",
                style = MaterialTheme.typography.labelMedium,
                color = colors.textPrimary
            )
        }
    }
}
