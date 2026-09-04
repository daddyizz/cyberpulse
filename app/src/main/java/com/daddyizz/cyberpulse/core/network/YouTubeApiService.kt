package com.daddyizz.cyberpulse.core.network

import retrofit2.Response
import retrofit2.http.GET
import retrofit2.http.Query

/**
 * Permitted YouTube Data API v3 metadata query endpoints.
 * Strictly compliant: uses only documented, public Google APIs for metadata retrieval.
 * Does not scrape, reverse-engineer, or attempt unauthorized media extraction.
 */
interface YouTubeApiService {

    @GET("youtube/v3/search")
    suspend fun search(
        @Query("part") part: String = "snippet",
        @Query("q") query: String,
        @Query("type") type: String? = null,
        @Query("maxResults") maxResults: Int = 20,
        @Query("pageToken") pageToken: String? = null,
        @Query("videoCategoryId") videoCategoryId: String? = "10", // Category 10 = Music
        @Query("key") apiKey: String
    ): Response<YouTubeSearchResponseDto>

    @GET("youtube/v3/videos")
    suspend fun getVideos(
        @Query("part") part: String = "snippet,contentDetails,statistics",
        @Query("id") ids: String,
        @Query("key") apiKey: String
    ): Response<YouTubeVideoListResponseDto>

    @GET("youtube/v3/channels")
    suspend fun getChannels(
        @Query("part") part: String = "snippet,statistics",
        @Query("id") ids: String,
        @Query("key") apiKey: String
    ): Response<YouTubeChannelListResponseDto>

    @GET("youtube/v3/playlists")
    suspend fun getPlaylists(
        @Query("part") part: String = "snippet,contentDetails",
        @Query("id") ids: String,
        @Query("key") apiKey: String
    ): Response<YouTubePlaylistListResponseDto>
}
