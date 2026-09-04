package com.daddyizz.cyberpulse.core.navigation

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.navigation.NavHostController
import androidx.navigation.compose.*
import com.daddyizz.cyberpulse.core.data.MusicRepository
import com.daddyizz.cyberpulse.core.data.UserPreferences
import com.daddyizz.cyberpulse.core.data.UserPreferencesRepository
import com.daddyizz.cyberpulse.core.designsystem.*
import com.daddyizz.cyberpulse.core.model.Track
import com.daddyizz.cyberpulse.core.player.PlaybackConnection
import com.daddyizz.cyberpulse.feature.details.AlbumDetailScreen
import com.daddyizz.cyberpulse.feature.details.ArtistDetailScreen
import com.daddyizz.cyberpulse.feature.details.PlaylistDetailScreen
import com.daddyizz.cyberpulse.feature.explore.ExploreScreen
import com.daddyizz.cyberpulse.feature.home.HomeScreen
import com.daddyizz.cyberpulse.feature.home.HomeViewModel
import com.daddyizz.cyberpulse.feature.library.LibraryScreen
import com.daddyizz.cyberpulse.feature.local.OnThisDeviceScreen
import com.daddyizz.cyberpulse.feature.onboarding.OnboardingScreen
import com.daddyizz.cyberpulse.feature.onboarding.OnboardingViewModel
import com.daddyizz.cyberpulse.feature.player.NowPlayingScreen
import com.daddyizz.cyberpulse.feature.player.PlayerViewModel
import com.daddyizz.cyberpulse.feature.player.QueueBottomSheet
import com.daddyizz.cyberpulse.feature.player.TrackActionBottomSheet
import com.daddyizz.cyberpulse.feature.profile.ProfileScreen
import com.daddyizz.cyberpulse.feature.radio.CyberRadioScreen
import com.daddyizz.cyberpulse.feature.search.SearchScreen
import com.daddyizz.cyberpulse.feature.search.SearchViewModel
import com.daddyizz.cyberpulse.feature.settings.PlaybackLabScreen
import com.daddyizz.cyberpulse.feature.settings.SettingsScreen
import com.daddyizz.cyberpulse.feature.settings.SettingsViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CyberPulseNavHost(
    navController: NavHostController,
    preferencesRepository: UserPreferencesRepository,
    musicRepository: MusicRepository,
    userPreferences: UserPreferences,
    modifier: Modifier = Modifier
) {
    val colors = LocalCyberPulseColors.current
    val context = LocalContext.current
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route ?: Screen.Home.route

    // ViewModels & Services
    val playbackConnection = remember { PlaybackConnection.getInstance(context) }
    val homeViewModel = remember { HomeViewModel(musicRepository) }
    val searchViewModel = remember { SearchViewModel(musicRepository) }
    val settingsViewModel = remember { SettingsViewModel(preferencesRepository) }
    val playerViewModel = remember { PlayerViewModel(musicRepository, playbackConnection) }
    val playerState by playerViewModel.uiState.collectAsState()

    var showNowPlayingModal by remember { mutableStateOf(false) }
    var activeComingSoonDialogTitle by remember { mutableStateOf<String?>(null) }
    var showLyricsDialog by remember { mutableStateOf(false) }
    var showQueueSheet by remember { mutableStateOf(false) }
    var activeTrackAction by remember { mutableStateOf<Track?>(null) }

    val isTopLevelDestination = currentRoute in listOf(
        Screen.Home.route,
        Screen.Search.route,
        Screen.Explore.route,
        Screen.Library.route,
        Screen.Profile.route
    )

    BoxWithConstraints(modifier = modifier.fillMaxSize()) {
        val isWideScreen = maxWidth > 600.dp

        Row(modifier = Modifier.fillMaxSize()) {
            // Adaptive Navigation Rail for Tablets / Landscape
            if (isWideScreen && isTopLevelDestination) {
                NavigationRail(
                    containerColor = colors.surfaceSecondary,
                    contentColor = colors.textPrimary,
                    modifier = Modifier
                        .fillMaxHeight()
                        .width(80.dp)
                        .border(width = 0.5.dp, color = colors.border)
                ) {
                    val items = listOf(
                        Triple(Screen.Home.route, "Home", Icons.Default.Home),
                        Triple(Screen.Search.route, "Search", Icons.Default.Search),
                        Triple(Screen.Explore.route, "Explore", Icons.Default.Explore),
                        Triple(Screen.Library.route, "Library", Icons.Default.LibraryMusic),
                        Triple(Screen.Profile.route, "Profile", Icons.Default.Person)
                    )
                    Spacer(modifier = Modifier.height(CyberSpacing.md))
                    items.forEach { (route, label, icon) ->
                        val isSelected = currentRoute == route
                        NavigationRailItem(
                            selected = isSelected,
                            onClick = {
                                if (currentRoute != route) {
                                    navController.navigate(route) {
                                        popUpTo(Screen.Home.route) { saveState = true }
                                        launchSingleTop = true
                                        restoreState = true
                                    }
                                }
                            },
                            icon = { Icon(icon, contentDescription = label) },
                            label = { Text(label) },
                            colors = NavigationRailItemDefaults.colors(
                                selectedIconColor = colors.primaryAccent,
                                selectedTextColor = colors.primaryAccent,
                                unselectedIconColor = colors.textMuted,
                                unselectedTextColor = colors.textMuted,
                                indicatorColor = colors.primaryAccent.copy(alpha = 0.15f)
                            )
                        )
                    }
                }
            }

            // Main Content Area
            Box(modifier = Modifier.weight(1f).fillMaxHeight()) {
                NavHost(
                    navController = navController,
                    startDestination = if (userPreferences.isOnboardingCompleted) Screen.Home.route else Screen.Onboarding.route
                ) {
                    composable(Screen.Onboarding.route) {
                        val onboardingVm = remember { OnboardingViewModel(preferencesRepository) }
                        OnboardingScreen(
                            viewModel = onboardingVm,
                            onComplete = {
                                navController.navigate(Screen.Home.route) {
                                    popUpTo(Screen.Onboarding.route) { inclusive = true }
                                }
                            }
                        )
                    }

                    composable(Screen.Home.route) {
                        HomeScreen(
                            viewModel = homeViewModel,
                            onTrackSelect = { track ->
                                playerViewModel.selectTrack(track)
                            },
                            onPlaylistSelect = { playlist ->
                                navController.navigate(Screen.PlaylistDetail.createRoute(playlist.id))
                            },
                            onArtistSelect = { artist ->
                                navController.navigate(Screen.ArtistDetail.createRoute(artist.id))
                            },
                            onProfileClick = { navController.navigate(Screen.Profile.route) },
                            onSettingsClick = { navController.navigate(Screen.Settings.route) }
                        )
                    }

                    composable(Screen.Search.route) {
                        SearchScreen(
                            viewModel = searchViewModel,
                            onTrackSelect = { track ->
                                playerViewModel.selectTrack(track)
                            },
                            onArtistSelect = { artistId ->
                                navController.navigate(Screen.ArtistDetail.createRoute(artistId))
                            },
                            onAlbumSelect = { albumId ->
                                navController.navigate(Screen.AlbumDetail.createRoute(albumId))
                            },
                            onPlaylistSelect = { playlistId ->
                                navController.navigate(Screen.PlaylistDetail.createRoute(playlistId))
                            },
                            onTrackAction = { track ->
                                activeTrackAction = track
                            }
                        )
                    }

                    composable(Screen.Explore.route) {
                        ExploreScreen(
                            onCategoryClick = { category ->
                                searchViewModel.onQueryChanged(category)
                                navController.navigate(Screen.Search.route)
                            }
                        )
                    }

                    composable(Screen.Library.route) {
                        LibraryScreen(
                            musicRepository = musicRepository,
                            onPlayQueue = { tracks, startIndex ->
                                playerViewModel.playQueue(tracks, startIndex)
                            },
                            onPlaylistClick = { playlist ->
                                navController.navigate(Screen.PlaylistDetail.createRoute(playlist.id))
                            },
                            onTrackAction = { track ->
                                activeTrackAction = track
                            }
                        )
                    }

                    composable(Screen.Profile.route) {
                        ProfileScreen(
                            onNavigateToSettings = { navController.navigate(Screen.Settings.route) },
                            onFeatureClick = { feature ->
                                activeComingSoonDialogTitle = feature
                            }
                        )
                    }

                    composable(Screen.Settings.route) {
                        SettingsScreen(
                            viewModel = settingsViewModel,
                            onBackClick = { navController.popBackStack() },
                            onComingSoon = { feature ->
                                activeComingSoonDialogTitle = feature
                            },
                            onOpenPlaybackLab = {
                                navController.navigate(Screen.PlaybackLab.route)
                            }
                        )
                    }

                    composable(Screen.PlaybackLab.route) {
                        PlaybackLabScreen(
                            playerViewModel = playerViewModel,
                            onBackClick = { navController.popBackStack() }
                        )
                    }

                    // Block 2 & 3: Detail Screens
                    composable(Screen.ArtistDetail.route) { backStackEntry ->
                        val artistId = backStackEntry.arguments?.getString("artistId") ?: ""
                        ArtistDetailScreen(
                            artistId = artistId,
                            musicRepository = musicRepository,
                            onBack = { navController.popBackStack() },
                            onPlayQueue = { tracks, startIndex ->
                                playerViewModel.playQueue(tracks, startIndex)
                            },
                            onAlbumSelect = { albumId -> navController.navigate(Screen.AlbumDetail.createRoute(albumId)) },
                            onTrackAction = { track -> activeTrackAction = track }
                        )
                    }

                    composable(Screen.AlbumDetail.route) { backStackEntry ->
                        val albumId = backStackEntry.arguments?.getString("albumId") ?: ""
                        AlbumDetailScreen(
                            albumId = albumId,
                            musicRepository = musicRepository,
                            onBack = { navController.popBackStack() },
                            onPlayQueue = { tracks, startIndex ->
                                playerViewModel.playQueue(tracks, startIndex)
                            },
                            onArtistSelect = { artistId -> navController.navigate(Screen.ArtistDetail.createRoute(artistId)) },
                            onTrackAction = { track -> activeTrackAction = track }
                        )
                    }

                    composable(Screen.PlaylistDetail.route) { backStackEntry ->
                        val playlistId = backStackEntry.arguments?.getString("playlistId") ?: ""
                        PlaylistDetailScreen(
                            playlistId = playlistId,
                            musicRepository = musicRepository,
                            onBack = { navController.popBackStack() },
                            onPlayQueue = { tracks, startIndex ->
                                playerViewModel.playQueue(tracks, startIndex)
                            },
                            onTrackAction = { track -> activeTrackAction = track }
                        )
                    }
                }

                // Docked Bottom Nav + Mini Player for standard screens
                if (isTopLevelDestination) {
                    Column(
                        modifier = Modifier
                            .align(Alignment.BottomCenter)
                            .fillMaxWidth()
                    ) {
                        // Authoritative Persistent Mini Player
                        if (playerState.currentTrack != null) {
                            CyberMiniPlayerPlaceholder(
                                currentTrack = playerState.currentTrack,
                                isPlaying = playerState.isPlaying,
                                isBuffering = playerState.isBuffering,
                                onPlayPauseToggle = { playerViewModel.togglePlayPause() },
                                onNextClick = { playerViewModel.skipToNext() },
                                onPreviousClick = { playerViewModel.skipToPrevious() },
                                onExpandClick = { showNowPlayingModal = true },
                                progressFraction = playerState.progressFraction
                            )
                        }

                        // Bottom Navigation for phones / non-wide screens
                        if (!isWideScreen) {
                            CyberBottomNavigation(
                                selectedRoute = currentRoute,
                                onNavigate = { route ->
                                    if (currentRoute != route) {
                                        navController.navigate(route) {
                                            popUpTo(Screen.Home.route) { saveState = true }
                                            launchSingleTop = true
                                            restoreState = true
                                        }
                                    }
                                }
                            )
                        }
                    }
                }
            }
        }

        // Full Screen Now Playing Modal
        if (showNowPlayingModal && playerState.currentTrack != null) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(colors.background)
            ) {
                NowPlayingScreen(
                    viewModel = playerViewModel,
                    onCollapseClick = { showNowPlayingModal = false },
                    onOpenLyrics = { showLyricsDialog = true },
                    onOpenQueue = { showQueueSheet = true }
                )
            }
        }

        // Authoritative Queue Modal Sheet
        if (showQueueSheet) {
            QueueBottomSheet(
                viewModel = playerViewModel,
                onDismiss = { showQueueSheet = false }
            )
        }

        // Track Action Overflow Sheet
        activeTrackAction?.let { track ->
            TrackActionBottomSheet(
                track = track,
                playerViewModel = playerViewModel,
                musicRepository = musicRepository,
                onDismiss = { activeTrackAction = null },
                onNavigateToArtist = { artistId ->
                    activeTrackAction = null
                    navController.navigate(Screen.ArtistDetail.createRoute(artistId))
                },
                onNavigateToAlbum = { albumId ->
                    activeTrackAction = null
                    navController.navigate(Screen.AlbumDetail.createRoute(albumId))
                }
            )
        }

        // General Dialog for Future Blocks
        if (activeComingSoonDialogTitle != null) {
            AlertDialog(
                onDismissRequest = { activeComingSoonDialogTitle = null },
                containerColor = colors.surfaceElevated,
                title = {
                    Text(
                        text = activeComingSoonDialogTitle ?: "",
                        style = MaterialTheme.typography.titleLarge,
                        color = colors.textPrimary
                    )
                },
                text = {
                    Text(
                        text = "This module is slated for subsequent CyberPulse blocks.\n\nBlock 3B delivers the authoritative Media3 playback UI, reactive Queue bottom sheet, Live scrubbing, and cross-screen queue synchronization.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = colors.textSecondary
                    )
                },
                confirmButton = {
                    TextButton(onClick = { activeComingSoonDialogTitle = null }) {
                        Text("Acknowledge", color = colors.primaryAccent)
                    }
                }
            )
        }

        // Lyrics Dialog
        if (showLyricsDialog) {
            AlertDialog(
                onDismissRequest = { showLyricsDialog = false },
                containerColor = colors.surfaceElevated,
                title = {
                    Text("Synced Cyber Lyrics", style = MaterialTheme.typography.titleLarge, color = colors.textPrimary)
                },
                text = {
                    Column {
                        Text(
                            text = "“Neon veins across the concrete grid,\nPulses rising where the shadows hid,\nSynthetic dreams beneath the chrome,\nCyberPulse is calling home.”",
                            style = MaterialTheme.typography.bodyLarge,
                            color = colors.primaryAccent
                        )
                        Spacer(modifier = Modifier.height(CyberSpacing.md))
                        Text(
                            text = "Time-synced LRC provider will be integrated in future blocks.",
                            style = MaterialTheme.typography.labelMedium,
                            color = colors.textMuted
                        )
                    }
                },
                confirmButton = {
                    TextButton(onClick = { showLyricsDialog = false }) {
                        Text("Close", color = colors.primaryAccent)
                    }
                }
            )
        }
    }
}
