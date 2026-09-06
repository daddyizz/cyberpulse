package com.daddyizz.cyberpulse.core.network

import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class SpotifyTokenResponseDto(
    val access_token: String,
    val token_type: String,
    val expires_in: Long
)

@JsonClass(generateAdapter = true)
data class SpotifySearchResponseDto(
    val tracks: SpotifyTracksPagingDto? = null
)

@JsonClass(generateAdapter = true)
data class SpotifyTracksPagingDto(
    val items: List<SpotifyTrackDto> = emptyList(),
    val total: Int = 0,
    val limit: Int = 20,
    val offset: Int = 0
)

@JsonClass(generateAdapter = true)
data class SpotifyTrackDto(
    val id: String,
    val name: String,
    val artists: List<SpotifyArtistDto> = emptyList(),
    val album: SpotifyAlbumDto? = null,
    val duration_ms: Long = 0L,
    val preview_url: String? = null,
    val uri: String? = null,
    val external_urls: SpotifyExternalUrlsDto? = null
)

@JsonClass(generateAdapter = true)
data class SpotifyArtistDto(
    val id: String,
    val name: String,
    val uri: String? = null
)

@JsonClass(generateAdapter = true)
data class SpotifyAlbumDto(
    val id: String,
    val name: String,
    val images: List<SpotifyImageDto> = emptyList(),
    val release_date: String? = null
)

@JsonClass(generateAdapter = true)
data class SpotifyImageDto(
    val url: String,
    val height: Int? = null,
    val width: Int? = null
)

@JsonClass(generateAdapter = true)
data class SpotifyExternalUrlsDto(
    val spotify: String? = null
)
