package com.daddyizz.cyberpulse.core.network

import retrofit2.Response
import retrofit2.http.*

/**
 * Official Spotify Web API endpoints using Client Credentials flow.
 */
interface SpotifyApiService {

    @FormUrlEncoded
    @POST("https://accounts.spotify.com/api/token")
    suspend fun getAccessToken(
        @Header("Authorization") basicAuthHeader: String,
        @Field("grant_type") grantType: String = "client_credentials"
    ): Response<SpotifyTokenResponseDto>

    @GET("https://api.spotify.com/v1/search")
    suspend fun searchTracks(
        @Header("Authorization") bearerToken: String,
        @Query("q") query: String,
        @Query("type") type: String = "track",
        @Query("limit") limit: Int = 10,
        @Query("offset") offset: Int = 0
    ): Response<SpotifySearchResponseDto>
}
