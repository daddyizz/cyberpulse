package com.daddyizz.cyberpulse.feature.search

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
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
import com.daddyizz.cyberpulse.core.ads.AdPlacement
import com.daddyizz.cyberpulse.core.ads.CyberAdBanner
import com.daddyizz.cyberpulse.core.designsystem.*
import com.daddyizz.cyberpulse.core.model.*

@Composable
fun SearchScreen(
    viewModel: SearchViewModel,
    onTrackSelect: (Track) -> Unit,
    onArtistSelect: (String) -> Unit = {},
    onAlbumSelect: (String) -> Unit = {},
    onPlaylistSelect: (String) -> Unit = {},
    onTrackAction: ((Track) -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    val uiState by viewModel.uiState.collectAsState()
    val colors = LocalCyberPulseColors.current

    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = CyberSpacing.screenHorizontal)
    ) {
        Spacer(modifier = Modifier.height(CyberSpacing.lg))

        // Top Header with Offline Mode Toggle
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "Search",
                style = MaterialTheme.typography.headlineLarge,
                color = colors.textPrimary,
                fontWeight = FontWeight.Bold
            )

            // Offline Mode indicator chip
            Surface(
                onClick = { viewModel.toggleOfflineMode() },
                shape = RoundedCornerShape(CyberRadius.full),
                color = if (uiState.isOfflineMode) colors.primaryAccent.copy(alpha = 0.2f) else colors.surfaceSecondary,
                border = androidx.compose.foundation.BorderStroke(
                    1.dp,
                    if (uiState.isOfflineMode) colors.primaryAccent else colors.border
                )
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = CyberSpacing.sm, vertical = CyberSpacing.xs),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = if (uiState.isOfflineMode) Icons.Default.WifiOff else Icons.Default.Wifi,
                        contentDescription = "Toggle Offline",
                        tint = if (uiState.isOfflineMode) colors.primaryAccent else colors.textMuted,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(CyberSpacing.xs))
                    Text(
                        text = if (uiState.isOfflineMode) "Offline" else "Online",
                        style = MaterialTheme.typography.labelSmall,
                        color = if (uiState.isOfflineMode) colors.primaryAccent else colors.textSecondary
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(CyberSpacing.md))

        // Search Input Bar
        CyberSearchBar(
            query = uiState.query,
            onQueryChange = { viewModel.onQueryChanged(it) }
        )

        // Offline Notification Banner if offline mode is active
        if (uiState.isOfflineMode) {
            Spacer(modifier = Modifier.height(CyberSpacing.sm))
            Surface(
                modifier = Modifier.fillMaxWidth(),
                color = colors.surfaceElevated,
                shape = RoundedCornerShape(CyberRadius.sm),
                border = androidx.compose.foundation.BorderStroke(1.dp, colors.primaryAccent.copy(alpha = 0.4f))
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = CyberSpacing.md, vertical = CyberSpacing.xs),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        Icons.Default.CloudOff,
                        contentDescription = null,
                        tint = colors.primaryAccent,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(CyberSpacing.sm))
                    Text(
                        text = "Offline Mode Active • Searching local & cached catalog",
                        style = MaterialTheme.typography.labelSmall,
                        color = colors.textPrimary,
                        modifier = Modifier.weight(1f)
                    )
                    TextButton(
                        onClick = { viewModel.toggleOfflineMode() },
                        contentPadding = PaddingValues(0.dp)
                    ) {
                        Text("Go Online", style = MaterialTheme.typography.labelSmall, color = colors.primaryAccent)
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(CyberSpacing.sm))

        // Multi-Entity Filter Chips (All, Songs, Artists, Albums, Playlists)
        LazyRow(
            horizontalArrangement = Arrangement.spacedBy(CyberSpacing.xs),
            contentPadding = PaddingValues(vertical = CyberSpacing.xs)
        ) {
            items(SearchFilter.values().filter { it != SearchFilter.VIDEOS }) { filter ->
                val isSelected = uiState.activeFilter == filter
                Surface(
                    onClick = { viewModel.onFilterSelected(filter) },
                    shape = RoundedCornerShape(CyberRadius.full),
                    color = if (isSelected) colors.primaryAccent else colors.surfaceSecondary,
                    border = androidx.compose.foundation.BorderStroke(
                        1.dp,
                        if (isSelected) colors.primaryAccent else colors.border
                    )
                ) {
                    Text(
                        text = filter.displayName,
                        style = MaterialTheme.typography.labelMedium,
                        color = if (isSelected) Color.Black else colors.textSecondary,
                        fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                        modifier = Modifier.padding(horizontal = CyberSpacing.md, vertical = CyberSpacing.xs)
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(CyberSpacing.md))

        if (uiState.query.isNotBlank()) {
            // Search Results Mode
            if (uiState.isLoading && uiState.resultPage.items.isEmpty()) {
                CyberLoadingPlaceholder(label = "Scanning CyberPulse metadata index...")
            } else if (uiState.errorMessage != null && uiState.resultPage.items.isEmpty()) {
                // Error State
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(CyberSpacing.lg),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Icon(
                        Icons.Default.ErrorOutline,
                        contentDescription = "Error",
                        tint = colors.cyberPink,
                        modifier = Modifier.size(48.dp)
                    )
                    Spacer(modifier = Modifier.height(CyberSpacing.md))
                    Text(
                        text = "Query Disrupted",
                        style = MaterialTheme.typography.titleLarge,
                        color = colors.textPrimary,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(CyberSpacing.xs))
                    Text(
                        text = uiState.errorMessage ?: "Failed to connect to music metadata provider.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = colors.textSecondary,
                        modifier = Modifier.padding(horizontal = CyberSpacing.md)
                    )
                    Spacer(modifier = Modifier.height(CyberSpacing.lg))
                    Button(
                        onClick = { viewModel.retry() },
                        colors = ButtonDefaults.buttonColors(containerColor = colors.primaryAccent),
                        shape = RoundedCornerShape(CyberRadius.md)
                    ) {
                        Icon(Icons.Default.Refresh, contentDescription = null, tint = Color.Black)
                        Spacer(modifier = Modifier.width(CyberSpacing.xs))
                        Text("Retry Scan", color = Color.Black, fontWeight = FontWeight.Bold)
                    }
                }
            } else if (uiState.resultPage.items.isEmpty()) {
                CyberEmptyState(
                    title = "No pulses found for '${uiState.query}'",
                    description = "Try searching for a different song, artist, album, or check your connection."
                )
            } else {
                // Header displaying result count and cache indicator
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Results (${uiState.resultPage.items.size})",
                        style = MaterialTheme.typography.titleMedium,
                        color = colors.textSecondary
                    )
                    if (uiState.resultPage.isFromCache) {
                        Text(
                            text = "CACHED MATRIX",
                            style = MaterialTheme.typography.labelSmall,
                            color = colors.primaryAccent
                        )
                    }
                }

                Spacer(modifier = Modifier.height(CyberSpacing.sm))

                LazyColumn(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(CyberSpacing.sm),
                    contentPadding = PaddingValues(bottom = 90.dp)
                ) {
                    items(uiState.resultPage.items) { item ->
                        when (item) {
                            is SearchResultItem.TrackResult -> {
                                TrackResultRow(
                                    track = item.track,
                                    colors = colors,
                                    onClick = { onTrackSelect(item.track) },
                                    onActionClick = { onTrackAction?.invoke(item.track) }
                                )
                            }
                            is SearchResultItem.ArtistResult -> {
                                ArtistResultRow(
                                    artist = item.artist,
                                    colors = colors,
                                    onClick = { onArtistSelect(item.artist.id) }
                                )
                            }
                            is SearchResultItem.AlbumResult -> {
                                AlbumResultRow(
                                    album = item.album,
                                    colors = colors,
                                    onClick = { onAlbumSelect(item.album.id) }
                                )
                            }
                            is SearchResultItem.PlaylistResult -> {
                                PlaylistResultRow(
                                    playlist = item.playlist,
                                    colors = colors,
                                    onClick = { onPlaylistSelect(item.playlist.id) }
                                )
                            }
                            is SearchResultItem.RadioResult -> {
                                RadioResultRow(
                                    station = item.station,
                                    colors = colors,
                                    onClick = { onTrackSelect(item.station.toTrack()) }
                                )
                            }
                        }
                    }

                    // Pagination Footer
                    item {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = CyberSpacing.md),
                            contentAlignment = Alignment.Center
                        ) {
                            if (uiState.isPaginating) {
                                CircularProgressIndicator(
                                    color = colors.primaryAccent,
                                    modifier = Modifier.size(24.dp)
                                )
                            } else if (uiState.resultPage.nextPageToken != null) {
                                OutlinedButton(
                                    onClick = { viewModel.loadNextPage() },
                                    border = androidx.compose.foundation.BorderStroke(1.dp, colors.primaryAccent.copy(alpha = 0.6f)),
                                    colors = ButtonDefaults.outlinedButtonColors(contentColor = colors.primaryAccent),
                                    shape = RoundedCornerShape(CyberRadius.full)
                                ) {
                                    Text("Load More Pulses", style = MaterialTheme.typography.labelMedium)
                                }
                            } else if (uiState.endReached && uiState.resultPage.items.size > 5) {
                                Text(
                                    text = "End of matching pulses",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = colors.textMuted
                                )
                            }
                        }
                    }

                    // Block 7: Visual banner ad placement after search results (Free tier only)
                    item {
                        Spacer(modifier = Modifier.height(CyberSpacing.sm))
                        CyberAdBanner(placement = AdPlacement.SEARCH_RESULTS)
                    }
                }
            }
        } else {
            // Default Browse Mode
            LazyColumn(
                modifier = Modifier.weight(1f),
                contentPadding = PaddingValues(bottom = 90.dp)
            ) {
                // Suggestions / Instant Filters when query is partially active
                if (uiState.suggestions.isNotEmpty()) {
                    item {
                        Text(
                            text = "Suggested Pulses",
                            style = MaterialTheme.typography.titleMedium,
                            color = colors.textPrimary
                        )
                        Spacer(modifier = Modifier.height(CyberSpacing.xs))
                        LazyRow(
                            horizontalArrangement = Arrangement.spacedBy(CyberSpacing.sm),
                            contentPadding = PaddingValues(bottom = CyberSpacing.md)
                        ) {
                            items(uiState.suggestions) { suggestion ->
                                Surface(
                                    onClick = { viewModel.onQueryChanged(suggestion) },
                                    shape = RoundedCornerShape(CyberRadius.full),
                                    color = colors.surfaceElevated,
                                    border = androidx.compose.foundation.BorderStroke(1.dp, colors.border)
                                ) {
                                    Row(
                                        modifier = Modifier.padding(horizontal = CyberSpacing.md, vertical = CyberSpacing.xs),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Icon(
                                            Icons.Default.TrendingUp,
                                            contentDescription = null,
                                            tint = colors.primaryAccent,
                                            modifier = Modifier.size(14.dp)
                                        )
                                        Spacer(modifier = Modifier.width(CyberSpacing.xs))
                                        Text(
                                            text = suggestion,
                                            style = MaterialTheme.typography.bodyMedium,
                                            color = colors.textPrimary
                                        )
                                    }
                                }
                            }
                        }
                    }
                }

                // Recent Searches
                if (uiState.recentSearches.isNotEmpty()) {
                    item {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "Recent Searches",
                                style = MaterialTheme.typography.titleMedium,
                                color = colors.textPrimary
                            )
                            TextButton(
                                onClick = { viewModel.clearAllRecentSearches() },
                                contentPadding = PaddingValues(0.dp)
                            ) {
                                Text("Clear All", style = MaterialTheme.typography.labelSmall, color = colors.textMuted)
                            }
                        }
                        Spacer(modifier = Modifier.height(CyberSpacing.xs))
                    }

                    items(uiState.recentSearches.take(6)) { term ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(CyberRadius.sm))
                                .clickable { viewModel.selectRecentSearch(term) }
                                .padding(vertical = CyberSpacing.xs, horizontal = CyberSpacing.xs),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    imageVector = Icons.Default.History,
                                    contentDescription = null,
                                    tint = colors.textMuted,
                                    modifier = Modifier.size(18.dp)
                                )
                                Spacer(modifier = Modifier.width(CyberSpacing.md))
                                Text(
                                    text = term,
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = colors.textPrimary
                                )
                            }
                            IconButton(
                                onClick = { viewModel.removeRecentSearch(term) },
                                modifier = Modifier.size(24.dp)
                            ) {
                                Icon(
                                    Icons.Default.Close,
                                    contentDescription = "Remove",
                                    tint = colors.textMuted,
                                    modifier = Modifier.size(14.dp)
                                )
                            }
                        }
                    }

                    item {
                        Spacer(modifier = Modifier.height(CyberSpacing.lg))
                    }
                }

                // Browse Categories Grid
                item {
                    Text(
                        text = "Browse Categories",
                        style = MaterialTheme.typography.headlineMedium,
                        color = colors.textPrimary,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(CyberSpacing.md))
                }

                item {
                    val categories = viewModel.browseCategories
                    Column(verticalArrangement = Arrangement.spacedBy(CyberSpacing.md)) {
                        for (i in categories.indices step 2) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(CyberSpacing.md)
                            ) {
                                val item1 = categories[i]
                                Box(
                                    modifier = Modifier
                                        .weight(1f)
                                        .height(84.dp)
                                        .clip(RoundedCornerShape(CyberRadius.md))
                                        .background(colors.surfaceElevated)
                                        .border(1.dp, Color(android.graphics.Color.parseColor(item1.second)).copy(alpha = 0.5f), RoundedCornerShape(CyberRadius.md))
                                        .clickable { viewModel.onQueryChanged(item1.first) }
                                        .padding(CyberSpacing.md)
                                ) {
                                    Text(
                                        text = item1.first,
                                        style = MaterialTheme.typography.titleLarge,
                                        color = colors.textPrimary,
                                        fontWeight = FontWeight.Bold
                                    )
                                }

                                if (i + 1 < categories.size) {
                                    val item2 = categories[i + 1]
                                    Box(
                                        modifier = Modifier
                                            .weight(1f)
                                            .height(84.dp)
                                            .clip(RoundedCornerShape(CyberRadius.md))
                                            .background(colors.surfaceElevated)
                                            .border(1.dp, Color(android.graphics.Color.parseColor(item2.second)).copy(alpha = 0.5f), RoundedCornerShape(CyberRadius.md))
                                            .clickable { viewModel.onQueryChanged(item2.first) }
                                            .padding(CyberSpacing.md)
                                    ) {
                                        Text(
                                            text = item2.first,
                                            style = MaterialTheme.typography.titleLarge,
                                            color = colors.textPrimary,
                                            fontWeight = FontWeight.Bold
                                        )
                                    }
                                } else {
                                    Spacer(modifier = Modifier.weight(1f))
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun TrackResultRow(
    track: Track,
    colors: CyberPulseColors,
    onClick: () -> Unit,
    onActionClick: (() -> Unit)? = null
) {
    val isYouTube = track.source == MusicSource.YOUTUBE
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(CyberRadius.md))
            .background(colors.surfaceCard)
            .border(1.dp, colors.border, RoundedCornerShape(CyberRadius.md))
            .clickable(onClick = onClick)
            .padding(CyberSpacing.md),
        verticalAlignment = Alignment.CenterVertically
    ) {
        CyberArtworkPlaceholder(
            keyName = track.placeholderArtworkKey,
            modifier = Modifier.size(48.dp)
        )
        Spacer(modifier = Modifier.width(CyberSpacing.md))
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = track.title,
                style = MaterialTheme.typography.titleMedium,
                color = colors.textPrimary,
                maxLines = 1
            )
            val subtitleText = if (isYouTube) {
                "${track.artist} • Video Upload (YouTube)"
            } else {
                "${track.artist} • ${track.album}"
            }
            Text(
                text = subtitleText,
                style = MaterialTheme.typography.bodyMedium,
                color = colors.textSecondary,
                maxLines = 1
            )
        }
        Spacer(modifier = Modifier.width(CyberSpacing.xs))
        // Source indicator badge
        val isLocal = track.source == com.daddyizz.cyberpulse.core.model.MusicSource.LOCAL
        val isRadio = track.source == com.daddyizz.cyberpulse.core.model.MusicSource.RADIO
        val badgeColor = when {
            isLocal -> colors.primaryAccent
            isRadio -> colors.neonPink
            isYouTube -> colors.secondaryAccent
            else -> colors.textMuted
        }
        val badgeText = when {
            isLocal -> "LOCAL"
            isRadio -> "RADIO"
            isYouTube -> "YOUTUBE"
            else -> "DEMO"
        }
        Surface(
            shape = RoundedCornerShape(CyberRadius.xs),
            color = badgeColor.copy(alpha = 0.15f),
            border = androidx.compose.foundation.BorderStroke(1.dp, badgeColor.copy(alpha = 0.5f))
        ) {
            Text(
                text = badgeText,
                style = MaterialTheme.typography.labelSmall,
                color = badgeColor,
                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
            )
        }
        Spacer(modifier = Modifier.width(CyberSpacing.sm))
        Text(
            text = track.formattedDuration,
            style = MaterialTheme.typography.labelSmall,
            color = colors.textMuted
        )
        Spacer(modifier = Modifier.width(CyberSpacing.xs))
        if (onActionClick != null) {
            IconButton(onClick = onActionClick, modifier = Modifier.size(36.dp)) {
                Icon(
                    imageVector = Icons.Default.MoreVert,
                    contentDescription = "Track Actions",
                    tint = colors.textMuted
                )
            }
        } else {
            Icon(
                imageVector = if (isYouTube) Icons.Default.OpenInNew else Icons.Default.PlayArrow,
                contentDescription = if (isYouTube) "External Source" else "Play",
                tint = if (isYouTube) colors.secondaryAccent else colors.primaryAccent
            )
        }
    }
}

@Composable
private fun ArtistResultRow(
    artist: Artist,
    colors: CyberPulseColors,
    onClick: () -> Unit
) {
    val isYouTube = artist.source == MusicSource.YOUTUBE
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(CyberRadius.md))
            .background(colors.surfaceCard)
            .border(1.dp, colors.border, RoundedCornerShape(CyberRadius.md))
            .clickable(onClick = onClick)
            .padding(CyberSpacing.md),
        verticalAlignment = Alignment.CenterVertically
    ) {
        CyberArtworkPlaceholder(
            keyName = artist.avatarPlaceholderKey,
            modifier = Modifier
                .size(48.dp)
                .clip(CircleShape)
        )
        Spacer(modifier = Modifier.width(CyberSpacing.md))
        Column(modifier = Modifier.weight(1f)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = artist.name,
                    style = MaterialTheme.typography.titleMedium,
                    color = colors.textPrimary,
                    maxLines = 1,
                    fontWeight = FontWeight.Bold
                )
                if (!isYouTube) {
                    Spacer(modifier = Modifier.width(CyberSpacing.xs))
                    Icon(
                        Icons.Default.CheckCircle,
                        contentDescription = "Verified Local Artist",
                        tint = colors.primaryAccent,
                        modifier = Modifier.size(14.dp)
                    )
                }
            }
            val subtitleText = if (isYouTube) {
                "YouTube Channel (Discovery Abstraction)"
            } else {
                "Artist • ${artist.genres.joinToString(", ").ifEmpty { "CyberPulse Demo" }}"
            }
            Text(
                text = subtitleText,
                style = MaterialTheme.typography.bodyMedium,
                color = colors.textSecondary,
                maxLines = 1
            )
        }
        // Source indicator badge
        Surface(
            shape = RoundedCornerShape(CyberRadius.xs),
            color = if (isYouTube) colors.primaryAccent.copy(alpha = 0.15f) else colors.surfaceSecondary,
            border = androidx.compose.foundation.BorderStroke(
                1.dp,
                if (isYouTube) colors.primaryAccent.copy(alpha = 0.5f) else colors.border
            )
        ) {
            Text(
                text = if (isYouTube) "YOUTUBE" else "DEMO",
                style = MaterialTheme.typography.labelSmall,
                color = if (isYouTube) colors.primaryAccent else colors.textMuted,
                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
            )
        }
        Spacer(modifier = Modifier.width(CyberSpacing.xs))
        Icon(
            imageVector = Icons.Default.ChevronRight,
            contentDescription = "View",
            tint = colors.textMuted
        )
    }
}

@Composable
private fun AlbumResultRow(
    album: Album,
    colors: CyberPulseColors,
    onClick: () -> Unit
) {
    val isYouTube = album.source == MusicSource.YOUTUBE
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(CyberRadius.md))
            .background(colors.surfaceCard)
            .border(1.dp, colors.border, RoundedCornerShape(CyberRadius.md))
            .clickable(onClick = onClick)
            .padding(CyberSpacing.md),
        verticalAlignment = Alignment.CenterVertically
    ) {
        CyberArtworkPlaceholder(
            keyName = album.artworkKey,
            modifier = Modifier.size(48.dp)
        )
        Spacer(modifier = Modifier.width(CyberSpacing.md))
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = album.title,
                style = MaterialTheme.typography.titleMedium,
                color = colors.textPrimary,
                maxLines = 1
            )
            val subtitleText = if (isYouTube) {
                "Curated Collection (YouTube Playlist Abstraction)"
            } else {
                "Album • ${album.artist} (${album.releaseYear})"
            }
            Text(
                text = subtitleText,
                style = MaterialTheme.typography.bodyMedium,
                color = colors.textSecondary,
                maxLines = 1
            )
        }
        // Source indicator badge
        Surface(
            shape = RoundedCornerShape(CyberRadius.xs),
            color = if (isYouTube) colors.primaryAccent.copy(alpha = 0.15f) else colors.surfaceSecondary,
            border = androidx.compose.foundation.BorderStroke(
                1.dp,
                if (isYouTube) colors.primaryAccent.copy(alpha = 0.5f) else colors.border
            )
        ) {
            Text(
                text = if (isYouTube) "YOUTUBE" else "DEMO",
                style = MaterialTheme.typography.labelSmall,
                color = if (isYouTube) colors.primaryAccent else colors.textMuted,
                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
            )
        }
        Spacer(modifier = Modifier.width(CyberSpacing.xs))
        Icon(
            imageVector = Icons.Default.ChevronRight,
            contentDescription = "View",
            tint = colors.textMuted
        )
    }
}

@Composable
private fun PlaylistResultRow(
    playlist: Playlist,
    colors: CyberPulseColors,
    onClick: () -> Unit
) {
    val isYouTube = playlist.source == MusicSource.YOUTUBE
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(CyberRadius.md))
            .background(colors.surfaceCard)
            .border(1.dp, colors.border, RoundedCornerShape(CyberRadius.md))
            .clickable(onClick = onClick)
            .padding(CyberSpacing.md),
        verticalAlignment = Alignment.CenterVertically
    ) {
        CyberArtworkPlaceholder(
            keyName = playlist.artworkKey,
            modifier = Modifier.size(48.dp)
        )
        Spacer(modifier = Modifier.width(CyberSpacing.md))
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = playlist.title,
                style = MaterialTheme.typography.titleMedium,
                color = colors.textPrimary,
                maxLines = 1
            )
            val subtitleText = if (isYouTube) {
                "Public Playlist • ${playlist.createdBy}"
            } else {
                "Curated Playlist • Local Demo"
            }
            Text(
                text = subtitleText,
                style = MaterialTheme.typography.bodyMedium,
                color = colors.textSecondary,
                maxLines = 1
            )
        }
        // Source indicator badge
        Surface(
            shape = RoundedCornerShape(CyberRadius.xs),
            color = if (isYouTube) colors.primaryAccent.copy(alpha = 0.15f) else colors.surfaceSecondary,
            border = androidx.compose.foundation.BorderStroke(
                1.dp,
                if (isYouTube) colors.primaryAccent.copy(alpha = 0.5f) else colors.border
            )
        ) {
            Text(
                text = if (isYouTube) "YOUTUBE" else "DEMO",
                style = MaterialTheme.typography.labelSmall,
                color = if (isYouTube) colors.primaryAccent else colors.textMuted,
                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
            )
        }
        Spacer(modifier = Modifier.width(CyberSpacing.xs))
        Icon(
            imageVector = Icons.Default.ChevronRight,
            contentDescription = "View",
            tint = colors.textMuted
        )
    }
}

@Composable
private fun RadioResultRow(
    station: com.daddyizz.cyberpulse.core.model.RadioStation,
    colors: CyberPulseColors,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(CyberRadius.md))
            .background(colors.surfaceCard)
            .border(1.dp, colors.border, RoundedCornerShape(CyberRadius.md))
            .clickable(onClick = onClick)
            .padding(CyberSpacing.md),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(48.dp)
                .clip(RoundedCornerShape(CyberRadius.sm))
                .background(colors.neonPink.copy(alpha = 0.15f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Default.Radio,
                contentDescription = null,
                tint = colors.neonPink,
                modifier = Modifier.size(24.dp)
            )
        }
        Spacer(modifier = Modifier.width(CyberSpacing.md))
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = station.name,
                style = MaterialTheme.typography.titleMedium,
                color = colors.textPrimary,
                maxLines = 1
            )
            Text(
                text = "${station.genre ?: "Radio"} • ${station.country ?: "Live Stream"}",
                style = MaterialTheme.typography.bodyMedium,
                color = colors.textSecondary,
                maxLines = 1
            )
        }
        Spacer(modifier = Modifier.width(CyberSpacing.xs))
        Surface(
            shape = RoundedCornerShape(CyberRadius.xs),
            color = colors.neonPink.copy(alpha = 0.15f),
            border = androidx.compose.foundation.BorderStroke(1.dp, colors.neonPink.copy(alpha = 0.5f))
        ) {
            Text(
                text = "RADIO",
                style = MaterialTheme.typography.labelSmall,
                color = colors.neonPink,
                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
            )
        }
        Spacer(modifier = Modifier.width(CyberSpacing.xs))
        Icon(
            imageVector = Icons.Default.PlayArrow,
            contentDescription = "Tune in",
            tint = colors.neonPink
        )
    }
}
