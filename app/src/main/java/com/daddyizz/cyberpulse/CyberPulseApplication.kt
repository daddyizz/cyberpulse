package com.daddyizz.cyberpulse

import android.app.Application
import com.daddyizz.cyberpulse.core.ads.AdManager
import com.daddyizz.cyberpulse.core.ads.ConsentManager
import com.daddyizz.cyberpulse.core.billing.BillingManager
import com.daddyizz.cyberpulse.core.billing.EntitlementRepository
import com.daddyizz.cyberpulse.core.data.MusicRepository
import com.daddyizz.cyberpulse.core.data.UserPreferencesRepository
import com.daddyizz.cyberpulse.core.lyrics.LocalLrcLyricsProvider
import com.daddyizz.cyberpulse.core.lyrics.LyricsRepository
import com.daddyizz.cyberpulse.core.player.PlaybackConnection
import com.daddyizz.cyberpulse.core.provider.local.LocalMusicProvider
import com.daddyizz.cyberpulse.core.provider.radio.RadioRepository
import com.daddyizz.cyberpulse.core.recommendation.*
import com.daddyizz.cyberpulse.core.visualizer.VisualizerController

/**
 * Main Application class for CyberPulse Music.
 * Prepares the application context, logging, Android Media3 playback session controller,
 * Google Play Billing, Entitlements, Google Mobile Ads, and AI Recommendation/Cyber DJ layers.
 */
class CyberPulseApplication : Application() {

    companion object {
        lateinit var instance: CyberPulseApplication
            private set
    }

    lateinit var playbackConnection: PlaybackConnection
        private set

    lateinit var localMusicProvider: LocalMusicProvider
        private set

    lateinit var radioRepository: RadioRepository
        private set

    lateinit var musicRepository: MusicRepository
        private set

    lateinit var userPreferencesRepository: UserPreferencesRepository
        private set

    lateinit var billingManager: BillingManager
        private set

    lateinit var entitlementRepository: EntitlementRepository
        private set

    lateinit var consentManager: ConsentManager
        private set

    lateinit var adManager: AdManager
        private set

    lateinit var aiUsageRepository: AiUsageRepository
        private set

    lateinit var aiPlaylistRepository: AiPlaylistRepository
        private set

    lateinit var recommendationEngine: RecommendationEngine
        private set

    lateinit var cyberDjSessionManager: CyberDjSessionManager
        private set

    lateinit var lyricsRepository: LyricsRepository
        private set

    lateinit var visualizerController: VisualizerController
        private set

    lateinit var listeningAnalyticsRepository: com.daddyizz.cyberpulse.core.analytics.ListeningAnalyticsRepository
        private set

    lateinit var playbackEventRecorder: com.daddyizz.cyberpulse.core.analytics.PlaybackEventRecorder
        private set

    // Block 10: Authentication, Cloud Sync, Crash Reporting, Production Analytics, Storage Manager
    lateinit var authRepository: com.daddyizz.cyberpulse.core.auth.AuthRepository
        private set

    lateinit var cloudSyncRepository: com.daddyizz.cyberpulse.core.sync.CloudSyncRepository
        private set

    lateinit var guestMigrationManager: com.daddyizz.cyberpulse.core.sync.GuestMigrationManager
        private set

    lateinit var crashReporter: com.daddyizz.cyberpulse.core.crash.CyberPulseCrashReporter
        private set

    lateinit var productionAnalytics: com.daddyizz.cyberpulse.core.analytics.CyberPulseProductionAnalytics
        private set

    lateinit var storageCacheManager: com.daddyizz.cyberpulse.core.cache.StorageCacheManager
        private set

    override fun onCreate() {
        super.onCreate()
        instance = this

        // Block 10: Install Global Crash Interceptor first
        crashReporter = com.daddyizz.cyberpulse.core.crash.CyberPulseCrashReporter.getInstance(this)
        crashReporter.install()

        localMusicProvider = LocalMusicProvider(this)
        radioRepository = RadioRepository(this)
        musicRepository = MusicRepository(context = this)
        userPreferencesRepository = UserPreferencesRepository(this)

        // Block 10: Initialize Auth & Local-First Cloud Sync Architecture
        authRepository = com.daddyizz.cyberpulse.core.auth.AuthRepository(this)
        cloudSyncRepository = com.daddyizz.cyberpulse.core.sync.CloudSyncRepository(
            context = this,
            authRepository = authRepository,
            musicRepository = musicRepository,
            userPreferencesRepository = userPreferencesRepository
        )
        guestMigrationManager = com.daddyizz.cyberpulse.core.sync.GuestMigrationManager(
            authRepository = authRepository,
            musicRepository = musicRepository,
            userPreferencesRepository = userPreferencesRepository,
            analyticsRepository = listeningAnalyticsRepositoryLazy(),
            cloudSyncRepository = cloudSyncRepository
        )
        productionAnalytics = com.daddyizz.cyberpulse.core.analytics.CyberPulseProductionAnalytics(
            context = this,
            preferencesRepository = userPreferencesRepository
        )
        storageCacheManager = com.daddyizz.cyberpulse.core.cache.StorageCacheManager(this)

        // Initialize authoritative Media3 PlaybackConnection
        playbackConnection = PlaybackConnection.getInstance(this)

        // Initialize Block 7: Google Play Billing & Entitlement Single Source of Truth
        billingManager = BillingManager(this)
        billingManager.startConnection()
        entitlementRepository = EntitlementRepository(this, billingManager)

        // Initialize Block 7: UMP Consent & AdMob Gatekeeper
        consentManager = ConsentManager(this)
        adManager = AdManager(this, entitlementRepository, consentManager)

        // Initialize Block 8: AI Discovery & Cyber DJ Session Orchestration
        aiUsageRepository = AiUsageRepository(this, entitlementRepository)
        aiPlaylistRepository = AiPlaylistRepository()
        recommendationEngine = RecommendationEngine(
            musicRepository = musicRepository,
            localMusicProvider = localMusicProvider,
            aiUsageRepository = aiUsageRepository
        )
        cyberDjSessionManager = CyberDjSessionManager(
            recommendationEngine = recommendationEngine,
            playbackConnection = playbackConnection,
            userPreferencesRepository = userPreferencesRepository
        )

        // Initialize Block 9A: Lyrics Repository & Visualizer Controller
        lyricsRepository = LyricsRepository(
            localProvider = LocalLrcLyricsProvider(this)
        )
        visualizerController = VisualizerController(
            context = this,
            entitlementRepository = entitlementRepository
        )

        // Initialize Block 9B: Advanced Listening Analytics & Replay Engine
        listeningAnalyticsRepository = com.daddyizz.cyberpulse.core.analytics.ListeningAnalyticsRepository(
            context = this,
            preferencesRepository = userPreferencesRepository,
            entitlementRepository = entitlementRepository
        )
        playbackEventRecorder = com.daddyizz.cyberpulse.core.analytics.PlaybackEventRecorder(
            analyticsRepository = listeningAnalyticsRepository
        )
        playbackConnection.eventRecorder = playbackEventRecorder

        // Log app startup in production analytics
        productionAnalytics.logAppOpen()
    }

    private fun listeningAnalyticsRepositoryLazy(): com.daddyizz.cyberpulse.core.analytics.ListeningAnalyticsRepository {
        if (!::listeningAnalyticsRepository.isInitialized) {
            listeningAnalyticsRepository = com.daddyizz.cyberpulse.core.analytics.ListeningAnalyticsRepository(
                context = this,
                preferencesRepository = userPreferencesRepository,
                entitlementRepository = entitlementRepository
            )
        }
        return listeningAnalyticsRepository
    }

    override fun onTerminate() {
        super.onTerminate()
        billingManager.destroy()
    }
}


