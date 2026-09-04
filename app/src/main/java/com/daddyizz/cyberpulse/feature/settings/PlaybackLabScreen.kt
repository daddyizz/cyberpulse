package com.daddyizz.cyberpulse.feature.settings

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.media3.common.Player
import com.daddyizz.cyberpulse.core.designsystem.*
import com.daddyizz.cyberpulse.core.player.CyberPulseTestMedia
import com.daddyizz.cyberpulse.feature.player.PlayerViewModel

/**
 * PlaybackLabScreen
 *
 * Internal Developer & Verification harness for Block 3A AndroidX Media3 engine.
 * Allows playing certified test tracks, inspecting MediaLibraryService state,
 * verifying MediaController commands, and inspecting real queue items.
 */
@Composable
fun PlaybackLabScreen(
    playerViewModel: PlayerViewModel,
    onBackClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val playerState by playerViewModel.uiState.collectAsState()
    val colors = LocalCyberPulseColors.current

    Column(
        modifier = modifier
            .fillMaxSize()
            .statusBarsPadding()
    ) {
        CyberTopBar(
            title = "Playback Lab (Block 3A)",
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
            contentPadding = PaddingValues(bottom = 80.dp),
            verticalArrangement = Arrangement.spacedBy(CyberSpacing.md)
        ) {
            // Section 1: Engine Diagnostics Card
            item {
                CyberCard(modifier = Modifier.fillMaxWidth()) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "ENGINE DIAGNOSTICS",
                            style = MaterialTheme.typography.labelMedium.copy(
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 1.sp
                            ),
                            color = colors.primaryAccent
                        )
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(8.dp)
                                    .clip(RoundedCornerShape(CyberRadius.full))
                                    .background(if (playerState.isPlaying) colors.primaryAccent else colors.textMuted)
                            )
                            Spacer(modifier = Modifier.width(CyberSpacing.xs))
                            Text(
                                text = if (playerState.isPlaying) "ACTIVE" else "READY / IDLE",
                                style = MaterialTheme.typography.labelSmall,
                                color = if (playerState.isPlaying) colors.primaryAccent else colors.textMuted
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(CyberSpacing.sm))

                    DiagnosticRow(label = "Session Service", value = "CyberPulsePlaybackService (Media3)")
                    DiagnosticRow(label = "Connection State", value = playerState.connectionState.name)
                    DiagnosticRow(label = "Notification Channel", value = "cyberpulse_media_playback (Low)")
                    DiagnosticRow(
                        label = "State",
                        value = when (playerState.playbackState) {
                            Player.STATE_BUFFERING -> "BUFFERING"
                            Player.STATE_READY -> if (playerState.isPlaying) "PLAYING" else "PAUSED"
                            Player.STATE_ENDED -> "ENDED"
                            Player.STATE_IDLE -> "IDLE"
                            else -> "UNKNOWN"
                        }
                    )
                    DiagnosticRow(
                        label = "Active Media ID",
                        value = playerState.currentTrack?.id ?: "None (Session Unloaded)"
                    )
                    DiagnosticRow(
                        label = "Track Title",
                        value = playerState.currentTrack?.title ?: "None"
                    )
                    DiagnosticRow(
                        label = "Position / Duration",
                        value = "%02d:%02d / %02d:%02d".format(
                            playerState.currentPositionSeconds / 60,
                            playerState.currentPositionSeconds % 60,
                            playerState.durationSeconds / 60,
                            playerState.durationSeconds % 60
                        )
                    )
                    DiagnosticRow(
                        label = "Queue Size",
                        value = "${playerState.queue.size} item(s)"
                    )
                    DiagnosticRow(
                        label = "Repeat Mode",
                        value = when (playerState.repeatMode) {
                            Player.REPEAT_MODE_ALL -> "REPEAT_ALL"
                            Player.REPEAT_MODE_ONE -> "REPEAT_ONE"
                            else -> "OFF"
                        }
                    )
                    DiagnosticRow(
                        label = "Shuffle",
                        value = if (playerState.isShuffleEnabled) "ENABLED" else "OFF"
                    )
                }
            }

            // Section 2: Interactive Controls Card
            item {
                CyberCard(modifier = Modifier.fillMaxWidth()) {
                    Text(
                        text = "CONTROLLER COMMANDS",
                        style = MaterialTheme.typography.labelMedium.copy(
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 1.sp
                        ),
                        color = colors.secondaryAccent
                    )
                    Spacer(modifier = Modifier.height(CyberSpacing.sm))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceEvenly,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        IconButton(onClick = { playerViewModel.skipPrevious() }) {
                            Icon(Icons.Default.SkipPrevious, "Previous", tint = colors.textPrimary)
                        }
                        IconButton(onClick = { playerViewModel.seekTo(playerState.currentPositionSeconds - 10) }) {
                            Icon(Icons.Default.Replay10, "-10s", tint = colors.textPrimary)
                        }
                        Button(
                            onClick = { playerViewModel.togglePlayPause() },
                            colors = ButtonDefaults.buttonColors(containerColor = colors.primaryAccent)
                        ) {
                            Icon(
                                imageVector = if (playerState.isPlaying) Icons.Default.Pause else Icons.Default.PlayArrow,
                                contentDescription = if (playerState.isPlaying) "Pause" else "Play",
                                tint = colors.background
                            )
                            Spacer(modifier = Modifier.width(CyberSpacing.xs))
                            Text(
                                text = if (playerState.isPlaying) "Pause" else "Play",
                                color = colors.background
                            )
                        }
                        IconButton(onClick = { playerViewModel.seekTo(playerState.currentPositionSeconds + 10) }) {
                            Icon(Icons.Default.Forward10, "+10s", tint = colors.textPrimary)
                        }
                        IconButton(onClick = { playerViewModel.skipNext() }) {
                            Icon(Icons.Default.SkipNext, "Next", tint = colors.textPrimary)
                        }
                    }

                    Spacer(modifier = Modifier.height(CyberSpacing.xs))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        OutlinedButton(onClick = { playerViewModel.toggleShuffle() }) {
                            Text(
                                text = if (playerState.isShuffleEnabled) "Shuffle: ON" else "Shuffle: OFF",
                                style = MaterialTheme.typography.labelSmall
                            )
                        }
                        OutlinedButton(onClick = { playerViewModel.toggleRepeat() }) {
                            Text(
                                text = "Repeat: ${if (playerState.isRepeatEnabled) "ON" else "OFF"}",
                                style = MaterialTheme.typography.labelSmall
                            )
                        }
                        OutlinedButton(onClick = { playerViewModel.clearQueue() }) {
                            Text(
                                text = "Clear Queue",
                                style = MaterialTheme.typography.labelSmall
                            )
                        }
                    }
                }
            }

            // Section 3: Test Catalog Header
            item {
                CyberSectionHeader(
                    title = "CYBERPULSE TEST CATALOG",
                    actionLabel = "Play All",
                    onActionClick = {
                        val first = CyberPulseTestMedia.ALL_TEST_TRACKS.first()
                        playerViewModel.selectTrack(first, CyberPulseTestMedia.ALL_TEST_TRACKS)
                    }
                )
            }

            // Test Tracks List
            items(CyberPulseTestMedia.ALL_TEST_TRACKS) { track ->
                val isCurrent = playerState.currentTrack?.id == track.id
                CyberCard(
                    modifier = Modifier
                        .fillMaxWidth()
                        .border(
                            width = if (isCurrent) 1.5.dp else 0.5.dp,
                            color = if (isCurrent) colors.primaryAccent else colors.border,
                            shape = RoundedCornerShape(CyberRadius.md)
                        )
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(
                            modifier = Modifier.weight(1f),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            CyberArtworkPlaceholder(
                                keyName = track.placeholderArtworkKey,
                                modifier = Modifier.size(44.dp),
                                shape = RoundedCornerShape(CyberRadius.sm)
                            )
                            Spacer(modifier = Modifier.width(CyberSpacing.sm))
                            Column {
                                Text(
                                    text = track.title,
                                    style = MaterialTheme.typography.titleMedium,
                                    color = if (isCurrent) colors.primaryAccent else colors.textPrimary
                                )
                                Text(
                                    text = "${track.album} • ${track.durationSeconds}s",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = colors.textSecondary
                                )
                            }
                        }

                        Row(verticalAlignment = Alignment.CenterVertically) {
                            IconButton(
                                onClick = {
                                    playerViewModel.selectTrack(track, CyberPulseTestMedia.ALL_TEST_TRACKS)
                                }
                            ) {
                                Icon(
                                    imageVector = if (isCurrent && playerState.isPlaying) Icons.Default.Pause else Icons.Default.PlayArrow,
                                    contentDescription = "Play track",
                                    tint = colors.primaryAccent
                                )
                            }
                        }
                    }
                }
            }

            // Section 4: Policy & Architecture Compliance Card
            item {
                CyberSectionHeader(title = "Policy & Architecture Audit")
                CyberCard(modifier = Modifier.fillMaxWidth()) {
                    ComplianceRow(rule = "YouTube Unofficial Audio Extraction", status = "PROHIBITED (Enforced)")
                    ComplianceRow(rule = "AndroidX Media3 MediaLibraryService", status = "AUTHORITATIVE")
                    ComplianceRow(rule = "Background Playback / Focus", status = "COMPLIANT")
                    ComplianceRow(rule = "Media Notification & Lock Screen", status = "CONFIGURED")
                    ComplianceRow(rule = "Bluetooth / Headset Disconnect", status = "PAUSE ON NOISY")
                    ComplianceRow(rule = "Transient Interruption Policy", status = "USER INTENT PRECEDENCE")
                    ComplianceRow(rule = "Cold Process Recreation", status = "RESTORE PAUSED")
                    ComplianceRow(rule = "Network Error Recovery", status = "EXPONENTIAL BACKOFF")
                }
            }
        }
    }
}

@Composable
private fun DiagnosticRow(label: String, value: String) {
    val colors = LocalCyberPulseColors.current
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 2.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(text = label, style = MaterialTheme.typography.bodySmall, color = colors.textSecondary)
        Text(
            text = value,
            style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.Medium),
            color = colors.textPrimary
        )
    }
}

@Composable
private fun ComplianceRow(rule: String, status: String) {
    val colors = LocalCyberPulseColors.current
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(text = rule, style = MaterialTheme.typography.bodySmall, color = colors.textSecondary)
        Text(
            text = status,
            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
            color = colors.primaryAccent
        )
    }
}
