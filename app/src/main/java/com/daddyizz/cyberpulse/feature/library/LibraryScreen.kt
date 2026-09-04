package com.daddyizz.cyberpulse.feature.library

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
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.daddyizz.cyberpulse.core.data.MusicRepository
import com.daddyizz.cyberpulse.core.designsystem.*
import com.daddyizz.cyberpulse.core.model.Playlist
import com.daddyizz.cyberpulse.core.model.Track

@Composable
fun LibraryScreen(
    musicRepository: MusicRepository,
    onPlayQueue: (List<Track>, Int) -> Unit,
    onPlaylistClick: (Playlist) -> Unit,
    onTrackAction: ((Track) -> Unit)? = null,
    onNavigateToOnThisDevice: () -> Unit = {},
    onNavigateToCyberRadio: () -> Unit = {},
    modifier: Modifier = Modifier
) {
    val colors = LocalCyberPulseColors.current

    val likedTrackIds by musicRepository.likedTrackIds.collectAsState()
    val likedTracks = remember(likedTrackIds) { musicRepository.getLikedTracks() }
    val recentlyPlayed by musicRepository.recentlyPlayed.collectAsState()
    val userPlaylists by musicRepository.userPlaylists.collectAsState()

    var selectedFilter by remember { mutableStateOf("All") }
    val filters = listOf("All", "Liked Songs", "Recently Played", "Playlists")

    var showCreatePlaylistDialog by remember { mutableStateOf(false) }
    var newPlaylistName by remember { mutableStateOf("") }

    Box(modifier = modifier.fillMaxSize().background(colors.background)) {
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = CyberSpacing.screenHorizontal),
            contentPadding = PaddingValues(bottom = 110.dp)
        ) {
            item {
                Spacer(modifier = Modifier.height(CyberSpacing.lg))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Your Library",
                        style = MaterialTheme.typography.headlineLarge,
                        color = colors.textPrimary,
                        fontWeight = FontWeight.Bold
                    )
                    IconButton(
                        onClick = { showCreatePlaylistDialog = true },
                        modifier = Modifier.size(44.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Add,
                            contentDescription = "Create Playlist",
                            tint = colors.primaryAccent
                        )
                    }
                }

                Spacer(modifier = Modifier.height(CyberSpacing.md))

                // Fast Source Access Cards: On This Device & Cyber Radio
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Surface(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(CyberRadius.md))
                            .clickable(onClick = onNavigateToOnThisDevice)
                            .border(1.dp, colors.primaryAccent.copy(alpha = 0.4f), RoundedCornerShape(CyberRadius.md)),
                        color = colors.surfaceElevated
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(36.dp)
                                    .background(colors.primaryAccent.copy(alpha = 0.15f), CircleShape),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(Icons.Default.SdCard, contentDescription = null, tint = colors.primaryAccent, modifier = Modifier.size(20.dp))
                            }
                            Spacer(modifier = Modifier.width(10.dp))
                            Column {
                                Text("On This Device", color = colors.textPrimary, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                                Text("Local Audio", color = colors.textSecondary, fontSize = 11.sp)
                            }
                        }
                    }

                    Surface(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(CyberRadius.md))
                            .clickable(onClick = onNavigateToCyberRadio)
                            .border(1.dp, colors.neonPink.copy(alpha = 0.4f), RoundedCornerShape(CyberRadius.md)),
                        color = colors.surfaceElevated
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(36.dp)
                                    .background(colors.neonPink.copy(alpha = 0.15f), CircleShape),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(Icons.Default.Radio, contentDescription = null, tint = colors.neonPink, modifier = Modifier.size(20.dp))
                            }
                            Spacer(modifier = Modifier.width(10.dp))
                            Column {
                                Text("Cyber Radio", color = colors.textPrimary, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                                Text("Live Streams", color = colors.textSecondary, fontSize = 11.sp)
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(CyberSpacing.md))

                // Filter Chips
                LazyRow(horizontalArrangement = Arrangement.spacedBy(CyberSpacing.sm)) {
                    items(filters) { filter ->
                        CyberChip(
                            text = filter,
                            isSelected = selectedFilter == filter,
                            onToggle = { selectedFilter = filter }
                        )
                    }
                }

                Spacer(modifier = Modifier.height(CyberSpacing.lg))
            }

            // Section: Liked Songs
            if (selectedFilter == "All" || selectedFilter == "Liked Songs") {
                item {
                    Surface(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(CyberRadius.md))
                            .border(1.dp, colors.tertiaryAccent.copy(alpha = 0.5f), RoundedCornerShape(CyberRadius.md)),
                        color = colors.surfaceElevated
                    ) {
                        Column(modifier = Modifier.padding(CyberSpacing.md)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(54.dp)
                                        .clip(RoundedCornerShape(CyberRadius.sm))
                                        .background(colors.tertiaryAccent),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Favorite,
                                        contentDescription = "Liked",
                                        tint = colors.textPrimary,
                                        modifier = Modifier.size(28.dp)
                                    )
                                }
                                Spacer(modifier = Modifier.width(CyberSpacing.md))
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = "Liked Songs",
                                        style = MaterialTheme.typography.titleLarge,
                                        color = colors.textPrimary,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Text(
                                        text = "${likedTracks.size} songs saved to your pulse",
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = colors.textSecondary
                                    )
                                }
                            }

                            if (likedTracks.isNotEmpty()) {
                                Spacer(modifier = Modifier.height(CyberSpacing.md))
                                Row(
                                    horizontalArrangement = Arrangement.spacedBy(CyberSpacing.sm),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Button(
                                        onClick = { onPlayQueue(likedTracks, 0) },
                                        colors = ButtonDefaults.buttonColors(containerColor = colors.primaryAccent),
                                        shape = RoundedCornerShape(CyberRadius.full)
                                    ) {
                                        Icon(Icons.Default.PlayArrow, contentDescription = null, tint = Color.Black)
                                        Spacer(modifier = Modifier.width(CyberSpacing.xs))
                                        Text("Play Liked", color = Color.Black, fontWeight = FontWeight.Bold)
                                    }
                                    OutlinedButton(
                                        onClick = { onPlayQueue(likedTracks.shuffled(), 0) },
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
                    }
                    Spacer(modifier = Modifier.height(CyberSpacing.md))
                }

                // If "Liked Songs" filter selected, show the track rows directly
                if (selectedFilter == "Liked Songs") {
                    if (likedTracks.isEmpty()) {
                        item {
                            Text(
                                text = "No liked tracks yet. Tap the heart icon on any playing track to save it here.",
                                style = MaterialTheme.typography.bodyMedium,
                                color = colors.textMuted,
                                modifier = Modifier.padding(vertical = CyberSpacing.lg)
                            )
                        }
                    } else {
                        itemsIndexed(likedTracks) { idx, track ->
                            TrackRowItem(
                                track = track,
                                index = idx,
                                colors = colors,
                                onClick = { onPlayQueue(likedTracks, idx) },
                                onActionClick = { onTrackAction?.invoke(track) }
                            )
                        }
                    }
                    item {
                        Spacer(modifier = Modifier.height(CyberSpacing.lg))
                    }
                }
            }

            // Section: Recently Played
            if (selectedFilter == "All" || selectedFilter == "Recently Played") {
                item {
                    CyberSectionHeader(title = "Recently Played")
                }
                if (recentlyPlayed.isEmpty()) {
                    item {
                        Text(
                            text = "No recent playback history. Start playing tracks to build your listening pulse.",
                            style = MaterialTheme.typography.bodySmall,
                            color = colors.textMuted,
                            modifier = Modifier.padding(vertical = CyberSpacing.sm)
                        )
                    }
                } else {
                    itemsIndexed(recentlyPlayed) { idx, track ->
                        TrackRowItem(
                            track = track,
                            index = idx,
                            colors = colors,
                            onClick = { onPlayQueue(recentlyPlayed, idx) },
                            onActionClick = { onTrackAction?.invoke(track) }
                        )
                    }
                }
                item {
                    Spacer(modifier = Modifier.height(CyberSpacing.md))
                }
            }

            // Section: Playlists
            if (selectedFilter == "All" || selectedFilter == "Playlists") {
                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        CyberSectionHeader(title = "Playlists")
                        TextButton(onClick = { showCreatePlaylistDialog = true }) {
                            Text("+ New Playlist", color = colors.primaryAccent)
                        }
                    }
                }

                // User playlists
                if (userPlaylists.isNotEmpty()) {
                    items(userPlaylists) { pl ->
                        PlaylistRowItem(
                            playlist = pl,
                            colors = colors,
                            onClick = { onPlaylistClick(pl) }
                        )
                    }
                }

                // Default Curated Demo Playlists
                items(musicRepository.curatedPlaylists) { pl ->
                    PlaylistRowItem(
                        playlist = pl,
                        colors = colors,
                        onClick = { onPlaylistClick(pl) }
                    )
                }
            }
        }

        // Create Playlist Dialog
        if (showCreatePlaylistDialog) {
            AlertDialog(
                onDismissRequest = { showCreatePlaylistDialog = false },
                containerColor = colors.surfaceElevated,
                title = {
                    Text("New Playlist", style = MaterialTheme.typography.titleLarge, color = colors.textPrimary)
                },
                text = {
                    Column {
                        Text("Give your cyber playlist a name:", style = MaterialTheme.typography.bodyMedium, color = colors.textSecondary)
                        Spacer(modifier = Modifier.height(CyberSpacing.sm))
                        OutlinedTextField(
                            value = newPlaylistName,
                            onValueChange = { newPlaylistName = it },
                            placeholder = { Text("e.g. Neon Horizon", color = colors.textMuted) },
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = colors.primaryAccent,
                                unfocusedBorderColor = colors.border,
                                focusedTextColor = colors.textPrimary,
                                unfocusedTextColor = colors.textPrimary
                            ),
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                },
                confirmButton = {
                    Button(
                        onClick = {
                            if (newPlaylistName.isNotBlank()) {
                                musicRepository.createPlaylist(newPlaylistName.trim())
                                newPlaylistName = ""
                                showCreatePlaylistDialog = false
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = colors.primaryAccent)
                    ) {
                        Text("Create", color = Color.Black)
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showCreatePlaylistDialog = false }) {
                        Text("Cancel", color = colors.textSecondary)
                    }
                }
            )
        }
    }
}

@Composable
private fun TrackRowItem(
    track: Track,
    index: Int,
    colors: CyberPulseColors,
    onClick: () -> Unit,
    onActionClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = CyberSpacing.xs)
            .clip(RoundedCornerShape(CyberRadius.sm))
            .background(colors.surfaceCard)
            .border(1.dp, colors.border, RoundedCornerShape(CyberRadius.sm))
            .clickable(onClick = onClick)
            .padding(horizontal = CyberSpacing.md, vertical = CyberSpacing.sm),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = "${index + 1}",
            style = MaterialTheme.typography.labelSmall,
            color = colors.textMuted,
            modifier = Modifier.width(24.dp)
        )
        CyberArtworkPlaceholder(
            keyName = track.placeholderArtworkKey,
            modifier = Modifier.size(40.dp).clip(RoundedCornerShape(CyberRadius.xs))
        )
        Spacer(modifier = Modifier.width(CyberSpacing.sm))
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = track.title,
                style = MaterialTheme.typography.titleMedium,
                color = colors.textPrimary,
                maxLines = 1
            )
            Text(
                text = "${track.artist} • ${track.album}",
                style = MaterialTheme.typography.bodySmall,
                color = colors.textSecondary,
                maxLines = 1
            )
        }
        Text(
            text = track.formattedDuration,
            style = MaterialTheme.typography.labelSmall,
            color = colors.textMuted
        )
        IconButton(onClick = onActionClick, modifier = Modifier.size(36.dp)) {
            Icon(
                imageVector = Icons.Default.MoreVert,
                contentDescription = "Options",
                tint = colors.textMuted
            )
        }
    }
}

@Composable
private fun PlaylistRowItem(
    playlist: Playlist,
    colors: CyberPulseColors,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = CyberSpacing.xs)
            .clip(RoundedCornerShape(CyberRadius.md))
            .background(colors.surfaceCard)
            .border(1.dp, colors.border, RoundedCornerShape(CyberRadius.md))
            .clickable(onClick = onClick)
            .padding(CyberSpacing.md),
        verticalAlignment = Alignment.CenterVertically
    ) {
        CyberArtworkPlaceholder(
            keyName = playlist.artworkKey,
            modifier = Modifier.size(50.dp),
            shape = RoundedCornerShape(CyberRadius.sm)
        )
        Spacer(modifier = Modifier.width(CyberSpacing.md))
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = playlist.title,
                style = MaterialTheme.typography.titleMedium,
                color = colors.textPrimary
            )
            Text(
                text = "Playlist • ${playlist.trackCount} tracks",
                style = MaterialTheme.typography.bodyMedium,
                color = colors.textSecondary
            )
        }
        Icon(
            imageVector = Icons.Default.ChevronRight,
            contentDescription = null,
            tint = colors.textMuted
        )
    }
}
