package com.daddyizz.cyberpulse.feature.home

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import com.daddyizz.cyberpulse.core.ads.AdPlacement
import com.daddyizz.cyberpulse.core.ads.CyberAdBanner
import com.daddyizz.cyberpulse.core.designsystem.*
import com.daddyizz.cyberpulse.core.model.Artist
import com.daddyizz.cyberpulse.core.model.Playlist
import com.daddyizz.cyberpulse.core.model.Track

@Composable
fun HomeScreen(
    viewModel: HomeViewModel,
    onTrackSelect: (Track) -> Unit,
    onPlaylistSelect: (Playlist) -> Unit,
    onArtistSelect: (Artist) -> Unit,
    onProfileClick: () -> Unit,
    onSettingsClick: () -> Unit,
    onStatsClick: () -> Unit = {},
    onCyberDjClick: () -> Unit = {},
    onAiPlaylistClick: () -> Unit = {},
    modifier: Modifier = Modifier
) {
    val uiState by viewModel.uiState.collectAsState()
    val colors = LocalCyberPulseColors.current

    LazyColumn(
        modifier = modifier
            .fillMaxSize(),
        contentPadding = PaddingValues(bottom = 90.dp)
    ) {
        // Top Dynamic Greeting Header
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = CyberSpacing.screenHorizontal, vertical = CyberSpacing.lg),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = uiState.greeting,
                        style = MaterialTheme.typography.headlineLarge,
                        color = colors.textPrimary
                    )
                    Text(
                        text = "Ready to pulse",
                        style = MaterialTheme.typography.bodyMedium,
                        color = colors.textSecondary
                    )
                }
                Row(verticalAlignment = Alignment.CenterVertically) {
                    IconButton(onClick = onStatsClick) {
                        Icon(
                            imageVector = androidx.compose.material.icons.Icons.Default.BarChart,
                            contentDescription = "Listening Stats",
                            tint = colors.primaryAccent
                        )
                    }
                    IconButton(onClick = onSettingsClick) {
                        Icon(
                            imageVector = Icons.Default.Settings,
                            contentDescription = "Settings",
                            tint = colors.textSecondary
                        )
                    }
                    Box(
                        modifier = Modifier
                            .size(40.dp)
                            .clip(CircleShape)
                            .background(colors.surfaceElevated)
                            .border(1.dp, colors.primaryAccent, CircleShape)
                            .clickable(onClick = onProfileClick),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Person,
                            contentDescription = "Profile",
                            tint = colors.primaryAccent,
                            modifier = Modifier.size(22.dp)
                        )
                    }
                }
            }
        }

        // Block 8: Cyber DJ & AI Discovery Action Cards
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = CyberSpacing.screenHorizontal),
                horizontalArrangement = Arrangement.spacedBy(CyberSpacing.md)
            ) {
                // Cyber DJ Card
                Surface(
                    color = colors.surfaceElevated,
                    shape = androidx.compose.foundation.shape.RoundedCornerShape(12.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, colors.primaryAccent.copy(alpha = 0.5f)),
                    modifier = Modifier
                        .weight(1f)
                        .clickable(onClick = onCyberDjClick)
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(38.dp)
                                .clip(androidx.compose.foundation.shape.RoundedCornerShape(8.dp))
                                .background(colors.primaryAccent.copy(alpha = 0.2f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = androidx.compose.material.icons.Icons.Default.GraphicEq,
                                contentDescription = null,
                                tint = colors.primaryAccent,
                                modifier = Modifier.size(20.dp)
                            )
                        }
                        Spacer(modifier = Modifier.width(10.dp))
                        Column {
                            Text(
                                text = "Cyber DJ",
                                style = MaterialTheme.typography.titleSmall,
                                color = colors.textPrimary
                            )
                            Text(
                                text = "Endless mix",
                                style = MaterialTheme.typography.bodySmall,
                                color = colors.textSecondary
                            )
                        }
                    }
                }

                // AI Playlist Card
                Surface(
                    color = colors.surfaceElevated,
                    shape = androidx.compose.foundation.shape.RoundedCornerShape(12.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, colors.secondaryAccent.copy(alpha = 0.5f)),
                    modifier = Modifier
                        .weight(1f)
                        .clickable(onClick = onAiPlaylistClick)
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(38.dp)
                                .clip(androidx.compose.foundation.shape.RoundedCornerShape(8.dp))
                                .background(colors.secondaryAccent.copy(alpha = 0.2f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = androidx.compose.material.icons.Icons.Default.AutoAwesome,
                                contentDescription = null,
                                tint = colors.secondaryAccent,
                                modifier = Modifier.size(20.dp)
                            )
                        }
                        Spacer(modifier = Modifier.width(10.dp))
                        Column {
                            Text(
                                text = "AI Playlist",
                                style = MaterialTheme.typography.titleSmall,
                                color = colors.textPrimary
                            )
                            Text(
                                text = "Generate vibe",
                                style = MaterialTheme.typography.bodySmall,
                                color = colors.textSecondary
                            )
                        }
                    }
                }
            }
            Spacer(modifier = Modifier.height(CyberSpacing.sectionSpacing))
        }

        // Section 1: Recently Played
        item {
            CyberSectionHeader(title = "Recently Played", actionLabel = "See All", onActionClick = {})
            LazyRow(
                contentPadding = PaddingValues(horizontal = CyberSpacing.screenHorizontal),
                horizontalArrangement = Arrangement.spacedBy(CyberSpacing.md)
            ) {
                items(uiState.recentlyPlayed) { track ->
                    CyberMusicCard(track = track, onTrackClick = onTrackSelect)
                }
            }
            Spacer(modifier = Modifier.height(CyberSpacing.sectionSpacing))
        }

        // Section 2: Made For You
        item {
            CyberSectionHeader(title = "Made For You", actionLabel = "Explore", onActionClick = {})
            LazyRow(
                contentPadding = PaddingValues(horizontal = CyberSpacing.screenHorizontal),
                horizontalArrangement = Arrangement.spacedBy(CyberSpacing.md)
            ) {
                items(uiState.madeForYou) { playlist ->
                    CyberPlaylistCard(playlist = playlist, onPlaylistClick = onPlaylistSelect)
                }
            }
            Spacer(modifier = Modifier.height(CyberSpacing.sectionSpacing))
        }

        // Section 3: Trending Now
        item {
            CyberSectionHeader(title = "Trending Now")
            LazyRow(
                contentPadding = PaddingValues(horizontal = CyberSpacing.screenHorizontal),
                horizontalArrangement = Arrangement.spacedBy(CyberSpacing.md)
            ) {
                items(uiState.trendingNow) { track ->
                    CyberMusicCard(track = track, onTrackClick = onTrackSelect)
                }
            }
            Spacer(modifier = Modifier.height(CyberSpacing.sectionSpacing))
        }

        // Block 7: Adaptive Banner Ad between primary feeds (Free tier only)
        item {
            Box(modifier = Modifier.padding(horizontal = CyberSpacing.screenHorizontal)) {
                CyberAdBanner(placement = AdPlacement.HOME_FEED)
            }
            Spacer(modifier = Modifier.height(CyberSpacing.sectionSpacing))
        }

        // Section 4: New Releases
        item {
            CyberSectionHeader(title = "New Releases")
            LazyRow(
                contentPadding = PaddingValues(horizontal = CyberSpacing.screenHorizontal),
                horizontalArrangement = Arrangement.spacedBy(CyberSpacing.md)
            ) {
                items(uiState.newReleases) { track ->
                    CyberMusicCard(track = track, onTrackClick = onTrackSelect)
                }
            }
            Spacer(modifier = Modifier.height(CyberSpacing.sectionSpacing))
        }

        // Section 5: Your Mixes
        item {
            CyberSectionHeader(title = "Your Mixes")
            LazyRow(
                contentPadding = PaddingValues(horizontal = CyberSpacing.screenHorizontal),
                horizontalArrangement = Arrangement.spacedBy(CyberSpacing.md)
            ) {
                items(uiState.yourMixes) { playlist ->
                    CyberPlaylistCard(playlist = playlist, onPlaylistClick = onPlaylistSelect)
                }
            }
            Spacer(modifier = Modifier.height(CyberSpacing.sectionSpacing))
        }

        // Section 6: Popular Artists
        item {
            CyberSectionHeader(title = "Popular Artists")
            LazyRow(
                contentPadding = PaddingValues(horizontal = CyberSpacing.screenHorizontal),
                horizontalArrangement = Arrangement.spacedBy(CyberSpacing.md)
            ) {
                items(uiState.popularArtists) { artist ->
                    CyberArtistCard(artist = artist, onArtistClick = onArtistSelect)
                }
            }
            Spacer(modifier = Modifier.height(CyberSpacing.sectionSpacing))
        }
    }
}
