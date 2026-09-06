import React, { useState } from 'react';
import {
  Folder,
  FileCode,
  FileText,
  Copy,
  Check,
  Terminal,
  ShieldCheck,
  Layers,
  Sparkles,
  ExternalLink
} from 'lucide-react';

interface FileNode {
  path: string;
  name: string;
  type: 'file' | 'dir';
  language?: string;
  description: string;
  content: string;
}

const ANDROID_FILES: FileNode[] = [
  {
    path: 'app/build.gradle.kts',
    name: 'app/build.gradle.kts',
    type: 'file',
    language: 'kotlin',
    description: 'App Module Gradle Configuration with Compose & Material 3',
    content: `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.compose.compiler)
}

android {
    namespace = "com.daddyizz.cyberpulse"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.daddyizz.cyberpulse"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0-block1"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    implementation(platform("androidx.compose:compose-bom:2024.06.00"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")
    implementation("androidx.navigation:navigation-compose:2.7.7")
    implementation("androidx.datastore:datastore-preferences:1.1.1")
    implementation("androidx.core:core-splashscreen:1.0.1")
}`
  },
  {
    path: 'app/src/main/AndroidManifest.xml',
    name: 'AndroidManifest.xml',
    type: 'file',
    language: 'xml',
    description: 'Android Manifest with App Theme, Icon, and Permissions',
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

    <application
        android:name=".CyberPulseApplication"
        android:allowBackup="true"
        android:dataExtractionRules="@xml/data_extraction_rules"
        android:fullBackupContent="@xml/backup_rules"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.CyberPulse.Splash">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:theme="@style/Theme.CyberPulse.Splash"
            android:windowSoftInputMode="adjustResize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`
  },
  {
    path: 'app/src/main/java/com/daddyizz/cyberpulse/MainActivity.kt',
    name: 'MainActivity.kt',
    type: 'file',
    language: 'kotlin',
    description: 'Main Activity Entry Point with Splash & Dynamic Theme',
    content: `package com.daddyizz.cyberpulse

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.navigation.compose.rememberNavController
import com.daddyizz.cyberpulse.core.data.MusicRepository
import com.daddyizz.cyberpulse.core.data.UserPreferences
import com.daddyizz.cyberpulse.core.data.UserPreferencesRepository
import com.daddyizz.cyberpulse.core.designsystem.CyberPulseTheme
import com.daddyizz.cyberpulse.core.navigation.CyberPulseNavHost

class MainActivity : ComponentActivity() {
    private lateinit var preferencesRepository: UserPreferencesRepository
    private lateinit var musicRepository: MusicRepository

    override fun onCreate(savedInstanceState: Bundle?) {
        val splashScreen = installSplashScreen()
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        preferencesRepository = UserPreferencesRepository(applicationContext)
        musicRepository = MusicRepository()

        setContent {
            val userPreferences by preferencesRepository.userPreferencesFlow
                .collectAsState(initial = UserPreferences())

            CyberPulseTheme(themeName = userPreferences.theme) {
                val navController = rememberNavController()
                Surface(modifier = Modifier.fillMaxSize()) {
                    CyberPulseNavHost(
                        navController = navController,
                        preferencesRepository = preferencesRepository,
                        musicRepository = musicRepository,
                        userPreferences = userPreferences
                    )
                }
            }
        }
    }
}`
  },
  {
    path: 'app/src/main/java/com/daddyizz/cyberpulse/core/designsystem/Color.kt',
    name: 'Color.kt',
    type: 'file',
    language: 'kotlin',
    description: 'Precision Cyberpunk & OLED Color Tokens',
    content: `package com.daddyizz.cyberpulse.core.designsystem

import androidx.compose.ui.graphics.Color

val CyberBg = Color(0xFF07090F)          // Primary Background
val CyberOledBg = Color(0xFF000000)      // OLED Black
val CyberSurface1 = Color(0xFF0E131F)    // Surface Primary
val CyberSurface2 = Color(0xFF141A29)    // Surface Secondary
val CyberCardBg = Color(0xFF101626)      // Card Surface
val CyberBorder = Color(0xFF1F2436)      // Subtle Border

val NeonCyan = Color(0xFF00F5FF)         // Primary Neon Accent
val ElectricPurple = Color(0xFF8B5CFF)   // Secondary Accent
val CyberPink = Color(0xFFFF2ED1)        // Tertiary Accent
val AcidGreen = Color(0xFFB8FF2C)        // Success / Accent
val WarningAmber = Color(0xFFFFB800)     // Warning Accent
val AlertRed = Color(0xFFFF3366)         // Error Accent`
  },
  {
    path: 'app/src/main/java/com/daddyizz/cyberpulse/core/data/DemoMusicSourceProvider.kt',
    name: 'DemoMusicSourceProvider.kt',
    type: 'file',
    language: 'kotlin',
    description: 'Source-Agnostic Music Provider Implementation',
    content: `package com.daddyizz.cyberpulse.core.data

import com.daddyizz.cyberpulse.core.model.*

class DemoMusicSourceProvider : MusicSourceProvider {
    override val providerName: String = "CyberPulse Local Engine"
    override val providerSource: MusicSource = MusicSource.DEMO

    private val demoTracks = listOf(
        Track("trk_01", "Blinding Lights", "The Weeknd", "After Hours", "neon_horizon", 200, MusicSource.DEMO),
        Track("trk_02", "Nightcall", "Kavinsky", "OutRun", "purple_pulse", 259, MusicSource.DEMO),
        Track("trk_03", "Harder, Better, Faster, Stronger", "Daft Punk", "Discovery", "cyber_grid", 224, MusicSource.DEMO),
        Track("trk_04", "Midnight City", "M83", "Hurry Up, We're Dreaming", "neon_horizon", 243, MusicSource.DEMO),
        Track("trk_05", "Turbo Killer", "Carpenter Brut", "Trilogy", "purple_pulse", 208, MusicSource.DEMO)
    )

    override suspend fun search(query: String): List<Track> = demoTracks.filter {
        it.title.contains(query, ignoreCase = true) || it.artist.contains(query, ignoreCase = true)
    }

    override suspend fun getTrack(trackId: String): Track? = demoTracks.find { it.id == trackId }
}`
  },
  {
    path: 'app/src/main/java/com/daddyizz/cyberpulse/feature/onboarding/OnboardingScreen.kt',
    name: 'OnboardingScreen.kt',
    type: 'file',
    language: 'kotlin',
    description: '6-Step Animated Onboarding Flow in Jetpack Compose',
    content: `// Step 1: Logo, "Your Music. Your Universe." -> Get Started
// Step 2: Favorite Genres (16 selectable chips)
// Step 3: Favorite Artists (Geometric avatar cards)
// Step 4: Personalization recommendations toggle
// Step 5: Android runtime notifications permission flow
// Step 6: "You're ready." -> Enter CyberPulse`
  },
  {
    path: 'app/src/main/java/com/daddyizz/cyberpulse/core/model/MusicSourceProvider.kt',
    name: 'MusicSourceProvider.kt',
    type: 'file',
    language: 'kotlin',
    description: 'Source-Agnostic Music Provider Interface (Search, Entity Metadata, Capabilities)',
    content: `package com.daddyizz.cyberpulse.core.model

import com.daddyizz.cyberpulse.core.common.AppResult

interface MusicSourceProvider {
    val providerName: String
    val providerSource: MusicSource

    suspend fun search(query: String, filter: SearchFilter = SearchFilter.ALL, pageToken: String? = null): AppResult<SearchResultPage>
    suspend fun getTrack(id: String): AppResult<Track?>
    suspend fun getArtist(id: String): AppResult<Artist?>
    suspend fun getAlbum(id: String): AppResult<Album?>
    suspend fun getPlaylist(id: String): AppResult<Playlist?>
    suspend fun getArtistTopTracks(id: String): AppResult<List<Track>>
    suspend fun getArtistAlbums(id: String): AppResult<List<Album>>
    suspend fun getRelatedTracks(id: String): AppResult<List<Track>>
    fun getPlaybackCapability(track: Track): PlaybackCapability
}`
  },
  {
    path: 'app/src/main/java/com/daddyizz/cyberpulse/core/provider/YouTubeMetadataProvider.kt',
    name: 'YouTubeMetadataProvider.kt',
    type: 'file',
    language: 'kotlin',
    description: 'Public YouTube Data API v3 Metadata Provider (Terms Compliant)',
    content: `package com.daddyizz.cyberpulse.core.provider

import com.daddyizz.cyberpulse.core.common.*
import com.daddyizz.cyberpulse.core.model.*
import com.daddyizz.cyberpulse.core.network.YouTubeApiService
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class YouTubeMetadataProvider(
    private val apiService: YouTubeApiService,
    private val apiKey: String
) : MusicSourceProvider {
    override val providerName: String = "YouTube Music Metadata"
    override val providerSource: MusicSource = MusicSource.YOUTUBE

    override suspend fun search(query: String, filter: SearchFilter, pageToken: String?): AppResult<SearchResultPage> =
        withContext(Dispatchers.IO) {
            try {
                val response = apiService.search(apiKey = apiKey, query = query, pageToken = pageToken)
                val items = response.items.mapNotNull { it.toSearchResultItem() }
                AppResult.Success(SearchResultPage(items = items, nextPageToken = response.nextPageToken))
            } catch (e: Exception) {
                AppResult.Error(CyberPulseError.fromThrowable(e))
            }
        }
}`
  },
  {
    path: 'app/src/main/java/com/daddyizz/cyberpulse/core/data/SearchRepository.kt',
    name: 'SearchRepository.kt',
    type: 'file',
    language: 'kotlin',
    description: 'Unified Search Orchestration with TTL In-Memory Cache and Offline Fallback',
    content: `package com.daddyizz.cyberpulse.core.data

import com.daddyizz.cyberpulse.core.cache.MetadataCache
import com.daddyizz.cyberpulse.core.common.AppResult
import com.daddyizz.cyberpulse.core.model.*

class SearchRepository(
    private val primaryProvider: MusicSourceProvider,
    private val fallbackProvider: MusicSourceProvider,
    private val cache: MetadataCache = MetadataCache()
) {
    suspend fun search(query: String, filter: SearchFilter, pageToken: String? = null): AppResult<SearchResultPage> {
        val cacheKey = "\${filter.name}_\${query}_\${pageToken ?: "p0"}"
        val cached = cache.getSearch(cacheKey)
        if (cached != null) return AppResult.Success(cached.copy(isFromCache = true))

        val primaryResult = primaryProvider.search(query, filter, pageToken)
        if (primaryResult is AppResult.Success) {
            cache.putSearch(cacheKey, primaryResult.data)
            return primaryResult
        }
        return fallbackProvider.search(query, filter, pageToken)
    }
}`
  },
  {
    path: 'app/src/main/java/com/daddyizz/cyberpulse/feature/details/ArtistDetailScreen.kt',
    name: 'ArtistDetailScreen.kt',
    type: 'file',
    language: 'kotlin',
    description: 'Native Jetpack Compose Artist Detail Screen with Hero & Discography',
    content: `// Artist hero banner with avatar, monthly listeners, follow button
// Top tracks lazy row with duration and play button
// Discography albums & singles grid
// Deep links to AlbumDetailScreen`
  },
  {
    path: 'app/src/main/java/com/daddyizz/cyberpulse/feature/details/AlbumDetailScreen.kt',
    name: 'AlbumDetailScreen.kt',
    type: 'file',
    language: 'kotlin',
    description: 'Native Jetpack Compose Album Detail Screen with Tracklist',
    content: `// Album cover art, artist link, release year, track count
// Play All & Shuffle action controls
// Indexed tracklist with individual track selection`
  },
  {
    path: 'app/src/main/java/com/daddyizz/cyberpulse/feature/details/PlaylistDetailScreen.kt',
    name: 'PlaylistDetailScreen.kt',
    type: 'file',
    language: 'kotlin',
    description: 'Native Jetpack Compose Playlist Detail Screen with Media3 Queue Playback',
    content: `// Playlist cover, curator badge, description
// Real Media3 queue playback for Play All, Shuffle, and individual track taps
// Track Action overflow integration and YouTube external notice`
  },
  {
    path: 'app/src/main/java/com/daddyizz/cyberpulse/feature/player/NowPlayingScreen.kt',
    name: 'NowPlayingScreen.kt',
    type: 'file',
    language: 'kotlin',
    description: 'Block 3B Native Now Playing Screen with Live Scrubbing & Adaptive Layout',
    content: `package com.daddyizz.cyberpulse.feature.player

// - Phone & Tablet / Wide Dual-Column Layout
// - Live ScrubbingSlider with isScrubbing jitter-free position tracking
// - Media3 State-synced Play/Pause, Shuffle, Repeat (OFF, ONE, ALL), Skip Next/Prev
// - Authoritative Queue Sheet & Track Overflow Actions trigger`
  },
  {
    path: 'app/src/main/java/com/daddyizz/cyberpulse/feature/player/QueueView.kt',
    name: 'QueueView.kt',
    type: 'file',
    language: 'kotlin',
    description: 'Block 3B Authoritative Queue Bottom Sheet with Reordering and Clear',
    content: `package com.daddyizz.cyberpulse.feature.player

// - Displays Now Playing track and upcoming queue
// - Queue reordering via moveQueueItem up/down controls
// - Single item removal via swipe / icon tap
// - Clear queue functionality with state synchronization`
  },
  {
    path: 'app/src/main/java/com/daddyizz/cyberpulse/feature/player/TrackActionBottomSheet.kt',
    name: 'TrackActionBottomSheet.kt',
    type: 'file',
    language: 'kotlin',
    description: 'Block 3B Track Overflow Actions Sheet (Play Next, Add to Queue, Like, Playlist)',
    content: `package com.daddyizz.cyberpulse.feature.player

// - Play Now (Capability aware: direct playback vs external notice)
// - Play Next (Inserts track immediately after current index in Media3 queue)
// - Add to Queue (Appends track to authoritative queue)
// - Toggle Like / Add to User Playlist dialog
// - Source Information & YouTube Terms compliance details`
  },
  {
    path: 'app/src/main/java/com/daddyizz/cyberpulse/feature/player/lyrics/LyricsScreen.kt',
    name: 'LyricsScreen.kt',
    type: 'file',
    language: 'kotlin',
    description: 'Block 9A Synced Cyber Lyrics with LRC Parsing & Line Seeking',
    content: `package com.daddyizz.cyberpulse.feature.player.lyrics

// - Synced lyrics parser & auto-scroll engine
// - Tap-to-seek to lyric timestamp in Media3
// - Support for plain, synchronized, and missing lyrics fallback
// - Copyright compliant provider abstraction (Local & Licensed only)`
  },
  {
    path: 'app/src/main/java/com/daddyizz/cyberpulse/feature/player/visualizer/VisualizerCanvas.kt',
    name: 'VisualizerCanvas.kt',
    type: 'file',
    language: 'kotlin',
    description: 'Block 9A Audio Visualizer Canvas with 5 Cyber Modes & Pro Gating',
    content: `package com.daddyizz.cyberpulse.feature.player.visualizer

// - 5 Cyber Visualizer Modes: Neon Wave, Spectrum Pulse, Cyber Grid, Orbital, Particle Flow
// - CyberPulse Pro Entitlement gating for advanced visualizer modes
// - YouTube Protected Source detection: switches to Ambient Simulated Pulse
// - Hardware-accelerated Compose Canvas rendering`
  },
  {
    path: 'README.md',
    name: 'README.md',
    type: 'file',
    language: 'markdown',
    description: 'Comprehensive Project Documentation & Gradle Build Guide',
    content: `# CyberPulse Music — Native Android Platform

Build Block 1: Native Android Foundation + Cyberpunk UI + Navigation + Onboarding

- Application ID: com.daddyizz.cyberpulse
- UI Framework: Jetpack Compose + Material 3
- Language: Kotlin 2.0.0
- Build: ./gradlew assembleDebug`
  }
];

export const CodebaseExplorer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<FileNode>(ANDROID_FILES[0]);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#07090F] border border-[#1F2436] rounded-2xl overflow-hidden shadow-2xl">
      {/* Top Banner */}
      <div className="bg-[#0E131F] border-b border-[#1F2436] px-5 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#00F5FF]/15 border border-[#00F5FF] flex items-center justify-center text-[#00F5FF]">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <span>com.daddyizz.cyberpulse</span>
              <span className="text-[10px] bg-[#00F5FF]/20 text-[#00F5FF] px-2 py-0.5 rounded-full font-mono">
                Block 1 Foundation
              </span>
            </div>
            <div className="text-xs text-gray-400">Native Android Kotlin + Jetpack Compose Architecture</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#1F2436] bg-[#07090F] hover:border-[#00F5FF] text-xs text-gray-300 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Code'}</span>
          </button>
        </div>
      </div>

      {/* Main split: File tree on left, code viewer on right */}
      <div className="flex-1 flex overflow-hidden">
        {/* File Tree Panel */}
        <div className="w-72 border-r border-[#1F2436] bg-[#0A0D17] flex flex-col p-3 overflow-y-auto">
          <div className="text-[11px] font-mono uppercase tracking-wider text-gray-400 px-2 py-1.5 mb-2">
            Native Source Tree
          </div>
          <div className="space-y-1">
            {ANDROID_FILES.map((file) => {
              const isSelected = selectedFile.path === file.path;
              return (
                <button
                  key={file.path}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all flex items-start gap-2.5 ${
                    isSelected
                      ? 'bg-[#00F5FF]/15 text-[#00F5FF] font-semibold border border-[#00F5FF]/30'
                      : 'text-gray-300 hover:bg-white/5'
                  }`}
                >
                  <FileCode className="w-4 h-4 shrink-0 mt-0.5 text-gray-400" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-mono text-[11px]">{file.name}</div>
                    <div className="text-[10px] text-gray-500 line-clamp-1">{file.description}</div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-auto pt-4 border-t border-[#1F2436] space-y-2">
            <div className="text-[11px] font-semibold text-gray-400">Build Commands</div>
            <div className="bg-[#07090F] p-2.5 rounded-xl border border-[#1F2436] font-mono text-[10px] text-[#00F5FF] space-y-1">
              <div>./gradlew assembleDebug</div>
              <div className="text-gray-500"># Output: app-debug.apk</div>
              <div>adb install -r app/build/...</div>
            </div>
          </div>
        </div>

        {/* Code Content Viewer */}
        <div className="flex-1 flex flex-col bg-[#07090F] overflow-hidden">
          <div className="px-4 py-2.5 border-b border-[#1F2436] bg-[#0A0D17] flex items-center justify-between text-xs text-gray-400 font-mono">
            <span>{selectedFile.path}</span>
            <span className="text-gray-500 uppercase">{selectedFile.language}</span>
          </div>
          <div className="flex-1 overflow-auto p-4 font-mono text-xs text-gray-200 leading-relaxed select-text">
            <pre className="whitespace-pre">{selectedFile.content}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};
