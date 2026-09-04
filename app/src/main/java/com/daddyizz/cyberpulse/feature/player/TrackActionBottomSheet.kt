package com.daddyizz.cyberpulse.feature.player

import android.content.Intent
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.daddyizz.cyberpulse.core.data.MusicRepository
import com.daddyizz.cyberpulse.core.designsystem.*
import com.daddyizz.cyberpulse.core.model.MusicSource
import com.daddyizz.cyberpulse.core.model.Track
import com.daddyizz.cyberpulse.core.player.PlaybackCapability
import com.daddyizz.cyberpulse.core.player.PlaybackSourceResolver

/**
 * TrackActionBottomSheet: Comprehensive overflow menu for any track.
 * Supports Play Now, Play Next, Add to Queue, Like/Unlike, Add to Playlist,
 * Artist & Album navigation, Source Information, and Share.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TrackActionBottomSheet(
    track: Track,
    playerViewModel: PlayerViewModel,
    musicRepository: MusicRepository,
    onDismiss: () -> Unit,
    onNavigateToArtist: ((String) -> Unit)? = null,
    onNavigateToAlbum: ((String) -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    val colors = LocalCyberPulseColors.current
    val context = LocalContext.current
    val capability = PlaybackSourceResolver.getCapability(track)
    val isLiked by remember(track.id) {
        derivedStateOf { musicRepository.isTrackLiked(track.id) }
    }

    var showPlaylistPicker by remember { mutableStateOf(false) }
    var showSourceInfoDialog by remember { mutableStateOf(false) }
    val userPlaylists by musicRepository.userPlaylists.collectAsState()

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
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = CyberSpacing.screenHorizontal, vertical = CyberSpacing.sm)
        ) {
            // Track Header Card
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = CyberSpacing.md),
                verticalAlignment = Alignment.CenterVertically
            ) {
                CyberArtworkPlaceholder(
                    keyName = track.placeholderArtworkKey,
                    modifier = Modifier
                        .size(54.dp)
                        .clip(RoundedCornerShape(CyberRadius.sm))
                )
                Spacer(modifier = Modifier.width(CyberSpacing.md))
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = track.title,
                        style = MaterialTheme.typography.titleLarge,
                        color = colors.textPrimary,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Text(
                        text = "${track.artist} • ${track.album}",
                        style = MaterialTheme.typography.bodyMedium,
                        color = colors.textSecondary,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }

            HorizontalDivider(color = colors.border.copy(alpha = 0.5f))
            Spacer(modifier = Modifier.height(CyberSpacing.xs))

            if (showPlaylistPicker) {
                // Playlist selection sub-view
                Text(
                    text = "Add to Playlist",
                    style = MaterialTheme.typography.titleMedium,
                    color = colors.primaryAccent,
                    modifier = Modifier.padding(vertical = CyberSpacing.sm)
                )

                if (userPlaylists.isEmpty()) {
                    Text(
                        text = "No user playlists created yet.",
                        style = MaterialTheme.typography.bodySmall,
                        color = colors.textMuted
                    )
                    TextButton(
                        onClick = {
                            val newPl = musicRepository.createPlaylist("My Cyber Pulse")
                            musicRepository.addTrackToPlaylist(newPl.id, track)
                            playerViewModel.showSnackbar("Created playlist and added “${track.title}”")
                            onDismiss()
                        }
                    ) {
                        Text("Create “My Cyber Pulse” and Add", color = colors.primaryAccent)
                    }
                } else {
                    LazyColumn(modifier = Modifier.fillMaxWidth().heightIn(max = 200.dp)) {
                        items(userPlaylists.size) { idx ->
                            val pl = userPlaylists[idx]
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable {
                                        musicRepository.addTrackToPlaylist(pl.id, track)
                                        playerViewModel.showSnackbar("Added to “${pl.title}”")
                                        onDismiss()
                                    }
                                    .padding(vertical = CyberSpacing.sm),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(Icons.Default.PlaylistAdd, contentDescription = null, tint = colors.primaryAccent)
                                Spacer(modifier = Modifier.width(CyberSpacing.sm))
                                Text(pl.title, color = colors.textPrimary, style = MaterialTheme.typography.bodyMedium)
                            }
                        }
                    }
                }

                TextButton(onClick = { showPlaylistPicker = false }) {
                    Text("Back to actions", color = colors.textSecondary)
                }
            } else {
                // Main Track Actions List
                if (capability == PlaybackCapability.SUPPORTED_OFFICIAL) {
                    ActionRow(
                        icon = Icons.Default.PlayArrow,
                        title = "Play Now",
                        onClick = {
                            playerViewModel.selectTrack(track)
                            onDismiss()
                        }
                    )
                    ActionRow(
                        icon = Icons.Default.FastForward,
                        title = "Play Next",
                        onClick = {
                            playerViewModel.playNext(track)
                            onDismiss()
                        }
                    )
                    ActionRow(
                        icon = Icons.Default.QueueMusic,
                        title = "Add to Queue",
                        onClick = {
                            playerViewModel.addToQueue(track)
                            onDismiss()
                        }
                    )
                } else {
                    ActionRow(
                        icon = Icons.Default.OpenInNew,
                        title = "External Source (YouTube Discovery)",
                        subtitle = "Playback not supported inside CyberPulse",
                        onClick = {
                            showSourceInfoDialog = true
                        }
                    )
                }

                ActionRow(
                    icon = if (isLiked) Icons.Default.Favorite else Icons.Default.FavoriteBorder,
                    title = if (isLiked) "Remove from Liked Songs" else "Save to Liked Songs",
                    iconTint = if (isLiked) colors.tertiaryAccent else colors.textPrimary,
                    onClick = {
                        playerViewModel.toggleFavorite(track)
                        onDismiss()
                    }
                )

                ActionRow(
                    icon = Icons.Default.PlaylistAdd,
                    title = "Add to Playlist",
                    onClick = { showPlaylistPicker = true }
                )

                if (onNavigateToArtist != null && track.artistId != null) {
                    ActionRow(
                        icon = Icons.Default.Person,
                        title = "Go to Artist: ${track.artist}",
                        onClick = {
                            onNavigateToArtist(track.artistId)
                            onDismiss()
                        }
                    )
                }

                if (onNavigateToAlbum != null && track.albumId != null) {
                    ActionRow(
                        icon = Icons.Default.Album,
                        title = "Go to Album: ${track.album}",
                        onClick = {
                            onNavigateToAlbum(track.albumId)
                            onDismiss()
                        }
                    )
                }

                ActionRow(
                    icon = Icons.Default.Info,
                    title = "Audio Source Details",
                    onClick = { showSourceInfoDialog = true }
                )

                ActionRow(
                    icon = Icons.Default.Share,
                    title = "Share Track",
                    onClick = {
                        val sendIntent: Intent = Intent().apply {
                            action = Intent.ACTION_SEND
                            putExtra(Intent.EXTRA_TEXT, "Pulsing to “${track.title}” by ${track.artist} on CyberPulse Music.")
                            type = "text/plain"
                        }
                        val shareIntent = Intent.createChooser(sendIntent, null)
                        context.startActivity(shareIntent)
                        onDismiss()
                    }
                )
            }

            Spacer(modifier = Modifier.height(CyberSpacing.lg))
        }
    }

    if (showSourceInfoDialog) {
        AlertDialog(
            onDismissRequest = { showSourceInfoDialog = false },
            containerColor = colors.surfaceElevated,
            title = {
                Text("Audio Source Architecture", style = MaterialTheme.typography.titleLarge, color = colors.textPrimary)
            },
            text = {
                Column {
                    Text(
                        text = "Source: ${track.source.name}",
                        style = MaterialTheme.typography.titleMedium,
                        color = colors.primaryAccent,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(CyberSpacing.xs))
                    when (track.source) {
                        MusicSource.LOCAL_DEMO -> {
                            Text(
                                text = "This track is powered by CyberPulse's native AndroidX Media3 playback engine with official lossless demo streams.",
                                style = MaterialTheme.typography.bodyMedium,
                                color = colors.textSecondary
                            )
                        }
                        MusicSource.YOUTUBE -> {
                            Text(
                                text = "This item is from the YouTube Data API metadata discovery abstraction. In compliance with YouTube Terms of Service and copyright law, CyberPulse does not extract unauthorized audio streams from YouTube.",
                                style = MaterialTheme.typography.bodyMedium,
                                color = colors.textSecondary
                            )
                        }
                        else -> {
                            Text(
                                text = "Standard digital audio stream verified by CyberPulse.",
                                style = MaterialTheme.typography.bodyMedium,
                                color = colors.textSecondary
                            )
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = { showSourceInfoDialog = false }) {
                    Text("OK", color = colors.primaryAccent)
                }
            }
        )
    }
}

@Composable
private fun ActionRow(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    title: String,
    subtitle: String? = null,
    iconTint: androidx.compose.ui.graphics.Color? = null,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val colors = LocalCyberPulseColors.current
    Row(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(CyberRadius.xs))
            .clickable(onClick = onClick)
            .padding(vertical = CyberSpacing.sm, horizontal = CyberSpacing.xs),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = icon,
            contentDescription = title,
            tint = iconTint ?: colors.textPrimary,
            modifier = Modifier.size(24.dp)
        )
        Spacer(modifier = Modifier.width(CyberSpacing.md))
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = title,
                style = MaterialTheme.typography.titleMedium,
                color = colors.textPrimary
            )
            if (subtitle != null) {
                Text(
                    text = subtitle,
                    style = MaterialTheme.typography.bodySmall,
                    color = colors.textMuted
                )
            }
        }
    }
}
