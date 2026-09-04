package com.daddyizz.cyberpulse.feature.radio

import android.content.Intent
import android.net.Uri
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.*
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
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.daddyizz.cyberpulse.CyberPulseApplication
import com.daddyizz.cyberpulse.core.designsystem.CyberButton
import com.daddyizz.cyberpulse.core.designsystem.LocalCyberPulseColors
import com.daddyizz.cyberpulse.core.model.RadioStation
import com.daddyizz.cyberpulse.core.model.RadioStreamType
import com.daddyizz.cyberpulse.core.model.Track
import com.daddyizz.cyberpulse.core.provider.radio.RadioProvider
import com.daddyizz.cyberpulse.core.provider.radio.RadioRepository

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CyberRadioScreen(
    onBackClick: () -> Unit,
    onStationPlay: (Track) -> Unit,
    currentPlayingTrack: Track? = null,
    isPlaying: Boolean = false,
    modifier: Modifier = Modifier
) {
    val colors = LocalCyberPulseColors.current
    val context = LocalContext.current
    val radioRepo = remember { CyberPulseApplication.instance.radioRepository }
    val favoriteIds by radioRepo.favoriteStationIds.collectAsState()
    val isOffline by radioRepo.isOffline.collectAsState()

    var searchQuery by remember { mutableStateOf("") }
    var selectedCategory by remember { mutableStateOf("All") }
    var detailedStation by remember { mutableStateOf<RadioStation?>(null) }

    val categories = listOf(
        "All",
        "Favorites",
        "Malaysia",
        "Electronic",
        "Chill",
        "News & Talk",
        "Jazz",
        "Classical"
    )

    val stations = remember(searchQuery, selectedCategory, favoriteIds) {
        if (searchQuery.isNotBlank()) {
            radioRepo.searchStations(searchQuery)
        } else {
            radioRepo.getStationsByCategory(selectedCategory)
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = "CYBER RADIO",
                                color = colors.textPrimary,
                                fontSize = 17.sp,
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 1.sp
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            // Glowing live badge
                            LivePulsingBadge()
                        }
                        Text(
                            text = "Live Public Streams • Powered by Media3",
                            color = colors.primaryAccent,
                            fontSize = 11.sp,
                            letterSpacing = 0.5.sp
                        )
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Back",
                            tint = colors.textPrimary
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = colors.backgroundPrimary
                )
            )
        },
        containerColor = colors.backgroundPrimary,
        modifier = modifier.fillMaxSize()
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            // Offline Warning Banner
            AnimatedVisibility(visible = isOffline) {
                Surface(
                    color = colors.neonPink.copy(alpha = 0.15f),
                    border = androidx.compose.foundation.BorderStroke(1.dp, colors.neonPink.copy(alpha = 0.4f)),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 6.dp),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.WifiOff,
                            contentDescription = null,
                            tint = colors.neonPink,
                            modifier = Modifier.size(20.dp)
                        )
                        Spacer(modifier = Modifier.width(10.dp))
                        Text(
                            text = "Offline Mode: Internet connection required for live streaming. Starred stations are preserved.",
                            color = colors.textPrimary,
                            fontSize = 12.sp
                        )
                    }
                }
            }

            // Search Bar
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                placeholder = {
                    Text("Search stations, genres, or countries...", color = colors.textSecondary, fontSize = 13.sp)
                },
                leadingIcon = {
                    Icon(Icons.Default.Search, contentDescription = null, tint = colors.primaryAccent)
                },
                trailingIcon = {
                    if (searchQuery.isNotEmpty()) {
                        IconButton(onClick = { searchQuery = "" }) {
                            Icon(Icons.Default.Close, contentDescription = "Clear", tint = colors.textSecondary)
                        }
                    }
                },
                singleLine = true,
                shape = RoundedCornerShape(10.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = colors.primaryAccent,
                    unfocusedBorderColor = colors.border,
                    focusedContainerColor = colors.surfaceSecondary,
                    unfocusedContainerColor = colors.surfaceSecondary,
                    focusedTextColor = colors.textPrimary,
                    unfocusedTextColor = colors.textPrimary
                ),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp)
            )

            // Category Chips Row
            LazyRow(
                modifier = Modifier.fillMaxWidth(),
                contentPadding = PaddingValues(horizontal = 16.dp, vertical = 4.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(categories) { category ->
                    val isSelected = selectedCategory.equals(category, ignoreCase = true)
                    FilterChip(
                        selected = isSelected,
                        onClick = {
                            selectedCategory = category
                            searchQuery = ""
                        },
                        label = {
                            Text(
                                text = category,
                                fontSize = 12.sp,
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
                            )
                        },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = colors.primaryAccent,
                            selectedLabelColor = colors.backgroundPrimary,
                            containerColor = colors.surfaceSecondary,
                            labelColor = colors.textSecondary
                        ),
                        border = FilterChipDefaults.filterChipBorder(
                            borderColor = if (isSelected) colors.primaryAccent else colors.border,
                            enabled = true,
                            selected = isSelected
                        )
                    )
                }
            }

            Spacer(modifier = Modifier.height(6.dp))

            // Station list
            if (stations.isEmpty()) {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(32.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Radio,
                        contentDescription = null,
                        tint = colors.textSecondary,
                        modifier = Modifier.size(56.dp)
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        text = "No Stations Found",
                        color = colors.textPrimary,
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = if (selectedCategory == "Favorites") "You haven't starred any stations yet. Tap the heart on any station to save it here." else "Try searching for a different genre or station name.",
                        color = colors.textSecondary,
                        fontSize = 12.sp,
                        modifier = Modifier.padding(horizontal = 16.dp)
                    )
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(bottom = 120.dp)
                ) {
                    items(stations, key = { it.id }) { station ->
                        val isStationPlaying = isPlaying && currentPlayingTrack?.sourceId == station.streamUrl

                        RadioStationCard(
                            station = station,
                            isCurrentlyPlaying = isStationPlaying,
                            onPlayClick = { onStationPlay(station.toTrack()) },
                            onFavoriteToggle = { radioRepo.toggleFavorite(station.id) },
                            onInfoClick = { detailedStation = station }
                        )
                    }
                }
            }
        }
    }

    // Station Detail Bottom Sheet / Dialog
    detailedStation?.let { station ->
        AlertDialog(
            onDismissRequest = { detailedStation = null },
            containerColor = colors.surfaceSecondary,
            title = {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Radio, contentDescription = null, tint = colors.primaryAccent)
                    Spacer(modifier = Modifier.width(10.dp))
                    Text(station.name, color = colors.textPrimary, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                }
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    station.description?.let {
                        Text(it, color = colors.textSecondary, fontSize = 13.sp)
                    }
                    HorizontalDivider(color = colors.border, thickness = 0.5.dp)
                    Text("Genre: ${station.genre ?: "Music"}", color = colors.textPrimary, fontSize = 12.sp)
                    Text("Country: ${station.country ?: "Global"}", color = colors.textPrimary, fontSize = 12.sp)
                    Text("Stream Type: ${station.streamType.name}", color = colors.textPrimary, fontSize = 12.sp)
                    station.bitrateKbps?.let {
                        Text("Bitrate: $it kbps", color = colors.textPrimary, fontSize = 12.sp)
                    }
                    Text("Stream: ${station.streamUrl}", color = colors.textSecondary, fontSize = 10.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        detailedStation = null
                        onStationPlay(station.toTrack())
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = colors.primaryAccent)
                ) {
                    Text("TUNE IN", color = colors.backgroundPrimary, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                if (!station.homepageUrl.isNullOrBlank()) {
                    OutlinedButton(
                        onClick = {
                            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(station.homepageUrl))
                            context.startActivity(intent)
                        },
                        border = androidx.compose.foundation.BorderStroke(1.dp, colors.border)
                    ) {
                        Text("WEBSITE", color = colors.textPrimary, fontSize = 12.sp)
                    }
                }
            }
        )
    }
}

@Composable
private fun RadioStationCard(
    station: RadioStation,
    isCurrentlyPlaying: Boolean,
    onPlayClick: () -> Unit,
    onFavoriteToggle: () -> Unit,
    onInfoClick: () -> Unit
) {
    val colors = LocalCyberPulseColors.current

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onPlayClick)
            .padding(horizontal = 16.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Station Artwork with Live overlay
        Box(
            modifier = Modifier
                .size(54.dp)
                .clip(RoundedCornerShape(8.dp))
                .background(colors.surfaceSecondary)
                .border(
                    width = if (isCurrentlyPlaying) 1.5.dp else 0.5.dp,
                    color = if (isCurrentlyPlaying) colors.primaryAccent else colors.border,
                    shape = RoundedCornerShape(8.dp)
                ),
            contentAlignment = Alignment.Center
        ) {
            if (!station.artworkUrl.isNullOrBlank()) {
                AsyncImage(
                    model = station.artworkUrl,
                    contentDescription = null,
                    modifier = Modifier.fillMaxSize(),
                    contentScale = ContentScale.Crop
                )
            } else {
                Icon(
                    imageVector = Icons.Default.Radio,
                    contentDescription = null,
                    tint = colors.primaryAccent,
                    modifier = Modifier.size(28.dp)
                )
            }

            if (isCurrentlyPlaying) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(Color.Black.copy(alpha = 0.45f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.GraphicEq,
                        contentDescription = "Playing",
                        tint = colors.primaryAccent,
                        modifier = Modifier.size(26.dp)
                    )
                }
            }
        }

        Spacer(modifier = Modifier.width(12.dp))

        Column(modifier = Modifier.weight(1f)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = station.name,
                    color = if (isCurrentlyPlaying) colors.primaryAccent else colors.textPrimary,
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 14.sp,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.weight(1f, fill = false)
                )
                Spacer(modifier = Modifier.width(6.dp))
                if (station.isVerified) {
                    Icon(
                        imageVector = Icons.Default.CheckCircle,
                        contentDescription = "Verified",
                        tint = colors.primaryAccent,
                        modifier = Modifier.size(14.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(2.dp))

            Text(
                text = "${station.genre ?: "Radio"} • ${station.country ?: "Live"}",
                color = colors.textSecondary,
                fontSize = 12.sp,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )

            Spacer(modifier = Modifier.height(4.dp))

            // Tech specs chip
            Row(verticalAlignment = Alignment.CenterVertically) {
                Surface(
                    color = colors.surfaceSecondary,
                    shape = RoundedCornerShape(3.dp),
                    border = androidx.compose.foundation.BorderStroke(0.5.dp, colors.border)
                ) {
                    Text(
                        text = if (station.streamType == RadioStreamType.HLS) "HLS LIVE" else "${station.bitrateKbps ?: 128}K ${station.streamType.name}",
                        color = colors.textSecondary,
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Medium,
                        modifier = Modifier.padding(horizontal = 4.dp, vertical = 1.dp)
                    )
                }
            }
        }

        IconButton(onClick = onFavoriteToggle) {
            Icon(
                imageVector = if (station.isFavorite) Icons.Default.Favorite else Icons.Default.FavoriteBorder,
                contentDescription = "Favorite",
                tint = if (station.isFavorite) colors.neonPink else colors.textSecondary,
                modifier = Modifier.size(20.dp)
            )
        }

        IconButton(onClick = onInfoClick) {
            Icon(
                imageVector = Icons.Default.Info,
                contentDescription = "Station info",
                tint = colors.textSecondary,
                modifier = Modifier.size(20.dp)
            )
        }
    }
}

@Composable
private fun LivePulsingBadge() {
    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val alpha by infiniteTransition.animateFloat(
        initialValue = 0.3f,
        targetValue = 1.0f,
        animationSpec = infiniteRepeatable(
            animation = tween(800, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulse_alpha"
    )

    Surface(
        color = Color(0xFFFF2A6D).copy(alpha = 0.15f),
        shape = RoundedCornerShape(4.dp),
        border = androidx.compose.foundation.BorderStroke(0.5.dp, Color(0xFFFF2A6D).copy(alpha = alpha))
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(6.dp)
                    .background(Color(0xFFFF2A6D).copy(alpha = alpha), CircleShape)
            )
            Spacer(modifier = Modifier.width(4.dp))
            Text(
                text = "LIVE",
                color = Color(0xFFFF2A6D),
                fontSize = 9.sp,
                fontWeight = FontWeight.ExtraBold,
                letterSpacing = 0.5.sp
            )
        }
    }
}
