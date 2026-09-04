package com.daddyizz.cyberpulse.core.model

data class Artwork(
    val url: String?,
    val width: Int = 300,
    val height: Int = 300,
    val placeholderKey: String = "neon_horizon"
)

data class Artist(
    val id: String,
    val name: String,
    val monthlyListeners: Long = 0L,
    val subscriberCount: Long? = null,
    val isSubscriberCountHidden: Boolean = false,
    val avatarPlaceholderKey: String = "neon_horizon",
    val artworkUrl: String? = null,
    val artwork: Artwork? = null,
    val genres: List<String> = emptyList(),
    val bio: String? = null,
    val isFollowed: Boolean = false,
    val source: MusicSource = MusicSource.DEMO,
    val sourceId: String = id
)

data class Album(
    val id: String,
    val title: String,
    val artist: String,
    val artistId: String? = null,
    val releaseYear: Int = 2024,
    val artworkKey: String = "purple_pulse",
    val artworkUrl: String? = null,
    val artwork: Artwork? = null,
    val tracksCount: Int = 0,
    val tracks: List<Track> = emptyList(),
    val source: MusicSource = MusicSource.DEMO,
    val sourceId: String = id
)

data class Playlist(
    val id: String,
    val title: String,
    val subtitle: String = "",
    val description: String = "",
    val artworkKey: String = "digital_rain",
    val artworkUrl: String? = null,
    val artwork: Artwork? = null,
    val trackCount: Int = 0,
    val createdBy: String = "CyberPulse Curators",
    val tracks: List<Track> = emptyList(),
    val source: MusicSource = MusicSource.DEMO,
    val sourceId: String = id
)

data class PlaylistItem(
    val playlistId: String,
    val track: Track,
    val position: Int,
    val addedAtEpoch: Long = System.currentTimeMillis()
)

data class Genre(
    val id: String,
    val name: String,
    val gradientStartHex: String,
    val gradientEndHex: String,
    val isSelected: Boolean = false
)

data class UserProfile(
    val id: String = "usr_cyber_001",
    val username: String = "Cyber Listener",
    val handle: String = "@cyberlistener",
    val subscriptionTier: String = "Free",
    val playlistCount: Int = 0,
    val likedSongsCount: Int = 0,
    val followingCount: Int = 0
)

data class ListeningHistoryItem(
    val track: Track,
    val playedAtEpoch: Long,
    val completedPercentage: Float = 1.0f
)
