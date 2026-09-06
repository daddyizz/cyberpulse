package com.daddyizz.cyberpulse.core.player

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Intent
import android.os.Build
import android.os.Bundle
import androidx.annotation.OptIn
import androidx.media3.common.AudioAttributes
import androidx.media3.common.C
import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.session.DefaultMediaNotificationProvider
import androidx.media3.session.LibraryResult
import androidx.media3.session.MediaLibraryService
import androidx.media3.session.MediaSession
import androidx.media3.session.SessionCommand
import androidx.media3.session.SessionResult
import com.daddyizz.cyberpulse.MainActivity
import com.daddyizz.cyberpulse.R
import com.google.common.collect.ImmutableList
import com.google.common.util.concurrent.Futures
import com.google.common.util.concurrent.ListenableFuture

/**
 * CyberPulsePlaybackService
 *
 * Authoritative native Android background playback service using AndroidX Media3.
 * Hosts a single ExoPlayer instance and a MediaLibrarySession to enable:
 * - Persistent audio playback surviving Activity destruction / app backgrounding
 * - System media notification & lock-screen media controls
 * - Audio focus management (ducking, pause on call/disconnect)
 * - Becoming noisy handling (pause on headphone unplug / Bluetooth disconnect)
 * - Media button / Bluetooth / headset receiver dispatching
 * - Android MediaLibrary hierarchy browsing
 * - Durable recovery snapshot persistence across process death
 */
@OptIn(UnstableApi::class)
class CyberPulsePlaybackService : MediaLibraryService() {

    private var player: ExoPlayer? = null
    private var mediaLibrarySession: MediaLibrarySession? = null
    private lateinit var interruptionPolicy: AudioFocusInterruptionPolicy
    private lateinit var recoveryStore: PlaybackRecoveryStore

    private val playerListener = object : Player.Listener {
        override fun onPlayWhenReadyChanged(playWhenReady: Boolean, reason: Int) {
            when (reason) {
                Player.PLAY_WHEN_READY_CHANGE_REASON_USER_REQUEST -> {
                    if (playWhenReady) {
                        interruptionPolicy.onUserPlay()
                    } else {
                        interruptionPolicy.onUserPause()
                        persistCurrentState(force = true)
                    }
                }
                Player.PLAY_WHEN_READY_CHANGE_REASON_AUDIO_FOCUS_LOSS -> {
                    interruptionPolicy.onTransientFocusLoss(currentlyPlaying = true)
                }
            }
        }

        override fun onMediaItemTransition(mediaItem: MediaItem?, reason: Int) {
            persistCurrentState(force = true)
        }

        override fun onPlaybackStateChanged(playbackState: Int) {
            if (playbackState == Player.STATE_IDLE || playbackState == Player.STATE_ENDED) {
                persistCurrentState(force = true)
            }
        }
    }

    override fun onCreate() {
        super.onCreate()

        interruptionPolicy = AudioFocusInterruptionPolicy()
        recoveryStore = PlaybackRecoveryStore(this)

        // 1. Create playback notification channel for Android 8.0+ (API 26+)
        createNotificationChannel()

        // 2. Configure dedicated MediaNotificationProvider with channel and app icon
        val notificationProvider = DefaultMediaNotificationProvider.Builder(this)
            .setChannelId(NOTIFICATION_CHANNEL_ID)
            .setNotificationId(NOTIFICATION_ID)
            .build()
        setMediaNotificationProvider(notificationProvider)

        // 3. Configure audio attributes for standard music playback
        val audioAttributes = AudioAttributes.Builder()
            .setContentType(C.AUDIO_CONTENT_TYPE_MUSIC)
            .setUsage(C.USAGE_MEDIA)
            .build()

        // 4. Instantiate single authoritative ExoPlayer
        val exoPlayer = ExoPlayer.Builder(this)
            .setAudioAttributes(audioAttributes, /* handleAudioFocus = */ true)
            .setHandleAudioBecomingNoisy(true)
            .build()
        exoPlayer.addListener(playerListener)
        player = exoPlayer
        activeAudioSessionId = exoPlayer.audioSessionId

        // 5. Configure pending intent for notification tap back into MainActivity
        val sessionActivityPendingIntent = PendingIntent.getActivity(
            this,
            0,
            Intent(this, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_SINGLE_TOP
            },
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        // 6. Build single MediaLibrarySession
        mediaLibrarySession = MediaLibrarySession.Builder(this, exoPlayer, CyberPulseLibrarySessionCallback())
            .setSessionActivity(sessionActivityPendingIntent)
            .build()
    }

    override fun onGetSession(controllerInfo: MediaSession.ControllerInfo): MediaLibrarySession? {
        return mediaLibrarySession
    }

    override fun onTaskRemoved(rootIntent: Intent?) {
        persistCurrentState(force = true)
        val p = player
        // If actively playing audio, keep service alive in foreground with notification.
        // If paused, stopped, or empty queue, terminate service cleanly.
        if (p == null || !p.playWhenReady || p.mediaItemCount == 0) {
            stopSelf()
        }
    }

    override fun onDestroy() {
        persistCurrentState(force = true)
        player?.removeListener(playerListener)
        mediaLibrarySession?.run {
            player.release()
            release()
            mediaLibrarySession = null
        }
        player = null
        super.onDestroy()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val notificationManager = getSystemService(NotificationManager::class.java)
            val channel = NotificationChannel(
                NOTIFICATION_CHANNEL_ID,
                "CyberPulse Music Playback",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Active playback notification and system media controls"
                setShowBadge(false)
            }
            notificationManager?.createNotificationChannel(channel)
        }
    }

    private fun persistCurrentState(force: Boolean) {
        val p = player ?: return
        if (p.mediaItemCount == 0) return

        val queueIds = mutableListOf<String>()
        val timeline = p.currentTimeline
        if (!timeline.isEmpty) {
            for (i in 0 until p.mediaItemCount) {
                queueIds.add(p.getMediaItemAt(i).mediaId)
            }
        }

        val currentTrackId = p.currentMediaItem?.mediaId
        val positionMs = p.currentPosition.coerceAtLeast(0L)

        recoveryStore.saveState(
            queueTrackIds = queueIds,
            currentTrackId = currentTrackId,
            positionMs = positionMs,
            shuffleEnabled = p.shuffleModeEnabled,
            repeatMode = p.repeatMode,
            force = force
        )
    }

    /**
     * Session callback managing library browsing and item resolution.
     */
    private inner class CyberPulseLibrarySessionCallback : MediaLibrarySession.Callback {

        override fun onGetLibraryRoot(
            session: MediaLibrarySession,
            browser: MediaSession.ControllerInfo,
            params: LibraryParams?
        ): ListenableFuture<LibraryResult<MediaItem>> {
            return Futures.immediateFuture(
                LibraryResult.ofItem(MediaLibraryTree.getRootItem(), params)
            )
        }

        override fun onGetChildren(
            session: MediaLibrarySession,
            browser: MediaSession.ControllerInfo,
            parentId: String,
            page: Int,
            pageSize: Int,
            params: LibraryParams?
        ): ListenableFuture<LibraryResult<ImmutableList<MediaItem>>> {
            val children = MediaLibraryTree.getChildrenForNode(parentId)
            return Futures.immediateFuture(
                LibraryResult.ofItemList(ImmutableList.copyOf(children), params)
            )
        }

        private fun resolveTrack(mediaId: String): Track? {
            // 1. Test media catalog
            val testTrack = CyberPulseTestMedia.ALL_TEST_TRACKS.firstOrNull { it.id == mediaId }
            if (testTrack != null) return testTrack

            // 2. Radio stations
            val radioStation = RadioProvider.getStationById(mediaId)
            if (radioStation != null) return radioStation.toTrack()

            val app = try { CyberPulseApplication.instance } catch (_: Exception) { null }

            // 3. Local on-device tracks
            val localTrack = app?.localMusicProvider?.getTracks()?.firstOrNull { it.id == mediaId }
            if (localTrack != null) return localTrack

            // 4. Music repository tracks (playlists, demo, history)
            return app?.musicRepository?.getAllTracks()?.firstOrNull { it.id == mediaId }
        }

        override fun onGetItem(
            session: MediaLibrarySession,
            browser: MediaSession.ControllerInfo,
            mediaId: String
        ): ListenableFuture<LibraryResult<MediaItem>> {
            val track = resolveTrack(mediaId)
            val item = if (track != null) {
                MediaItemMapper.toMediaItem(track)
            } else {
                MediaItem.Builder().setMediaId(mediaId).build()
            }
            return Futures.immediateFuture(LibraryResult.ofItem(item, null))
        }

        override fun onAddMediaItems(
            mediaSession: MediaSession,
            controller: MediaSession.ControllerInfo,
            mediaItems: MutableList<MediaItem>
        ): ListenableFuture<MutableList<MediaItem>> {
            val updatedItems = mediaItems.map { item ->
                if (item.localConfiguration?.uri != null) {
                    item
                } else {
                    val track = resolveTrack(item.mediaId)
                    if (track != null) {
                        MediaItemMapper.toMediaItem(track)
                    } else {
                        item
                    }
                }
            }.toMutableList()
            return Futures.immediateFuture(updatedItems)
        }

        override fun onSearch(
            session: MediaLibrarySession,
            browser: MediaSession.ControllerInfo,
            query: String,
            params: LibraryParams?
        ): ListenableFuture<LibraryResult<Void>> {
            val searchResults = performMediaSearch(query)
            session.notifySearchResultChanged(browser, query, searchResults.size, params)
            return Futures.immediateFuture(LibraryResult.ofVoid(params))
        }

        override fun onGetSearchResult(
            session: MediaLibrarySession,
            browser: MediaSession.ControllerInfo,
            query: String,
            page: Int,
            pageSize: Int,
            params: LibraryParams?
        ): ListenableFuture<LibraryResult<ImmutableList<MediaItem>>> {
            val allResults = performMediaSearch(query)
            val fromIndex = (page * pageSize).coerceAtMost(allResults.size)
            val toIndex = (fromIndex + pageSize).coerceAtMost(allResults.size)
            val paged = allResults.subList(fromIndex, toIndex)
            return Futures.immediateFuture(
                LibraryResult.ofItemList(ImmutableList.copyOf(paged), params)
            )
        }

        private fun performMediaSearch(query: String): List<MediaItem> {
            val q = query.trim().lowercase()
            if (q.isBlank()) return emptyList()

            val app = try { CyberPulseApplication.instance } catch (_: Exception) { null }
            val results = mutableListOf<MediaItem>()

            // 1. High priority: Local device music matching title or artist
            app?.localMusicProvider?.searchLocal(q)?.forEach { track ->
                results.add(MediaItemMapper.toMediaItem(track))
            }

            // 2. High priority: Radio stations matching name or genre
            val radioStations = app?.radioRepository?.searchStations(q)
                ?: RadioProvider.STATIONS.filter { it.name.lowercase().contains(q) || it.genre?.lowercase()?.contains(q) == true }
            radioStations.forEach { station ->
                results.add(MediaItemMapper.toMediaItem(station.toTrack()))
            }

            // 3. Fallback: Test media catalog
            CyberPulseTestMedia.ALL_TEST_TRACKS.filter {
                it.title.lowercase().contains(q) || it.artist.lowercase().contains(q)
            }.forEach { track ->
                results.add(MediaItemMapper.toMediaItem(track))
            }

            return results
        }

        override fun onConnect(
            session: MediaSession,
            controller: MediaSession.ControllerInfo
        ): MediaSession.ConnectionResult {
            val sessionCommands = MediaSession.ConnectionResult.DEFAULT_SESSION_COMMANDS.buildUpon()
            val playerCommands = MediaSession.ConnectionResult.DEFAULT_PLAYER_COMMANDS.buildUpon()
                .add(Player.COMMAND_PLAY_PAUSE)
                .add(Player.COMMAND_PREPARE)
                .add(Player.COMMAND_STOP)
                .add(Player.COMMAND_SEEK_TO_NEXT)
                .add(Player.COMMAND_SEEK_TO_PREVIOUS)
                .add(Player.COMMAND_SEEK_IN_CURRENT_MEDIA_ITEM)
                .add(Player.COMMAND_SEEK_TO_DEFAULT_POSITION)
                .add(Player.COMMAND_SET_SHUFFLE_MODE)
                .add(Player.COMMAND_SET_REPEAT_MODE)
                .add(Player.COMMAND_GET_CURRENT_MEDIA_ITEM)
                .add(Player.COMMAND_GET_TIMELINE)
                .add(Player.COMMAND_GET_METADATA)

            return MediaSession.ConnectionResult.AcceptedResultBuilder(session)
                .setAvailableSessionCommands(sessionCommands.build())
                .setAvailablePlayerCommands(playerCommands.build())
                .build()
        }
    }

    companion object {
        const val NOTIFICATION_CHANNEL_ID = "cyberpulse_media_playback"
        const val NOTIFICATION_ID = 1001
        var activeAudioSessionId: Int = 0
            internal set
    }
}
