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
import com.daddyizz.cyberpulse.core.model.Album
import com.daddyizz.cyberpulse.core.model.MusicSource
import com.daddyizz.cyberpulse.core.model.Track

@Composable
fun AlbumDetailScreen(
    albumId: String,
    musicRepository: MusicRepository,
    onBack: () -> Unit,
    onPlayQueue: (List<Track>, Int) -> Unit,
    onArtistSelect: (String) -> Unit,
    onTrackAction: ((Track) -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    val colors = LocalCyberPulseColors.current

    var album by remember { mutableStateOf<Album?>(null) }
    var isLoading by remember { mutableStateOf(true) }
    var notice by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(albumId) {
        isLoading = true
        val res = musicRepository.metadataRepository.getAlbum(albumId)
        if (res is AppResult.Success) {
            album = res.data
        }
        isLoading = false
    }

    Box(modifier = modifier.fillMaxSize().background(colors.background)) {
        if (isLoading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = colors.primaryAccent)
            }
        } else if (album == null) {
            Column(
                modifier = Modifier.fillMaxSize().padding(CyberSpacing.lg),
                verticalArrangement = Arrangement.Center,
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text("Album metadata not found", style = MaterialTheme.typography.titleLarge, color = colors.textPrimary)
                Spacer(modifier = Modifier.height(CyberSpacing.md))
                Button(onClick = onBack, colors = ButtonDefaults.buttonColors(containerColor = colors.primaryAccent)) {
                    Text("Go Back", color = Color.Black)
                }
            }
        } else {
            val alb = album!!
            val isYouTube = alb.source == MusicSource.YOUTUBE

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
                            keyName = alb.artworkKey,
                            modifier = Modifier
                                .size(200.dp)
                                .clip(RoundedCornerShape(CyberRadius.lg))
                                .border(1.dp, colors.border, RoundedCornerShape(CyberRadius.lg))
                        )
                        Spacer(modifier = Modifier.height(CyberSpacing.md))
                        Text(
                            text = if (isYouTube) "YOUTUBE PLAYLIST (COLLECTION ABSTRACTION)" else "LOCAL CATALOG ALBUM (DEMO)",
                            style = MaterialTheme.typography.labelSmall,
                            color = if (isYouTube) colors.secondaryAccent else colors.primaryAccent,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.height(CyberSpacing.xs))
                        Text(
                            text = alb.title,
                            style = MaterialTheme.typography.headlineMedium,
                            color = colors.textPrimary,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.height(CyberSpacing.xs))
                        Text(
                            text = if (isYouTube) "Curator: ${alb.artist}" else alb.artist,
                            style = MaterialTheme.typography.titleMedium,
                            color = colors.primaryAccent,
                            modifier = Modifier.clickable {
                                alb.artistId?.let { onArtistSelect(it) }
                            }
                        )
                        Spacer(modifier = Modifier.height(CyberSpacing.xs))
                        Text(
                            text = if (isYouTube) {
                                "${alb.tracksCount} Videos/Tracks (YouTube Collection)"
                            } else {
                                "${alb.releaseYear} • ${alb.tracksCount} Tracks (Demo LP)"
                            },
                            style = MaterialTheme.typography.bodySmall,
                            color = colors.textSecondary
                        )

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
                                    } else if (alb.tracks.isNotEmpty()) {
                                        onPlayQueue(alb.tracks, 0)
                                    }
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = colors.primaryAccent),
                                shape = RoundedCornerShape(CyberRadius.full)
                            ) {
                                Icon(Icons.Default.PlayArrow, contentDescription = "Play", tint = Color.Black)
                                Spacer(modifier = Modifier.width(CyberSpacing.xs))
                                Text("Play", color = Color.Black, fontWeight = FontWeight.Bold)
                            }

                            OutlinedButton(
                                onClick = {
                                    if (isYouTube) {
                                        notice = "CyberPulse does not extract unauthorized audio streams from YouTube. Audio playback is restricted to verified licensed catalog and local streams."
                                    } else if (alb.tracks.isNotEmpty()) {
                                        onPlayQueue(alb.tracks.shuffled(), 0)
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
                                    Text("OK", color = colors.textSecondary)
                                }
                            }
                        }
                    }
                }

                // Collection Abstraction Banner
                item {
                    Surface(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = CyberSpacing.screenHorizontal, vertical = CyberSpacing.xs),
                        color = colors.surfaceCard,
                        shape = RoundedCornerShape(CyberRadius.sm),
                        border = androidx.compose.foundation.BorderStroke(
                            1.dp,
                            if (isYouTube) colors.border else colors.textMuted.copy(alpha = 0.3f)
                        )
                    ) {
                        Column(modifier = Modifier.padding(CyberSpacing.sm)) {
                            Text(
                                text = if (isYouTube) "COLLECTION ABSTRACTION NOTE" else "LOCAL DEMO ALBUM",
                                style = MaterialTheme.typography.labelSmall,
                                color = if (isYouTube) colors.primaryAccent else colors.textMuted,
                                fontWeight = FontWeight.Bold
                            )
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = if (isYouTube) {
                                    "Curated YouTube playlist mapped into CyberPulse's album view abstraction. Not verified as an official studio album release."
                                } else {
                                    "Pre-packaged local demo catalog album for offline reference and test playback."
                                },
                                style = MaterialTheme.typography.bodySmall,
                                color = colors.textSecondary
                            )
                        }
                    }
                }

                item {
                    Spacer(modifier = Modifier.height(CyberSpacing.md))
                    Text(
                        text = "Tracks",
                        style = MaterialTheme.typography.titleMedium,
                        color = colors.textPrimary,
                        modifier = Modifier.padding(horizontal = CyberSpacing.screenHorizontal)
                    )
                    Spacer(modifier = Modifier.height(CyberSpacing.sm))
                }

                itemsIndexed(alb.tracks) { index, track ->
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
                                    onPlayQueue(alb.tracks, index)
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
