package com.daddyizz.cyberpulse.core.navigation

sealed class Screen(val route: String) {
    data object Splash : Screen("splash")
    data object Onboarding : Screen("onboarding")
    data object Home : Screen("home")
    data object Search : Screen("search")
    data object Explore : Screen("explore")
    data object Library : Screen("library")
    data object Profile : Screen("profile")
    data object Settings : Screen("settings")
    data object PlaybackLab : Screen("playback_lab")
    data object NowPlaying : Screen("now_playing")
    data object OnThisDevice : Screen("on_this_device")
    data object CyberRadio : Screen("cyber_radio")
    data object ComingSoon : Screen("coming_soon/{featureName}") {
        fun createRoute(featureName: String) = "coming_soon/$featureName"
    }

    // Block 2: Detailed entity navigation
    data object ArtistDetail : Screen("artist_detail/{artistId}") {
        fun createRoute(artistId: String) = "artist_detail/$artistId"
    }
    data object AlbumDetail : Screen("album_detail/{albumId}") {
        fun createRoute(albumId: String) = "album_detail/$albumId"
    }
    data object PlaylistDetail : Screen("playlist_detail/{playlistId}") {
        fun createRoute(playlistId: String) = "playlist_detail/$playlistId"
    }
}
