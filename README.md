# CyberPulse Music — Native Android Platform

> **A modern native Android music streaming and discovery application with an original cyberpunk visual identity.**

---

## 📌 Project Overview
**CyberPulse Music** is a high-performance native Android application engineered with **Kotlin**, **Jetpack Compose**, and **Material 3**. It establishes a source-agnostic architecture for modern music streaming, algorithmic discovery, atmospheric soundscapes, and cyberpunk UI craftsmanship.

- **Application ID:** `com.daddyizz.cyberpulse`
- **Application Name:** CyberPulse Music
- **Internal Codename:** CyberPulse
- **Current Milestone:** **Build Block 1: Native Android Foundation + Cyberpunk UI + Navigation + Onboarding**

---

## 🛠 Technology Stack
- **Language:** Kotlin 2.0.0
- **UI Framework:** Jetpack Compose (Compose BOM 2024.06.00)
- **Design System:** Material 3 with custom CyberPulse theme tokens
- **Architecture:** Clean Architecture (Core + Feature package modularity)
- **State Management:** ViewModel + StateFlow (reactive uni-directional data flow)
- **Navigation:** Navigation Compose + Adaptive NavigationRail (tablets & landscape)
- **Local Persistence:** AndroidX DataStore Preferences
- **Build System:** Gradle Kotlin DSL (AGP 8.5.0, Gradle 8.7)
- **Minimum SDK:** Android 7.0 (API 24)
- **Target / Compile SDK:** Android 14 (API 34)

---

## 📁 Architecture Overview
```
app/src/main/java/com/daddyizz/cyberpulse/
├── CyberPulseApplication.kt          # Application class
├── MainActivity.kt                    # Entry point Activity with Splash Screen
├── core/
│   ├── common/                        # AppResult, Constants, Key identifiers
│   ├── model/                         # Source-agnostic models: Track, Artist, Album,
│   │                                  # Playlist, Genre, UserProfile, MusicSourceProvider
│   ├── designsystem/                  # Design tokens: Color, Spacing, Typography, Themes,
│   │                                  # Reusable Components (Cards, Buttons, Headers, Chips)
│   ├── data/                          # DataStore UserPreferencesRepository, MusicRepository,
│   │                                  # DemoMusicSourceProvider
│   └── navigation/                    # Screen routes, CyberPulseNavHost, NavigationRail
└── feature/
    ├── onboarding/                    # 6-step Onboarding flow & ViewModel
    ├── home/                          # Home dashboard, dynamic time greeting, carousels
    ├── search/                        # Search input with local filtering & category matrix
    ├── explore/                       # Visual cyberpunk gradient categories (Moods, Decades, etc.)
    ├── library/                       # User library, quick filters, liked songs, offline cache shell
    ├── profile/                       # User profile, statistics, system menu
    ├── settings/                      # Preferences (Cyberpunk vs OLED Black, animation controls)
    └── player/                        # Persistent Mini-Player and full Now Playing modal
```

---

## 🚀 How to Build & Generate APK / AAB

### Prerequisites
1. **Android Studio Iguana | Koala | Jellyfish** or newer (or JDK 17+ with Android SDK tools).
2. Android SDK Platform 34 installed.

### Build Debug APK
Run via terminal inside the project root:
```bash
./gradlew assembleDebug
```
The generated APK will be located at:
```
app/build/outputs/apk/debug/app-debug.apk
```

### Install Debug APK via ADB
```bash
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

### Build Release Android App Bundle (AAB)
```bash
./gradlew bundleRelease
```
The generated bundle will be located at:
```
app/build/outputs/bundle/release/app-release.aab
```

---

## ✅ Block 1 Deliverables Checklist
- [x] **Native Kotlin Android Studio Project:** Complete Gradle setup with `app/build.gradle.kts` and `settings.gradle.kts`.
- [x] **Cyberpunk Design System:** Precision palette (`#07090F` primary, `#00F5FF` neon cyan, `#8B5CFF` electric purple, `#FF2ED1` cyber pink, `#B8FF2C` acid green, and `#000000` OLED Black).
- [x] **Adaptive App Icon:** Multi-layer vector adaptive icon with sound pulse / waveform play symbol.
- [x] **Android 12+ Splash Screen:** Seamless brand entrance into onboarding or home.
- [x] **6-Step Onboarding Flow:**
  - Screen 1: Welcome & brand thesis
  - Screen 2: Favorite Genres selection (16 selectable chips)
  - Screen 3: Favorite Artists selection (custom geometric avatar cards)
  - Screen 4: Personalization preferences toggle
  - Screen 5: Android runtime notification permission flow
  - Screen 6: Final calibration & entry
- [x] **DataStore Local Persistence:** Remembers onboarding completion, selected genres, artists, theme, and animation preferences across launches.
- [x] **Main Bottom Navigation & Rail:** 5 top-level destinations (Home, Search, Explore, Library, Profile) with tablet-responsive NavigationRail.
- [x] **Home Dashboard:** Dynamic time-of-day greeting, 6 horizontally scrolling sections (Recently Played, Made For You, Trending, New Releases, Mixes, Artists).
- [x] **Search with Instant Filtering:** Local search engine filtering tracks, artists, and playlists, plus browse categories.
- [x] **Explore Screen:** Cyberpunk atmospheric gradient cards for moods, genres, activities, and decades.
- [x] **Library Screen:** Quick filter chips, Liked Songs banner, and "Coming in a future update" offline download tags.
- [x] **Profile Screen:** Listener statistics, status tiers, and system menu with clean roadmap modal handlers.
- [x] **Settings Screen:** Theme switcher (Cyberpunk Dark vs. OLED True Black), animation toggle, and data saver.
- [x] **Mini Player & Now Playing:** Persistent mini-player above navigation bar with expand transition into full Now Playing screen (progress bar, shuffle, repeat, lyrics placeholder, queue).
- [x] **Source-Agnostic Model & Provider:** `MusicSourceProvider` abstraction ready for future streaming integrations.

---

## 🎧 Block 3C: Background Playback Hardening & Media Session Architecture

### Status: COMPLETED & VERIFIED

CyberPulse Music incorporates a production-hardened Android Media3 background playback architecture adhering strictly to Google Play media requirements, modern Android lifecycle constraints, and user-intent precedence.

### Architectural Breakdown

#### 1. Background Lifecycle & Foreground Service
- **Authoritative Service:** `CyberPulsePlaybackService` extends `androidx.media3.session.MediaLibraryService`. It is the single source of truth for the playback engine (`ExoPlayer`) and media session (`MediaLibrarySession`).
- **Foreground Transition:** When audio playback begins (`playWhenReady = true`), Media3 automatically transitions the service to a foreground service with a persistent system notification.
- **Service Termination (`onTaskRemoved`):** If the user clears the app from the Recents screen:
  - If audio is actively playing, the service remains alive in the background.
  - If playback is paused, stopped, or the queue is empty, `stopSelf()` is cleanly executed, releasing audio resources and removing notifications.

#### 2. Media Notification & Lock-Screen Behavior
- **Notification Channel:** Dedicated low-importance channel (`cyberpulse_media_playback`, `IMPORTANCE_LOW`) on Android 8.0+ (API 26+) prevents audible notification chimes during track changes or buffer events.
- **Android 13+ Runtime Permission:** `MainActivity` checks and prompts for `android.permission.POST_NOTIFICATIONS` at runtime without blocking playback.
- **Lock-Screen & System Controls:** `DefaultMediaNotificationProvider` delivers system media notification cards with interactive controls (Play/Pause, Next, Previous, Seek) and synchronized track metadata (Title, Artist, Album, and artwork).

#### 3. Audio Focus & Interruption Policy
Managed by `AudioFocusInterruptionPolicy`:
- **User-Intent Precedence:** Resumption occurs ONLY IF the player was actively playing audio immediately before the interruption and the user did NOT manually pause during the interruption.
- **Phone Calls:** Incoming ring and active phone calls trigger `AUDIOFOCUS_LOSS_TRANSIENT`, cleanly pausing audio. Playback automatically resumes once the call ends if user intent allows.
- **Navigation Voice Ducking:** Transient ducking (`AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK`) temporarily reduces ExoPlayer volume so GPS prompts (e.g., Google Maps) are clearly audible, automatically restoring full volume when complete.
- **Permanent Loss:** If another media application claims exclusive focus, playback permanently halts and clears resumption flags.

#### 4. Headset Disconnect & Becoming Noisy Behavior
- **`ACTION_AUDIO_BECOMING_NOISY`:** Enabled via `ExoPlayer.Builder.setHandleAudioBecomingNoisy(true)`.
- Disconnecting wired 3.5mm/USB-C headphones or disconnecting Bluetooth audio devices immediately triggers a pause, preventing accidental loudspeaker blasting in public spaces.

#### 5. Controller Reconnection & Session Restoration
- **Decoupled Architecture:** The UI connects to `CyberPulsePlaybackService` via `MediaController` asynchronously.
- **Process Death State Persistence:** `PlaybackRecoveryStore` persists minimal playback state (track IDs, queue order, position, shuffle, repeat mode) to `SharedPreferences` with throttled writes (15-second throttle during active playback, immediate upon pause/track transition).
- **Cold-Start Restoration:** When the application process is recreated, `PlaybackConnection.restoreSessionIfAvailable()` re-populates the player queue and seeks to the saved timestamp in a **paused state** (`playWhenReady = false`), ensuring audio never begins playing unexpectedly without user action.

#### 6. Network Interruption & Error Recovery
- **Exponential Backoff:** `PlaybackRecoveryPolicy` retries transient network interruptions with backoff intervals (1s, 2s, 4s) up to 3 retries.
- **Fatal Error Handling:** Non-recoverable errors (e.g., corrupt container, unsupported codec, missing 404 stream) bypass retries and present actionable diagnostic feedback without freezing the UI or spinning CPU threads.

---

## 🔮 Upcoming Roadmap
- **Block 4:** Official / Permitted Playback Source Strategy (Clean source resolution, licensed catalog endpoints, and CDN stream adapters).
- **Block 5:** Android Auto Integration (`MediaLibrarySession` browse tree and automotive display layouts).
- **Block 6:** Cloud backend synchronization & user account library backup.

