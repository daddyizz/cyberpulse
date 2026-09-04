package com.daddyizz.cyberpulse.feature.details

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.daddyizz.cyberpulse.core.common.AppResult
import com.daddyizz.cyberpulse.core.data.MusicRepository
import com.daddyizz.cyberpulse.core.designsystem.*
import com.daddyizz.cyberpulse.core.model.Album
import com.daddyizz.cyberpulse.core.model.Artist
import com.daddyizz.cyberpulse.core.model.MusicSource
import com.daddyizz.cyberpulse.core.model.Track
import kotlinx.coroutines.launch

@Composable
fun ArtistDetailScreen(
    artistId: String,
    musicRepository: MusicRepository,
    onBack: () -> Unit,
    onPlayQueue: (List<Track>, Int) -> Unit,
    onAlbumSelect: (String) -> Unit,
    onTrackAction: ((Track) -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    val colors = LocalCyberPulseColors.current
    val scope = rememberCoroutineScope()

    var artist by remember { mutableStateOf<Artist?>(null) }
    var topTracks by remember { mutableStateOf<List<Track>>(emptyList()) }
    var albums by remember { mutableStateOf<List<Album>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var isFollowed by remember { mutableStateOf(false) }
    var playbackNotice by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(artistId) {
        isLoading = true
        val artRes = musicRepository.metadataRepository.getArtist(artistId)
        if (artRes is AppResult.Success) {
            artist = artRes.data
            isFollowed = artRes.data?.isFollowed ?: false
        }
        val tracksRes = musicRepository.metadataRepository.getArtistTopTracks(artistId)
        if (tracksRes is AppResult.Success) {
            topTracks = tracksRes.data
        }
        val albumsRes = musicRepository.metadataRepository.getArtistAlbums(artistId)
        if (albumsRes is AppResult.Success) {
            albums = albumsRes.data
        }
        isLoading = false
    }

    Box(modifier = modifier.fillMaxSize().background(colors.background)) {
        if (isLoading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = colors.primaryAccent)
            }
        } else if (artist == null) {
            Column(
                modifier = Modifier.fillMaxSize().padding(CyberSpacing.lg),
                verticalArrangement = Arrangement.Center,
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text("Artist metadata unavailable", style = MaterialTheme.typography.titleLarge, color = colors.textPrimary)
                Spacer(modifier = Modifier.height(CyberSpacing.md))
                Button(onClick = onBack, colors = ButtonDefaults.buttonColors(containerColor = colors.primaryAccent)) {
                    Text("Return", color = Color.Black)
                }
            }
        } else {
            val art = artist!!
            val isYouTube = art.source == MusicSource.YOUTUBE

            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(bottom = 100.dp)
            ) {
                // Hero Header
                item {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(280.dp)
                            .background(
                                Brush.verticalGradient(
                                    colors = listOf(
                                        colors.secondaryAccent.copy(alpha = 0.6f),
                                        colors.background
                                    )
                                )
                            )
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(CyberSpacing.screenHorizontal),
                            verticalArrangement = Arrangement.Bottom
                        ) {
                            Text(
                                text = if (isYouTube) "YOUTUBE CHANNEL • DISCOVERY ABSTRACTION" else "LOCAL CATALOG ARTIST (DEMO)",
                                style = MaterialTheme.typography.labelSmall,
                                color = if (isYouTube) colors.secondaryAccent else colors.primaryAccent,
                                fontWeight = FontWeight.Bold
                            )
                            Spacer(modifier = Modifier.height(CyberSpacing.xs))
                            Text(
                                text = art.name,
                                style = MaterialTheme.typography.headlineLarge,
                                color = colors.textPrimary,
                                fontWeight = FontWeight.Black
                            )
                            Spacer(modifier = Modifier.height(CyberSpacing.xs))
                            val audienceText = if (isYouTube) {
                                when {
                                    art.isSubscriberCountHidden -> "Subscribers: Hidden by Channel Creator"
                                    art.subscriberCount != null -> "${art.subscriberCount.formatListeners()} YouTube Channel Subscribers"
                                    else -> "Subscribers: Statistics Unavailable"
                                }
                            } else {
                                "${art.monthlyListeners.formatListeners()} Listeners (Simulated Local Demo Data)"
                            }
                            Text(
                                text = audienceText,
                                style = MaterialTheme.typography.bodyMedium,
                                color = colors.textSecondary
                            )
                            Spacer(modifier = Modifier.height(CyberSpacing.md))

                            // Action buttons
                            Row(
                                horizontalArrangement = Arrangement.spacedBy(CyberSpacing.md),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Button(
                                    onClick = {
                                        if (isYouTube) {
                                            playbackNotice = "CyberPulse does not extract unauthorized audio streams from YouTube. Audio playback is restricted to verified licensed catalog and local streams."
                                        } else if (topTracks.isNotEmpty()) {
                                            onPlayQueue(topTracks, 0)
                                        }
                                    },
                                    colors = ButtonDefaults.buttonColors(containerColor = colors.primaryAccent),
                                    shape = RoundedCornerShape(CyberRadius.full)
                                ) {
                                    Icon(Icons.Default.PlayArrow, contentDescription = "Play", tint = Color.Black)
                                    Spacer(modifier = Modifier.width(CyberSpacing.xs))
                                    Text("Play Top Pulse", color = Color.Black, fontWeight = FontWeight.Bold)
                                }

                                OutlinedButton(
                                    onClick = {
                                        isFollowed = !isFollowed
                                        scope.launch {
                                            musicRepository.metadataRepository.toggleFollowArtist(artistId)
                                        }
                                    },
                                    colors = ButtonDefaults.outlinedButtonColors(contentColor = colors.textPrimary),
                                    border = androidx.compose.foundation.BorderStroke(1.dp, colors.border),
                                    shape = RoundedCornerShape(CyberRadius.full)
                                ) {
                                    Icon(
                                        if (isFollowed) Icons.Default.Favorite else Icons.Default.FavoriteBorder,
                                        contentDescription = null,
                                        tint = if (isFollowed) colors.primaryAccent else colors.textMuted
                                    )
                                    Spacer(modifier = Modifier.width(CyberSpacing.xs))
                                    Text(if (isFollowed) "Following" else "Follow")
                                }
                            }
                        }
                    }
                }

                // Notice if clicked
                if (playbackNotice != null) {
                    item {
                        Surface(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = CyberSpacing.screenHorizontal, vertical = CyberSpacing.sm),
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
                                    text = playbackNotice!!,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = colors.textPrimary,
                                    modifier = Modifier.weight(1f)
                                )
                                TextButton(onClick = { playbackNotice = null }) {
                                    Text("Dismiss", color = colors.textSecondary)
                                }
                            }
                        }
                    }
                }

                // Source Compliance & Abstraction Disclaimer
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
                                text = if (isYouTube) "DISCOVERY ABSTRACTION NOTE" else "LOCAL DEMO PROFILE",
                                style = MaterialTheme.typography.labelSmall,
                                color = if (isYouTube) colors.secondaryAccent else colors.textMuted,
                                fontWeight = FontWeight.Bold
                            )
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = if (isYouTube) {
                                    "Profile mapped from public YouTube Channel metadata. Popular tracks reflect publicly indexed creator video uploads rather than an official studio discography."
                                } else {
                                    "Local demo catalog profile bundled for offline navigation and testing."
                                },
                                style = MaterialTheme.typography.bodySmall,
                                color = colors.textSecondary
                            )
                        }
                    }
                }

                // Bio
                if (!art.bio.isNullOrBlank()) {
                    item {
                        Column(modifier = Modifier.padding(horizontal = CyberSpacing.screenHorizontal, vertical = CyberSpacing.md)) {
                            Text("About", style = MaterialTheme.typography.titleMedium, color = colors.textPrimary)
                            Spacer(modifier = Modifier.height(CyberSpacing.xs))
                            Text(art.bio ?: "", style = MaterialTheme.typography.bodyMedium, color = colors.textSecondary)
                        }
                    }
                }

                // Top Tracks
                item {
                    Column(modifier = Modifier.padding(horizontal = CyberSpacing.screenHorizontal, vertical = CyberSpacing.md)) {
                        Text("Popular Pulses", style = MaterialTheme.typography.titleLarge, color = colors.textPrimary)
                        Spacer(modifier = Modifier.height(CyberSpacing.sm))
                    }
                }

                itemsIndexed(topTracks) { index, track ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = CyberSpacing.screenHorizontal, vertical = CyberSpacing.xs)
                            .clip(RoundedCornerShape(CyberRadius.md))
                            .background(colors.surfaceCard)
                            .border(1.dp, colors.border, RoundedCornerShape(CyberRadius.md))
                            .clickable {
                                if (isYouTube) {
                                    playbackNotice = "CyberPulse does not extract unauthorized audio streams from YouTube. Audio playback is restricted to verified licensed catalog and local streams."
                                } else {
                                    onPlayQueue(topTracks, index)
                                }
                            }
                            .padding(CyberSpacing.md),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        CyberArtworkPlaceholder(
                            keyName = track.placeholderArtworkKey,
                            modifier = Modifier.size(44.dp)
                        )
                        Spacer(modifier = Modifier.width(CyberSpacing.md))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(track.title, style = MaterialTheme.typography.titleMedium, color = colors.textPrimary)
                            Text(track.album, style = MaterialTheme.typography.bodySmall, color = colors.textSecondary)
                        }
                        Text(track.formattedDuration, style = MaterialTheme.typography.labelSmall, color = colors.textMuted)
                        Spacer(modifier = Modifier.width(CyberSpacing.sm))

                        if (onTrackAction != null) {
                            IconButton(onClick = { onTrackAction(track) }) {
                                Icon(
                                    imageVector = Icons.Default.MoreVert,
                                    contentDescription = "Track Options",
                                    tint = colors.textMuted
                                )
                            }
                        } else {
                            Icon(Icons.Default.PlayArrow, contentDescription = "Play", tint = colors.primaryAccent)
                        }
                    }
                }

                // Albums
                if (albums.isNotEmpty()) {
                    item {
                        Column(modifier = Modifier.padding(top = CyberSpacing.lg, bottom = CyberSpacing.sm)) {
                            Text(
                                text = "Discography",
                                style = MaterialTheme.typography.titleLarge,
                                color = colors.textPrimary,
                                modifier = Modifier.padding(horizontal = CyberSpacing.screenHorizontal)
                            )
                            Spacer(modifier = Modifier.height(CyberSpacing.sm))
                            LazyRow(
                                horizontalArrangement = Arrangement.spacedBy(CyberSpacing.md),
                                contentPadding = PaddingValues(horizontal = CyberSpacing.screenHorizontal)
                            ) {
                                items(albums) { album ->
                                    CyberMediaCard(
                                        title = album.title,
                                        subtitle = "${album.releaseYear} • ${album.tracksCount} tracks",
                                        artworkKey = album.artworkKey,
                                        badge = if (isYouTube) "YOUTUBE" else "DEMO",
                                        onClick = { onAlbumSelect(album.id) }
                                    )
                                }
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
