package com.daddyizz.cyberpulse.feature.player

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.daddyizz.cyberpulse.core.designsystem.*
import com.daddyizz.cyberpulse.core.model.Track

/**
 * QueueView: Cyberpunk-styled authoritative playback queue sheet.
 * Displays currently playing item, upcoming queue, reordering controls,
 * swipe/click removal, and clear queue options.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun QueueBottomSheet(
    viewModel: PlayerViewModel,
    onDismiss: () -> Unit,
    modifier: Modifier = Modifier
) {
    val colors = LocalCyberPulseColors.current

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = colors.surfaceElevated,
        dragHandle = {
            Box(
                modifier = Modifier
                    .padding(vertical = CyberSpacing.sm)
                    .width(44.dp)
                    .height(4.dp)
                    .clip(RoundedCornerShape(CyberRadius.full))
                    .background(colors.borderHighlight)
            )
        },
        modifier = modifier
    ) {
        QueueContent(
            viewModel = viewModel,
            onClose = onDismiss,
            modifier = Modifier.fillMaxWidth()
        )
    }
}

@Composable
fun QueueContent(
    viewModel: PlayerViewModel,
    onClose: () -> Unit,
    modifier: Modifier = Modifier
) {
    val colors = LocalCyberPulseColors.current
    val uiState = androidx.compose.runtime.collectAsState(viewModel.uiState).value

    val currentTrack = uiState.currentTrack
    val queue = uiState.queue
    val currentIndex = uiState.currentQueueIndex

    Column(
        modifier = modifier
            .fillMaxHeight(0.85f)
            .padding(horizontal = CyberSpacing.screenHorizontal)
    ) {
        // Header Row: Title, Queue Count, Clear Action, Done
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = CyberSpacing.sm),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = "Playing Queue",
                        style = MaterialTheme.typography.headlineMedium,
                        color = colors.textPrimary,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.width(CyberSpacing.sm))
                    Surface(
                        shape = RoundedCornerShape(CyberRadius.full),
                        color = colors.primaryAccent.copy(alpha = 0.2f),
                        border = androidx.compose.foundation.BorderStroke(1.dp, colors.primaryAccent)
                    ) {
                        Text(
                            text = "${queue.size} Tracks",
                            style = MaterialTheme.typography.labelSmall,
                            color = colors.primaryAccent,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                        )
                    }
                }
                Text(
                    text = if (uiState.isShuffleEnabled) "Shuffle Active • Media3 Authoritative Queue" else "Sequential Order • Media3 Authoritative Queue",
                    style = MaterialTheme.typography.bodySmall,
                    color = colors.textMuted
                )
            }

            Row(verticalAlignment = Alignment.CenterVertically) {
                if (queue.isNotEmpty()) {
                    TextButton(
                        onClick = { viewModel.clearUpcomingQueue() },
                        colors = ButtonDefaults.textButtonColors(contentColor = colors.tertiaryAccent)
                    ) {
                        Text("Clear Upcoming", style = MaterialTheme.typography.labelMedium)
                    }
                }
                IconButton(onClick = onClose) {
                    Icon(
                        imageVector = Icons.Default.Close,
                        contentDescription = "Close Queue",
                        tint = colors.textSecondary
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(CyberSpacing.xs))

        LazyColumn(
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f),
            verticalArrangement = Arrangement.spacedBy(CyberSpacing.xs),
            contentPadding = PaddingValues(bottom = 32.dp)
        ) {
            // Section: Currently Playing
            if (currentTrack != null) {
                item {
                    Text(
                        text = "NOW PLAYING",
                        style = MaterialTheme.typography.labelMedium.copy(letterSpacing = 1.sp, fontSize = 11.sp),
                        color = colors.primaryAccent,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(CyberSpacing.xs))
                    Surface(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(CyberRadius.md))
                            .border(1.5.dp, colors.primaryAccent, RoundedCornerShape(CyberRadius.md)),
                        color = colors.surfaceSecondary
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(CyberSpacing.sm),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            CyberArtworkPlaceholder(
                                keyName = currentTrack.placeholderArtworkKey,
                                modifier = Modifier
                                    .size(48.dp)
                                    .clip(RoundedCornerShape(CyberRadius.sm))
                            )
                            Spacer(modifier = Modifier.width(CyberSpacing.md))
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = currentTrack.title,
                                    style = MaterialTheme.typography.titleMedium,
                                    color = colors.primaryAccent,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                                Text(
                                    text = "${currentTrack.artist} • ${currentTrack.album}",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = colors.textSecondary,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                            }
                            Spacer(modifier = Modifier.width(CyberSpacing.xs))
                            Box(
                                modifier = Modifier
                                    .size(32.dp)
                                    .clip(CircleShape)
                                    .background(colors.primaryAccent),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = if (uiState.isPlaying) Icons.Default.GraphicEq else Icons.Default.PlayArrow,
                                    contentDescription = "Playing Indicator",
                                    tint = Color(0xFF07090F),
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                        }
                    }
                    Spacer(modifier = Modifier.height(CyberSpacing.md))
                }
            }

            // Section: Up Next
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "UP NEXT",
                        style = MaterialTheme.typography.labelMedium.copy(letterSpacing = 1.sp, fontSize = 11.sp),
                        color = colors.textMuted,
                        fontWeight = FontWeight.Bold
                    )
                    if (queue.size > 1) {
                        Text(
                            text = "${queue.size} total items",
                            style = MaterialTheme.typography.labelSmall,
                            color = colors.textMuted
                        )
                    }
                }
                Spacer(modifier = Modifier.height(CyberSpacing.xs))
            }

            if (queue.isEmpty() || (queue.size == 1 && currentTrack != null)) {
                item {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = CyberSpacing.xxl),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Icon(
                                imageVector = Icons.Default.QueueMusic,
                                contentDescription = null,
                                tint = colors.textMuted,
                                modifier = Modifier.size(48.dp)
                            )
                            Spacer(modifier = Modifier.height(CyberSpacing.sm))
                            Text(
                                text = "Queue is empty",
                                style = MaterialTheme.typography.titleMedium,
                                color = colors.textPrimary
                            )
                            Text(
                                text = "Select tracks or playlists to add them to your pulse.",
                                style = MaterialTheme.typography.bodySmall,
                                color = colors.textSecondary
                            )
                        }
                    }
                }
            } else {
                itemsIndexed(queue) { index, track ->
                    val isCurrent = (index == currentIndex) || (currentTrack?.id == track.id)
                    QueueTrackRow(
                        track = track,
                        index = index,
                        isCurrent = isCurrent,
                        canMoveUp = index > 0,
                        canMoveDown = index < queue.size - 1,
                        onTrackClick = { viewModel.seekToQueueIndex(index) },
                        onMoveUp = { viewModel.moveQueueItem(index, index - 1) },
                        onMoveDown = { viewModel.moveQueueItem(index, index + 1) },
                        onRemove = { viewModel.removeFromQueue(index) }
                    )
                }
            }
        }
    }
}

@Composable
private fun QueueTrackRow(
    track: Track,
    index: Int,
    isCurrent: Boolean,
    canMoveUp: Boolean,
    canMoveDown: Boolean,
    onTrackClick: () -> Unit,
    onMoveUp: () -> Unit,
    onMoveDown: () -> Unit,
    onRemove: () -> Unit,
    modifier: Modifier = Modifier
) {
    val colors = LocalCyberPulseColors.current

    Surface(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(CyberRadius.sm))
            .border(
                1.dp,
                if (isCurrent) colors.primaryAccent.copy(alpha = 0.6f) else colors.border,
                RoundedCornerShape(CyberRadius.sm)
            )
            .clickable(onClick = onTrackClick),
        color = if (isCurrent) colors.surfaceSecondary else colors.surfaceCard
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = CyberSpacing.sm, vertical = CyberSpacing.xs),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Track Order Number
            Text(
                text = "${index + 1}",
                style = MaterialTheme.typography.labelSmall,
                color = if (isCurrent) colors.primaryAccent else colors.textMuted,
                modifier = Modifier.width(24.dp)
            )

            // Small artwork
            CyberArtworkPlaceholder(
                keyName = track.placeholderArtworkKey,
                modifier = Modifier
                    .size(40.dp)
                    .clip(RoundedCornerShape(CyberRadius.xs))
            )

            Spacer(modifier = Modifier.width(CyberSpacing.sm))

            // Title and Artist
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = track.title,
                    style = MaterialTheme.typography.titleMedium,
                    color = if (isCurrent) colors.primaryAccent else colors.textPrimary,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Text(
                    text = track.artist,
                    style = MaterialTheme.typography.bodySmall,
                    color = colors.textSecondary,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }

            // Duration
            Text(
                text = track.formattedDuration,
                style = MaterialTheme.typography.labelSmall,
                color = colors.textMuted,
                modifier = Modifier.padding(horizontal = CyberSpacing.xs)
            )

            // Move Up Button
            IconButton(
                onClick = onMoveUp,
                enabled = canMoveUp,
                modifier = Modifier.size(32.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.KeyboardArrowUp,
                    contentDescription = "Move Up",
                    tint = if (canMoveUp) colors.textSecondary else colors.border,
                    modifier = Modifier.size(18.dp)
                )
            }

            // Move Down Button
            IconButton(
                onClick = onMoveDown,
                enabled = canMoveDown,
                modifier = Modifier.size(32.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.KeyboardArrowDown,
                    contentDescription = "Move Down",
                    tint = if (canMoveDown) colors.textSecondary else colors.border,
                    modifier = Modifier.size(18.dp)
                )
            }

            // Remove Button
            IconButton(
                onClick = onRemove,
                modifier = Modifier.size(32.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Close,
                    contentDescription = "Remove from Queue",
                    tint = colors.textMuted,
                    modifier = Modifier.size(16.dp)
                )
            }
        }
    }
}
