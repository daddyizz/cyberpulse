package com.daddyizz.cyberpulse.feature.details

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.daddyizz.cyberpulse.core.common.AppResult
import com.daddyizz.cyberpulse.core.data.MusicRepository
import com.daddyizz.cyberpulse.core.designsystem.*
import com.daddyizz.cyberpulse.core.model.MusicSource
import com.daddyizz.cyberpulse.core.model.Playlist
import com.daddyizz.cyberpulse.core.model.Track

@Composable
fun PlaylistDetailScreen(
    playlistId: String,
    musicRepository: MusicRepository,
    onBack: () -> Unit,
    onPlayQueue: (List<Track>, Int) -> Unit,
    onTrackAction: ((Track) -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    val colors = LocalCyberPulseColors.current

    var playlist by remember { mutableStateOf<Playlist?>(null) }
    var isLoading by remember { mutableStateOf(true) }
    var notice by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(playlistId) {
        isLoading = true
        val res = musicRepository.metadataRepository.getPlaylist(playlistId)
        if (res is AppResult.Success) {
            playlist = res.data
        }
        isLoading = false
    }

    Box(modifier = modifier.fillMaxSize().background(colors.background)) {
        if (isLoading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = colors.primaryAccent)
            }
        } else if (playlist == null) {
            Column(
                modifier = Modifier.fillMaxSize().padding(CyberSpacing.lg),
                verticalArrangement = Arrangement.Center,
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text("Playlist metadata unavailable", style = MaterialTheme.typography.titleLarge, color = colors.textPrimary)
                Spacer(modifier = Modifier.height(CyberSpacing.md))
                Button(onClick = onBack, colors = ButtonDefaults.buttonColors(containerColor = colors.primaryAccent)) {
                    Text("Go Back", color = Color.Black)
                }
            }
        } else {
            val pl = playlist!!
            val isYouTube = pl.source == MusicSource.YOUTUBE

            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(bottom = 100.dp)
            ) {
                item {
                    Spacer(modifier = Modifier.height(60.dp))
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = CyberSpacing.screenHorizontal),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        CyberArtworkPlaceholder(
                            keyName = pl.artworkKey,
                            modifier = Modifier
                                .size(200.dp)
                                .clip(RoundedCornerShape(CyberRadius.lg))
                                .border(1.dp, colors.border, RoundedCornerShape(CyberRadius.lg))
                        )
                        Spacer(modifier = Modifier.height(CyberSpacing.md))
                        Text(
                            text = if (isYouTube) "YOUTUBE PUBLIC PLAYLIST (DISCOVERY)" else "LOCAL DEMO PLAYLIST",
                            style = MaterialTheme.typography.labelSmall,
                            color = if (isYouTube) colors.secondaryAccent else colors.primaryAccent,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.height(CyberSpacing.xs))
                        Text(
                            text = pl.title,
                            style = MaterialTheme.typography.headlineMedium,
                            color = colors.textPrimary,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.height(CyberSpacing.xs))
                        Text(
                            text = "Curated by ${pl.createdBy}",
                            style = MaterialTheme.typography.titleSmall,
                            color = colors.textSecondary
                        )
                        if (pl.description.isNotBlank()) {
                            Spacer(modifier = Modifier.height(CyberSpacing.xs))
                            Text(
                                text = pl.description,
                                style = MaterialTheme.typography.bodySmall,
                                color = colors.textMuted
                            )
                        }

                        Spacer(modifier = Modifier.height(CyberSpacing.md))

                        // Controls: Play All & Shuffle
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(CyberSpacing.md),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Button(
                                onClick = {
                                    if (isYouTube) {
                                        notice = "CyberPulse does not extract unauthorized audio streams from YouTube. Audio playback is restricted to verified licensed catalog and local streams."
                                    } else if (pl.tracks.isNotEmpty()) {
                                        onPlayQueue(pl.tracks, 0)
                                    }
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = colors.primaryAccent),
                                shape = RoundedCornerShape(CyberRadius.full)
                            ) {
                                Icon(Icons.Default.PlayArrow, contentDescription = "Play", tint = Color.Black)
                                Spacer(modifier = Modifier.width(CyberSpacing.xs))
                                Text("Play All", color = Color.Black, fontWeight = FontWeight.Bold)
                            }

                            OutlinedButton(
                                onClick = {
                                    if (isYouTube) {
                                        notice = "CyberPulse does not extract unauthorized audio streams from YouTube. Audio playback is restricted to verified licensed catalog and local streams."
                                    } else if (pl.tracks.isNotEmpty()) {
                                        onPlayQueue(pl.tracks.shuffled(), 0)
                                    }
                                },
                                colors = ButtonDefaults.outlinedButtonColors(contentColor = colors.textPrimary),
                                border = androidx.compose.foundation.BorderStroke(1.dp, colors.border),
                                shape = RoundedCornerShape(CyberRadius.full)
                            ) {
                                Icon(Icons.Default.Shuffle, contentDescription = null, tint = colors.textSecondary)
                                Spacer(modifier = Modifier.width(CyberSpacing.xs))
                                Text("Shuffle")
                            }
                        }
                    }
                }

                if (notice != null) {
                    item {
                        Surface(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = CyberSpacing.screenHorizontal, vertical = CyberSpacing.md),
                            color = colors.surfaceElevated,
                            shape = RoundedCornerShape(CyberRadius.md),
                            border = androidx.compose.foundation.BorderStroke(1.dp, colors.secondaryAccent)
                        ) {
                            Row(
                                modifier = Modifier.padding(CyberSpacing.md),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(Icons.Default.Info, contentDescription = null, tint = colors.secondaryAccent)
                                Spacer(modifier = Modifier.width(CyberSpacing.sm))
                                Text(
                                    text = notice!!,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = colors.textPrimary,
                                    modifier = Modifier.weight(1f)
                                )
                                TextButton(onClick = { notice = null }) {
                                    Text("Dismiss", color = colors.textSecondary)
                                }
                            }
                        }
                    }
                }

                item {
                    Spacer(modifier = Modifier.height(CyberSpacing.md))
                    Text(
                        text = "Tracks (${pl.tracks.size})",
                        style = MaterialTheme.typography.titleMedium,
                        color = colors.textPrimary,
                        modifier = Modifier.padding(horizontal = CyberSpacing.screenHorizontal)
                    )
                    Spacer(modifier = Modifier.height(CyberSpacing.sm))
                }

                itemsIndexed(pl.tracks) { index, track ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = CyberSpacing.screenHorizontal, vertical = CyberSpacing.xs)
                            .clip(RoundedCornerShape(CyberRadius.md))
                            .background(colors.surfaceCard)
                            .clickable {
                                if (isYouTube) {
                                    notice = "CyberPulse does not extract unauthorized audio streams from YouTube. Audio playback is restricted to verified licensed catalog and local streams."
                                } else {
                                    onPlayQueue(pl.tracks, index)
                                }
                            }
                            .padding(horizontal = CyberSpacing.md, vertical = CyberSpacing.sm),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "${index + 1}",
                            style = MaterialTheme.typography.bodyMedium,
                            color = colors.textMuted,
                            modifier = Modifier.width(28.dp)
                        )
                        Column(modifier = Modifier.weight(1f)) {
                            Text(track.title, style = MaterialTheme.typography.titleMedium, color = colors.textPrimary)
                            Text(track.artist, style = MaterialTheme.typography.bodySmall, color = colors.textSecondary)
                        }
                        Text(track.formattedDuration, style = MaterialTheme.typography.labelSmall, color = colors.textMuted)

                        if (onTrackAction != null) {
                            IconButton(onClick = { onTrackAction(track) }) {
                                Icon(
                                    imageVector = Icons.Default.MoreVert,
                                    contentDescription = "Track Actions",
                                    tint = colors.textMuted
                                )
                            }
                        }
                    }
                }
            }
        }

        IconButton(
            onClick = onBack,
            modifier = Modifier
                .padding(top = 16.dp, start = 16.dp)
                .size(44.dp)
                .clip(CircleShape)
                .background(Color.Black.copy(alpha = 0.6f))
        ) {
            Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = Color.White)
        }
    }
}
