package com.daddyizz.cyberpulse

import android.app.Application
import com.daddyizz.cyberpulse.core.data.MusicRepository
import com.daddyizz.cyberpulse.core.player.PlaybackConnection
import com.daddyizz.cyberpulse.core.provider.local.LocalMusicProvider
import com.daddyizz.cyberpulse.core.provider.radio.RadioRepository

/**
 * Main Application class for CyberPulse Music.
 * Prepares the application context, logging, and Android Media3 playback session controller.
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

    override fun onCreate() {
        super.onCreate()
        instance = this
        localMusicProvider = LocalMusicProvider(this)
        radioRepository = RadioRepository(this)
        musicRepository = MusicRepository(context = this)
        // Initialize authoritative Media3 PlaybackConnection
        playbackConnection = PlaybackConnection.getInstance(this)
    }
}


