package com.daddyizz.cyberpulse.core.recommendation

import com.daddyizz.cyberpulse.core.data.MusicRepository
import com.daddyizz.cyberpulse.core.model.Playlist
import com.daddyizz.cyberpulse.core.model.Track
import com.daddyizz.cyberpulse.core.player.CyberPulseTestMedia
import com.daddyizz.cyberpulse.core.provider.local.LocalMusicProvider
import com.daddyizz.cyberpulse.core.provider.radio.RadioProvider
import java.util.Calendar

/**
 * High-performance, offline-capable rule-based recommendation engine.
 *
 * Guarantees that CyberPulse discovery features remain 100% operational when:
 * - Device is offline or in airplane mode
 * - AI backend is unreachable, rate limited, or unconfigured
 * - User chooses to disable AI Personalization in Settings
 */
class LocalRecommendationEngine(
    private val musicRepository: MusicRepository,
    private val localMusicProvider: LocalMusicProvider? = null,
    private val queryPlanner: QueryPlanner = QueryPlanner(musicRepository, localMusicProvider),
    private val ranker: CandidateRanker = CandidateRanker()
) {

    /**
     * Fallback intent generator parsing prompt keywords locally without external AI calls.
     */
    fun createFallbackIntent(prompt: String, context: ListenerContext): PlaylistIntent {
        val p = prompt.lowercase()

        val genres = mutableListOf<String>()
        if (p.contains("rock")) genres.add("Rock")
        if (p.contains("synth") || p.contains("wave")) genres.add("Synthwave")
        if (p.contains("edm") || p.contains("electronic") || p.contains("dance")) genres.add("Electronic")
        if (p.contains("chill") || p.contains("lofi") || p.contains("lo-fi")) genres.add("Lo-Fi")
        if (p.contains("malay") || p.contains("melayu")) genres.add("Malay")
        if (genres.isEmpty()) genres.addAll(listOf("Electronic", "Cyberpunk"))

        val moods = mutableListOf<String>()
        if (p.contains("night") || p.contains("drive")) moods.add("Night Drive")
        if (p.contains("workout") || p.contains("gym")) moods.add("Workout")
        if (p.contains("focus") || p.contains("study") || p.contains("work")) moods.add("Focus")
        if (p.contains("chill") || p.contains("relax") || p.contains("sunday")) moods.add("Chill")
        if (moods.isEmpty()) moods.add("Pulse")

        val energy = when {
            p.contains("high") || p.contains("workout") || p.contains("gym") || p.contains("edm") -> 90
            p.contains("chill") || p.contains("sleep") || p.contains("relax") || p.contains("sunday") -> 30
            p.contains("focus") || p.contains("work") -> 45
            else -> 65
        }

        val title = when {
            p.contains("night drive") -> "Night Drive Pulse"
            p.contains("workout") -> "Cyber Surge Workout"
            p.contains("chill") -> "Neon Chill Flow"
            p.contains("focus") -> "Deep Cognitive Focus"
            p.contains("malay") -> "Nusantara Cyber Hits"
            else -> "${prompt.take(25).capitalizeWords()} Mix"
        }

        return PlaylistIntent(
            title = title,
            description = "Smart local mix built around ${genres.joinToString(", ")} and ${moods.joinToString(", ")}.",
            genres = genres,
            moods = moods,
            energy = energy,
            languagePreferences = context.preferredLanguages,
            targetTrackCount = 15
        )
    }

    /**
     * Creates a fallback DjSessionPlan when AI backend is unavailable.
     */
    fun createFallbackDjPlan(mode: CyberDjMode, context: ListenerContext): DjSessionPlan {
        val genres = when (mode) {
            CyberDjMode.DRIVE -> listOf("Synthwave", "Cyberpunk", "Electronic")
            CyberDjMode.CHILL -> listOf("Lo-Fi", "Ambient", "Chillout")
            CyberDjMode.WORKOUT -> listOf("Drum & Bass", "Industrial", "Techno")
            CyberDjMode.FOCUS -> listOf("Ambient Electronic", "Downtempo")
            CyberDjMode.PARTY -> listOf("Electro House", "Synthpop", "Future Bass")
            CyberDjMode.SLEEP -> listOf("Drone", "Binaural", "Soft Synth")
            CyberDjMode.DISCOVER -> listOf("Indie Electronic", "Underground")
            CyberDjMode.THROWBACK -> listOf("80s Retro", "Outrun", "Chiptune")
        }

        return DjSessionPlan(
            mode = mode,
            targetEnergy = mode.defaultEnergy,
            discoveryRatio = mode.defaultDiscovery,
            primaryGenres = genres,
            targetMoods = listOf(mode.displayName)
        )
    }

    /**
     * Resolves a complete playlist locally for an intent.
     */
    suspend fun generateResolvedPlaylistLocally(
        intent: PlaylistIntent,
        context: ListenerContext,
        mode: PlaylistResolutionMode = PlaylistResolutionMode.PLAYABLE_NOW
    ): ResolvedPlaylist {
        val candidates = queryPlanner.resolveIntentCandidates(intent, mode)
        val rankedTracks = ranker.rankForIntent(candidates, intent, context, intent.targetTrackCount)
        val finalTracks = if (rankedTracks.isNotEmpty()) rankedTracks else CyberPulseTestMedia.ALL_TEST_TRACKS.take(intent.targetTrackCount)
        val composition = queryPlanner.computeComposition(finalTracks)

        return ResolvedPlaylist(
            title = intent.title,
            description = intent.description,
            intent = intent,
            tracks = finalTracks,
            resolutionMode = mode,
            sourceComposition = composition
        )
    }

    /**
     * Generates personalized Smart Mixes based on listening history, likes, and time of day.
     */
    fun getSmartMixes(): List<Playlist> {
        val mixes = mutableListOf<Playlist>()

        // 1. Time-of-day mix
        mixes.add(getTimeOfDayMix())

        // 2. On Repeat (based on real listening history)
        val recent = musicRepository.recentlyPlayed.value
        if (recent.isNotEmpty()) {
            mixes.add(
                Playlist(
                    id = "smart_on_repeat",
                    title = "On Repeat",
                    subtitle = "Your top regular tracks",
                    description = "Tracks you have listened to most frequently.",
                    artworkKey = "purple_pulse",
                    tracks = recent.take(12),
                    trackCount = recent.take(12).size
                )
            )
        }

        // 3. Daily Mix 1: Synthwave & Electronic Pulse
        val allDemo = musicRepository.fallbackProvider.getAllTracks() + CyberPulseTestMedia.ALL_TEST_TRACKS
        val synthwaveTracks = allDemo.filter {
            it.title.contains("synth", ignoreCase = true) ||
            it.title.contains("neon", ignoreCase = true) ||
            it.title.contains("drive", ignoreCase = true)
        }
        mixes.add(
            Playlist(
                id = "smart_daily_1",
                title = "Daily Mix 1",
                subtitle = "Synthwave & Electronic",
                description = "Daily neon energy with electronic rhythms and retro synthesizers.",
                artworkKey = "night_drive",
                tracks = synthwaveTracks.ifEmpty { allDemo.take(8) },
                trackCount = synthwaveTracks.ifEmpty { allDemo.take(8) }.size
            )
        )

        // 4. Daily Mix 2: Ambient Chill & Focus
        val chillTracks = allDemo.filter {
            it.title.contains("chill", ignoreCase = true) ||
            it.title.contains("rain", ignoreCase = true) ||
            it.title.contains("ambient", ignoreCase = true)
        }
        mixes.add(
            Playlist(
                id = "smart_daily_2",
                title = "Daily Mix 2",
                subtitle = "Ambient & Lo-Fi Chill",
                description = "Relaxed beats for calm flow, reading, or coding.",
                artworkKey = "neon_horizon",
                tracks = chillTracks.ifEmpty { allDemo.reversed().take(8) },
                trackCount = chillTracks.ifEmpty { allDemo.reversed().take(8) }.size
            )
        )

        // 5. Discover Pulse (unplayed or low-frequency tracks)
        val playedIds = recent.map { it.id }.toSet()
        val unplayed = allDemo.filterNot { playedIds.contains(it.id) }
        mixes.add(
            Playlist(
                id = "smart_discover_pulse",
                title = "Discover Pulse",
                subtitle = "Fresh Unexplored Tracks",
                description = "Unplayed sounds tailored to expand your musical horizons.",
                artworkKey = "digital_rain",
                tracks = unplayed.ifEmpty { allDemo.take(8) },
                trackCount = unplayed.ifEmpty { allDemo.take(8) }.size
            )
        )

        return mixes
    }

    private fun getTimeOfDayMix(): Playlist {
        val hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
        val allTracks = musicRepository.getAllTracks()

        return when (hour) {
            in 5..11 -> {
                Playlist(
                    id = "time_morning_pulse",
                    title = "Morning Pulse",
                    subtitle = "Awaken & Elevate",
                    description = "Crisp, melodic frequencies to jumpstart your day.",
                    artworkKey = "neon_horizon",
                    tracks = allTracks.take(10),
                    trackCount = allTracks.take(10).size
                )
            }
            in 12..16 -> {
                Playlist(
                    id = "time_afternoon_flow",
                    title = "Afternoon Flow",
                    subtitle = "Steady Momentum",
                    description = "Deep rhythmic momentum to maintain peak focus.",
                    artworkKey = "purple_pulse",
                    tracks = allTracks.drop(2).take(10),
                    trackCount = allTracks.drop(2).take(10).size
                )
            }
            in 17..21 -> {
                Playlist(
                    id = "time_night_drive",
                    title = "Night Drive",
                    subtitle = "Urban Cruising",
                    description = "Atmospheric synthwave tuned for night navigation.",
                    artworkKey = "night_drive",
                    tracks = allTracks.drop(4).take(10),
                    trackCount = allTracks.drop(4).take(10).size
                )
            }
            else -> {
                Playlist(
                    id = "time_late_night",
                    title = "Late Night Chill",
                    subtitle = "Midnight Drift",
                    description = "Mellow, low-tempo soundscapes for late hours.",
                    artworkKey = "digital_rain",
                    tracks = allTracks.takeLast(10),
                    trackCount = allTracks.takeLast(10).size
                )
            }
        }
    }

    private fun String.capitalizeWords(): String =
        split(" ").joinToString(" ") { it.replaceFirstChar { char -> char.uppercase() } }
}
