package com.daddyizz.cyberpulse

import com.daddyizz.cyberpulse.core.data.UserPreferences
import com.daddyizz.cyberpulse.core.model.Track
import com.daddyizz.cyberpulse.core.model.TrackSource
import com.daddyizz.cyberpulse.core.player.PlaybackSourceResolver
import com.daddyizz.cyberpulse.core.recommendation.*
import org.junit.Assert.*
import org.junit.Test

class RecommendationPipelineTest {

    private val localTrack = Track(
        id = "local_1",
        title = "Neon Highway",
        artist = "Kavinsky",
        album = "Outrun",
        duration = 240,
        streamUrl = "content://media/external/audio/media/1",
        source = TrackSource.LOCAL,
        isPlayable = true
    )

    private val directStreamTrack = Track(
        id = "stream_1",
        title = "Midnight Pulse",
        artist = "Carpenter Brut",
        album = "Trilogy",
        duration = 210,
        streamUrl = "https://stream.cyberpulse.app/audio/pulse1.mp3",
        source = TrackSource.STREAM,
        isPlayable = true
    )

    private val youtubeEmbedTrack = Track(
        id = "yt_1",
        title = "Synthwave Live",
        artist = "Gunship",
        album = "Cyber Sessions",
        duration = 300,
        streamUrl = "https://youtube.com/watch?v=dQw4w9WgXcQ",
        source = TrackSource.YOUTUBE,
        isPlayable = true
    )

    // 1. Android Auto & Source Resolution Rules
    @Test
    fun `playable now mode strictly filters out youtube embedded tracks`() {
        val allCandidates = listOf(localTrack, directStreamTrack, youtubeEmbedTrack)

        // QueryPlanner filtering rule for PLAYABLE_NOW
        val playableNowResolved = allCandidates.filter { track ->
            val source = PlaybackSourceResolver.resolveSource(track)
            source.supportsMedia3Direct()
        }

        assertTrue(playableNowResolved.contains(localTrack))
        assertTrue(playableNowResolved.contains(directStreamTrack))
        assertFalse(playableNowResolved.contains(youtubeEmbedTrack))
    }

    // 2. Candidate Ranker Multi-Signal Scoring
    @Test
    fun `candidate ranker boosts favorite artists and applies energy match`() {
        val ranker = CandidateRanker()
        val intent = PlaylistIntent(
            mood = "energetic",
            targetEnergy = 85,
            genres = listOf("synthwave", "darkwave"),
            preferredArtists = listOf("Carpenter Brut")
        )
        val context = ListenerContext(
            favoriteArtists = listOf("Carpenter Brut"),
            recentTrackIds = emptyList()
        )
        val feedback = SessionFeedback()

        val scoreCarpenter = ranker.scoreCandidate(directStreamTrack, intent, context, feedback)
        val scoreKavinsky = ranker.scoreCandidate(localTrack, intent, context, feedback)

        // Carpenter Brut is in preferred artists + favorite artists -> higher score
        assertTrue("Carpenter Brut ($scoreCarpenter) should score higher than Kavinsky ($scoreKavinsky)", scoreCarpenter > scoreKavinsky)
    }

    @Test
    fun `candidate ranker downvotes skipped or disliked tracks`() {
        val ranker = CandidateRanker()
        val intent = PlaylistIntent(mood = "drive", targetEnergy = 70)
        val context = ListenerContext()
        val feedback = SessionFeedback()

        val baseScore = ranker.scoreCandidate(localTrack, intent, context, feedback)

        // User thumbs down
        feedback.dislikedTrackIds.add(localTrack.id)
        val penalizedScore = ranker.scoreCandidate(localTrack, intent, context, feedback)

        assertTrue(penalizedScore < baseScore)
    }

    @Test
    fun `candidate ranker gives penalty to recently played tracks for diversity`() {
        val ranker = CandidateRanker()
        val intent = PlaylistIntent(mood = "drive")
        val contextWithHistory = ListenerContext(recentTrackIds = listOf(localTrack.id))
        val contextClean = ListenerContext(recentTrackIds = emptyList())
        val feedback = SessionFeedback()

        val cleanScore = ranker.scoreCandidate(localTrack, intent, contextClean, feedback)
        val historyScore = ranker.scoreCandidate(localTrack, intent, contextWithHistory, feedback)

        assertTrue(historyScore < cleanScore)
    }

    // 3. Privacy & Listener Context Guarantees
    @Test
    fun `when personalized AI is disabled history and likes are never included`() {
        val preferences = UserPreferences(
            personalizedAiEnabled = false,
            keepListeningHistory = false
        )

        val context = ListenerContextBuilder.build(preferences, musicRepository = null)

        assertTrue(context.favoriteArtists.isEmpty())
        assertTrue(context.favoriteGenres.isEmpty())
        assertTrue(context.recentTrackIds.isEmpty())
        assertTrue(context.topPlayedTrackIds.isEmpty())
    }

    // 4. Cyber DJ Modes & Gating
    @Test
    fun `cyber dj modes have accurate energy targets`() {
        assertTrue(CyberDjMode.WORKOUT.targetEnergy >= 85)
        assertTrue(CyberDjMode.SLEEP.targetEnergy <= 25)
        assertTrue(CyberDjMode.CHILL.targetEnergy in 20..50)
        assertTrue(CyberDjMode.DRIVE.targetEnergy in 60..75)
    }

    @Test
    fun `cyber dj modes correctly identify pro exclusivity`() {
        assertFalse(CyberDjMode.DRIVE.isProExclusive)
        assertFalse(CyberDjMode.CHILL.isProExclusive)
        assertFalse(CyberDjMode.WORKOUT.isProExclusive)
        assertFalse(CyberDjMode.FOCUS.isProExclusive)

        assertTrue(CyberDjMode.PARTY.isProExclusive)
        assertTrue(CyberDjMode.SLEEP.isProExclusive)
        assertTrue(CyberDjMode.DISCOVER.isProExclusive)
        assertTrue(CyberDjMode.THROWBACK.isProExclusive)
    }

    // 5. Source Composition Counting
    @Test
    fun `source composition accurately counts media types`() {
        val tracks = listOf(localTrack, directStreamTrack, localTrack)
        val comp = SourceComposition.fromTracks(tracks)

        assertEquals(2, comp.localCount)
        assertEquals(1, comp.catalogCount)
        assertEquals(0, comp.radioCount)
        assertEquals(0, comp.youtubeCount)
    }
}
