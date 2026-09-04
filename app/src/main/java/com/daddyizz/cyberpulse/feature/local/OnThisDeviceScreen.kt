package com.daddyizz.cyberpulse.feature.local

import android.Manifest
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
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
import com.daddyizz.cyberpulse.core.designsystem.CyberLoadingPlaceholder
import com.daddyizz.cyberpulse.core.designsystem.CyberPulseIcons
import com.daddyizz.cyberpulse.core.designsystem.LocalCyberPulseColors
import com.daddyizz.cyberpulse.core.model.Track
import com.daddyizz.cyberpulse.core.provider.local.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OnThisDeviceScreen(
    onBackClick: () -> Unit,
    onTrackClick: (Track) -> Unit,
    onPlayAll: (List<Track>) -> Unit,
    onTrackActionClick: (Track) -> Unit,
    modifier: Modifier = Modifier
) {
    val colors = LocalCyberPulseColors.current
    val context = LocalContext.current
    val localProvider = remember { CyberPulseApplication.instance.localMusicProvider }
    val scanState by localProvider.scanState.collectAsState()

    var searchQuery by remember { mutableStateOf("") }
    var selectedTab by remember { mutableIntStateOf(0) }
    var selectedSortOrder by remember { mutableStateOf(LocalSortOrder.TITLE) }
    var selectedAlbum by remember { mutableStateOf<LocalAlbum?>(null) }
    var selectedArtist by remember { mutableStateOf<LocalArtist?>(null) }
    var selectedFolder by remember { mutableStateOf<LocalFolder?>(null) }

    val permissionToRequest = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        Manifest.permission.READ_MEDIA_AUDIO
    } else {
        Manifest.permission.READ_EXTERNAL_STORAGE
    }

    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (isGranted) {
            localProvider.scan(forceRefresh = true)
        }
    }

    LaunchedEffect(Unit) {
        if (localProvider.hasStoragePermission()) {
            localProvider.scan()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = "ON THIS DEVICE",
                            color = colors.textPrimary,
                            fontSize = 17.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 1.sp
                        )
                        Text(
                            text = "Local MediaStore Audio • Direct Playback",
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
                actions = {
                    IconButton(onClick = { localProvider.scan(forceRefresh = true) }) {
                        Icon(
                            imageVector = Icons.Default.Refresh,
                            contentDescription = "Rescan MediaStore",
                            tint = colors.textSecondary
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
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            if (!localProvider.hasStoragePermission()) {
                // Permission rationale card
                PermissionRationaleView(
                    onGrantClick = { permissionLauncher.launch(permissionToRequest) },
                    onSettingsClick = {
                        val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                            data = Uri.fromParts("package", context.packageName, null)
                        }
                        context.startActivity(intent)
                    }
                )
            } else {
                when (val state = scanState) {
                    is LocalScanState.Loading -> {
                        CyberLoadingPlaceholder(
                            message = "Scanning device audio...",
                            modifier = Modifier.fillMaxSize()
                        )
                    }
                    is LocalScanState.Error -> {
                        Column(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(24.dp),
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.Warning,
                                contentDescription = null,
                                tint = colors.neonPink,
                                modifier = Modifier.size(48.dp)
                            )
                            Spacer(modifier = Modifier.height(16.dp))
                            Text(
                                text = "Scan Failed",
                                color = colors.textPrimary,
                                fontWeight = FontWeight.Bold,
                                fontSize = 18.sp
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = state.message,
                                color = colors.textSecondary,
                                fontSize = 14.sp
                            )
                            Spacer(modifier = Modifier.height(20.dp))
                            CyberButton(
                                text = "TRY AGAIN",
                                onClick = { localProvider.scan(forceRefresh = true) }
                            )
                        }
                    }
                    is LocalScanState.Empty -> {
                        Column(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(24.dp),
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.MusicOff,
                                contentDescription = null,
                                tint = colors.textSecondary,
                                modifier = Modifier.size(56.dp)
                            )
                            Spacer(modifier = Modifier.height(16.dp))
                            Text(
                                text = "No Music Found",
                                color = colors.textPrimary,
                                fontWeight = FontWeight.Bold,
                                fontSize = 18.sp
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = "No audio files were detected in MediaStore. Copy some music files (.mp3, .flac, .aac, .m4a) to your device storage.",
                                color = colors.textSecondary,
                                fontSize = 13.sp,
                                modifier = Modifier.padding(horizontal = 20.dp)
                            )
                            Spacer(modifier = Modifier.height(24.dp))
                            CyberButton(
                                text = "RESCAN STORAGE",
                                onClick = { localProvider.scan(forceRefresh = true) }
                            )
                        }
                    }
                    is LocalScanState.Loaded,
                    is LocalScanState.Idle -> {
                        val allTracks = localProvider.getTracks()
                        val allAlbums = localProvider.getAlbums()
                        val allArtists = localProvider.getArtists()
                        val allFolders = localProvider.getFolders()

                        Column(modifier = Modifier.fillMaxSize()) {
                            // Search bar
                            OutlinedTextField(
                                value = searchQuery,
                                onValueChange = { searchQuery = it },
                                placeholder = {
                                    Text("Search on this device...", color = colors.textSecondary, fontSize = 13.sp)
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

                            // Detail overlay view if an album, artist, or folder is selected
                            if (selectedAlbum != null) {
                                LocalDetailTrackListView(
                                    title = selectedAlbum!!.title,
                                    subtitle = "Album by ${selectedAlbum!!.artist} • ${selectedAlbum!!.trackCount} tracks",
                                    artworkUri = selectedAlbum!!.artworkUri,
                                    tracks = selectedAlbum!!.tracks,
                                    onBack = { selectedAlbum = null },
                                    onTrackClick = onTrackClick,
                                    onPlayAll = { onPlayAll(selectedAlbum!!.tracks) },
                                    onTrackActionClick = onTrackActionClick
                                )
                            } else if (selectedArtist != null) {
                                LocalDetailTrackListView(
                                    title = selectedArtist!!.name,
                                    subtitle = "${selectedArtist!!.trackCount} tracks • ${selectedArtist!!.albumCount} albums",
                                    artworkUri = selectedArtist!!.albums.firstOrNull()?.artworkUri,
                                    tracks = selectedArtist!!.tracks,
                                    onBack = { selectedArtist = null },
                                    onTrackClick = onTrackClick,
                                    onPlayAll = { onPlayAll(selectedArtist!!.tracks) },
                                    onTrackActionClick = onTrackActionClick
                                )
                            } else if (selectedFolder != null) {
                                LocalDetailTrackListView(
                                    title = selectedFolder!!.name,
                                    subtitle = "Folder • ${selectedFolder!!.trackCount} tracks",
                                    artworkUri = null,
                                    tracks = selectedFolder!!.tracks,
                                    onBack = { selectedFolder = null },
                                    onTrackClick = onTrackClick,
                                    onPlayAll = { onPlayAll(selectedFolder!!.tracks) },
                                    onTrackActionClick = onTrackActionClick
                                )
                            } else {
                                // Sub-navigation tabs
                                val tabs = listOf(
                                    "Songs (${allTracks.size})",
                                    "Albums (${allAlbums.size})",
                                    "Artists (${allArtists.size})",
                                    "Folders (${allFolders.size})"
                                )

                                ScrollableTabRow(
                                    selectedTabIndex = selectedTab,
                                    containerColor = colors.backgroundPrimary,
                                    contentColor = colors.primaryAccent,
                                    edgePadding = 16.dp,
                                    divider = { HorizontalDivider(color = colors.border, thickness = 0.5.dp) }
                                ) {
                                    tabs.forEachIndexed { index, tabTitle ->
                                        Tab(
                                            selected = selectedTab == index,
                                            onClick = { selectedTab = index },
                                            text = {
                                                Text(
                                                    text = tabTitle,
                                                    fontSize = 13.sp,
                                                    fontWeight = if (selectedTab == index) FontWeight.Bold else FontWeight.Normal,
                                                    color = if (selectedTab == index) colors.primaryAccent else colors.textSecondary
                                                )
                                            }
                                        )
                                    }
                                }

                                when (selectedTab) {
                                    0 -> {
                                        // Songs Tab
                                        val displayTracks = if (searchQuery.isNotBlank()) {
                                            localProvider.searchLocal(searchQuery)
                                        } else {
                                            localProvider.getSortedTracks(selectedSortOrder)
                                        }

                                        // Action Header: Play All, Shuffle & Sort
                                        Row(
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .padding(horizontal = 16.dp, vertical = 8.dp),
                                            horizontalArrangement = Arrangement.SpaceBetween,
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                                Button(
                                                    onClick = { onPlayAll(displayTracks) },
                                                    colors = ButtonDefaults.buttonColors(containerColor = colors.primaryAccent),
                                                    shape = RoundedCornerShape(8.dp),
                                                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                                                ) {
                                                    Icon(Icons.Default.PlayArrow, contentDescription = null, tint = colors.backgroundPrimary, modifier = Modifier.size(16.dp))
                                                    Spacer(modifier = Modifier.width(4.dp))
                                                    Text("PLAY ALL", color = colors.backgroundPrimary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                                }

                                                OutlinedButton(
                                                    onClick = { onPlayAll(displayTracks.shuffled()) },
                                                    colors = ButtonDefaults.outlinedButtonColors(contentColor = colors.textPrimary),
                                                    shape = RoundedCornerShape(8.dp),
                                                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                                                    border = androidx.compose.foundation.BorderStroke(1.dp, colors.border)
                                                ) {
                                                    Icon(Icons.Default.Shuffle, contentDescription = null, tint = colors.primaryAccent, modifier = Modifier.size(16.dp))
                                                    Spacer(modifier = Modifier.width(4.dp))
                                                    Text("SHUFFLE", fontSize = 12.sp)
                                                }
                                            }

                                            // Sort order selector
                                            var showSortMenu by remember { mutableStateOf(false) }
                                            Box {
                                                IconButton(onClick = { showSortMenu = true }) {
                                                    Icon(Icons.Default.Sort, contentDescription = "Sort", tint = colors.primaryAccent)
                                                }
                                                DropdownMenu(
                                                    expanded = showSortMenu,
                                                    onDismissRequest = { showSortMenu = false },
                                                    modifier = Modifier.background(colors.surfaceSecondary)
                                                ) {
                                                    LocalSortOrder.entries.forEach { order ->
                                                        DropdownMenuItem(
                                                            text = {
                                                                Text(
                                                                    text = order.label,
                                                                    color = if (selectedSortOrder == order) colors.primaryAccent else colors.textPrimary,
                                                                    fontWeight = if (selectedSortOrder == order) FontWeight.Bold else FontWeight.Normal
                                                                )
                                                            },
                                                            onClick = {
                                                                selectedSortOrder = order
                                                                showSortMenu = false
                                                            }
                                                        )
                                                    }
                                                }
                                            }
                                        }

                                        LazyColumn(
                                            modifier = Modifier.fillMaxSize(),
                                            contentPadding = PaddingValues(bottom = 120.dp)
                                        ) {
                                            items(displayTracks, key = { it.id }) { track ->
                                                LocalTrackListItem(
                                                    track = track,
                                                    onClick = { onTrackClick(track) },
                                                    onActionClick = { onTrackActionClick(track) }
                                                )
                                            }
                                        }
                                    }
                                    1 -> {
                                        // Albums Tab
                                        val displayAlbums = if (searchQuery.isNotBlank()) {
                                            allAlbums.filter {
                                                it.title.contains(searchQuery, ignoreCase = true) ||
                                                    it.artist.contains(searchQuery, ignoreCase = true)
                                            }
                                        } else allAlbums

                                        LazyVerticalGrid(
                                            columns = GridCells.Fixed(2),
                                            modifier = Modifier.fillMaxSize(),
                                            contentPadding = PaddingValues(horizontal = 16.dp, vertical = 12.dp)
                                        ) {
                                            items(displayAlbums, key = { it.id }) { album ->
                                                LocalAlbumCard(
                                                    album = album,
                                                    onClick = { selectedAlbum = album }
                                                )
                                            }
                                        }
                                    }
                                    2 -> {
                                        // Artists Tab
                                        val displayArtists = if (searchQuery.isNotBlank()) {
                                            allArtists.filter { it.name.contains(searchQuery, ignoreCase = true) }
                                        } else allArtists

                                        LazyColumn(
                                            modifier = Modifier.fillMaxSize(),
                                            contentPadding = PaddingValues(bottom = 120.dp)
                                        ) {
                                            items(displayArtists, key = { it.name }) { artist ->
                                                LocalArtistListItem(
                                                    artist = artist,
                                                    onClick = { selectedArtist = artist }
                                                )
                                            }
                                        }
                                    }
                                    3 -> {
                                        // Folders Tab
                                        val displayFolders = if (searchQuery.isNotBlank()) {
                                            allFolders.filter { it.name.contains(searchQuery, ignoreCase = true) }
                                        } else allFolders

                                        LazyColumn(
                                            modifier = Modifier.fillMaxSize(),
                                            contentPadding = PaddingValues(bottom = 120.dp)
                                        ) {
                                            items(displayFolders, key = { it.path }) { folder ->
                                                LocalFolderListItem(
                                                    folder = folder,
                                                    onClick = { selectedFolder = folder }
                                                )
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    else -> Unit
                }
            }
        }
    }
}

@Composable
private fun PermissionRationaleView(
    onGrantClick: () -> Unit,
    onSettingsClick: () -> Unit
) {
    val colors = LocalCyberPulseColors.current

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Box(
            modifier = Modifier
                .size(80.dp)
                .background(colors.surfaceSecondary, CircleShape)
                .border(1.5.dp, colors.primaryAccent, CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Default.SdCard,
                contentDescription = null,
                tint = colors.primaryAccent,
                modifier = Modifier.size(40.dp)
            )
        }

        Spacer(modifier = Modifier.height(24.dp))

        Text(
            text = "DEVICE AUDIO PERMISSION",
            color = colors.textPrimary,
            fontSize = 18.sp,
            fontWeight = FontWeight.Bold,
            letterSpacing = 1.sp
        )

        Spacer(modifier = Modifier.height(12.dp))

        Text(
            text = "CyberPulse scans your local MediaStore to discover and play songs stored directly on your phone. Playback is 100% offline, lossless-capable, and private.",
            color = colors.textSecondary,
            fontSize = 13.sp,
            lineHeight = 19.sp,
            modifier = Modifier.padding(horizontal = 8.dp)
        )

        Spacer(modifier = Modifier.height(28.dp))

        Button(
            onClick = onGrantClick,
            colors = ButtonDefaults.buttonColors(containerColor = colors.primaryAccent),
            shape = RoundedCornerShape(8.dp),
            modifier = Modifier
                .fillMaxWidth()
                .height(48.dp)
        ) {
            Text(
                text = "ALLOW ACCESS",
                color = colors.backgroundPrimary,
                fontWeight = FontWeight.Bold,
                fontSize = 14.sp,
                letterSpacing = 1.sp
            )
        }

        Spacer(modifier = Modifier.height(12.dp))

        OutlinedButton(
            onClick = onSettingsClick,
            colors = ButtonDefaults.outlinedButtonColors(contentColor = colors.textPrimary),
            shape = RoundedCornerShape(8.dp),
            border = androidx.compose.foundation.BorderStroke(1.dp, colors.border),
            modifier = Modifier
                .fillMaxWidth()
                .height(48.dp)
        ) {
            Text(
                text = "OPEN APP SETTINGS",
                color = colors.textSecondary,
                fontSize = 13.sp
            )
        }
    }
}

@Composable
private fun LocalTrackListItem(
    track: Track,
    onClick: () -> Unit,
    onActionClick: () -> Unit
) {
    val colors = LocalCyberPulseColors.current

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(horizontal = 16.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Thumbnail or album artwork
        Box(
            modifier = Modifier
                .size(48.dp)
                .clip(RoundedCornerShape(6.dp))
                .background(colors.surfaceSecondary)
                .border(0.5.dp, colors.border, RoundedCornerShape(6.dp)),
            contentAlignment = Alignment.Center
        ) {
            if (!track.artworkUrl.isNullOrBlank()) {
                AsyncImage(
                    model = track.artworkUrl,
                    contentDescription = null,
                    modifier = Modifier.fillMaxSize(),
                    contentScale = ContentScale.Crop
                )
            } else {
                Icon(
                    imageVector = Icons.Default.MusicNote,
                    contentDescription = null,
                    tint = colors.primaryAccent,
                    modifier = Modifier.size(24.dp)
                )
            }
        }

        Spacer(modifier = Modifier.width(12.dp))

        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = track.title,
                color = colors.textPrimary,
                fontWeight = FontWeight.Medium,
                fontSize = 14.sp,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            Spacer(modifier = Modifier.height(2.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = "${track.artist} • ${track.album}",
                    color = colors.textSecondary,
                    fontSize = 12.sp,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.weight(1f, fill = false)
                )
                Spacer(modifier = Modifier.width(6.dp))
                // Lossless badge
                Surface(
                    color = colors.primaryAccent.copy(alpha = 0.12f),
                    shape = RoundedCornerShape(3.dp),
                    border = androidx.compose.foundation.BorderStroke(0.5.dp, colors.primaryAccent.copy(alpha = 0.4f))
                ) {
                    Text(
                        text = "LOCAL",
                        color = colors.primaryAccent,
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 4.dp, vertical = 1.dp)
                    )
                }
            }
        }

        Spacer(modifier = Modifier.width(8.dp))

        Text(
            text = track.formattedDuration,
            color = colors.textSecondary,
            fontSize = 11.sp
        )

        IconButton(onClick = onActionClick) {
            Icon(
                imageVector = Icons.Default.MoreVert,
                contentDescription = "Options",
                tint = colors.textSecondary,
                modifier = Modifier.size(20.dp)
            )
        }
    }
}

@Composable
private fun LocalAlbumCard(
    album: LocalAlbum,
    onClick: () -> Unit
) {
    val colors = LocalCyberPulseColors.current

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(8.dp)
    ) {
        Box(
            modifier = Modifier
                .aspectRatio(1f)
                .fillMaxWidth()
                .clip(RoundedCornerShape(8.dp))
                .background(colors.surfaceSecondary)
                .border(0.5.dp, colors.border, RoundedCornerShape(8.dp)),
            contentAlignment = Alignment.Center
        ) {
            if (album.artworkUri != null) {
                AsyncImage(
                    model = album.artworkUri,
                    contentDescription = null,
                    modifier = Modifier.fillMaxSize(),
                    contentScale = ContentScale.Crop
                )
            } else {
                Icon(
                    imageVector = Icons.Default.Album,
                    contentDescription = null,
                    tint = colors.primaryAccent,
                    modifier = Modifier.size(48.dp)
                )
            }
        }

        Spacer(modifier = Modifier.height(6.dp))

        Text(
            text = album.title,
            color = colors.textPrimary,
            fontWeight = FontWeight.SemiBold,
            fontSize = 13.sp,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
        )
        Text(
            text = "${album.artist} • ${album.trackCount} tracks",
            color = colors.textSecondary,
            fontSize = 11.sp,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
        )
    }
}

@Composable
private fun LocalArtistListItem(
    artist: LocalArtist,
    onClick: () -> Unit
) {
    val colors = LocalCyberPulseColors.current

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(46.dp)
                .clip(CircleShape)
                .background(colors.surfaceSecondary)
                .border(1.dp, colors.border, CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Default.Person,
                contentDescription = null,
                tint = colors.primaryAccent,
                modifier = Modifier.size(24.dp)
            )
        }

        Spacer(modifier = Modifier.width(14.dp))

        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = artist.name,
                color = colors.textPrimary,
                fontWeight = FontWeight.Medium,
                fontSize = 14.sp
            )
            Text(
                text = "${artist.trackCount} tracks • ${artist.albumCount} albums",
                color = colors.textSecondary,
                fontSize = 12.sp
            )
        }

        Icon(
            imageVector = Icons.Default.ChevronRight,
            contentDescription = null,
            tint = colors.textSecondary,
            modifier = Modifier.size(20.dp)
        )
    }
}

@Composable
private fun LocalFolderListItem(
    folder: LocalFolder,
    onClick: () -> Unit
) {
    val colors = LocalCyberPulseColors.current

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(42.dp)
                .clip(RoundedCornerShape(8.dp))
                .background(colors.surfaceSecondary)
                .border(0.5.dp, colors.border, RoundedCornerShape(8.dp)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Default.Folder,
                contentDescription = null,
                tint = colors.primaryAccent,
                modifier = Modifier.size(22.dp)
            )
        }

        Spacer(modifier = Modifier.width(14.dp))

        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = folder.name,
                color = colors.textPrimary,
                fontWeight = FontWeight.Medium,
                fontSize = 14.sp
            )
            Text(
                text = "${folder.trackCount} tracks",
                color = colors.textSecondary,
                fontSize = 12.sp
            )
        }

        Icon(
            imageVector = Icons.Default.ChevronRight,
            contentDescription = null,
            tint = colors.textSecondary,
            modifier = Modifier.size(20.dp)
        )
    }
}

@Composable
private fun LocalDetailTrackListView(
    title: String,
    subtitle: String,
    artworkUri: Uri?,
    tracks: List<Track>,
    onBack: () -> Unit,
    onTrackClick: (Track) -> Unit,
    onPlayAll: () -> Unit,
    onTrackActionClick: (Track) -> Unit
) {
    val colors = LocalCyberPulseColors.current

    Column(modifier = Modifier.fillMaxSize()) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 8.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = onBack) {
                Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = colors.textPrimary)
            }
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = title,
                    color = colors.textPrimary,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Text(
                    text = subtitle,
                    color = colors.textSecondary,
                    fontSize = 12.sp,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
            Button(
                onClick = onPlayAll,
                colors = ButtonDefaults.buttonColors(containerColor = colors.primaryAccent),
                shape = RoundedCornerShape(8.dp),
                contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp)
            ) {
                Icon(Icons.Default.PlayArrow, contentDescription = null, tint = colors.backgroundPrimary, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(4.dp))
                Text("PLAY ALL", color = colors.backgroundPrimary, fontSize = 11.sp, fontWeight = FontWeight.Bold)
            }
        }

        HorizontalDivider(color = colors.border, thickness = 0.5.dp)

        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(bottom = 120.dp)
        ) {
            items(tracks, key = { it.id }) { track ->
                LocalTrackListItem(
                    track = track,
                    onClick = { onTrackClick(track) },
                    onActionClick = { onTrackActionClick(track) }
                )
            }
        }
    }
}
