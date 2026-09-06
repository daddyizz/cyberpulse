package com.daddyizz.cyberpulse.core.network

import com.daddyizz.cyberpulse.BuildConfig
import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory
import java.util.concurrent.TimeUnit

object CyberPulseNetworkClient {

    private const val CONNECT_TIMEOUT_SECONDS = 10L
    private const val READ_TIMEOUT_SECONDS = 15L
    private const val YOUTUBE_API_BASE_URL = "https://www.googleapis.com/"

    private val moshi: Moshi = Moshi.Builder()
        .add(KotlinJsonAdapterFactory())
        .build()

    // Release-safe logging interceptor that scrubs sensitive API keys and tokens
    private val safeLoggingInterceptor: Interceptor = HttpLoggingInterceptor { message ->
        if (BuildConfig.DEBUG) {
            // Strip API keys from logged URL query parameters
            val sanitized = message.replace(Regex("key=[^&\\s]+"), "key=[REDACTED_API_KEY]")
            android.util.Log.d("CyberPulseNet", sanitized)
        }
    }.apply {
        level = if (BuildConfig.DEBUG) {
            HttpLoggingInterceptor.Level.BASIC
        } else {
            HttpLoggingInterceptor.Level.NONE
        }
    }

    private val okHttpClient: OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(CONNECT_TIMEOUT_SECONDS, TimeUnit.SECONDS)
        .readTimeout(READ_TIMEOUT_SECONDS, TimeUnit.SECONDS)
        .addInterceptor(safeLoggingInterceptor)
        .addInterceptor { chain ->
            val request = chain.request().newBuilder()
                .header("User-Agent", "CyberPulse-Android/${BuildConfig.VERSION_NAME}")
                .header("Accept", "application/json")
                .build()
            chain.proceed(request)
        }
        .build()

    val youtubeService: YouTubeApiService by lazy {
        Retrofit.Builder()
            .baseUrl(YOUTUBE_API_BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(MoshiConverterFactory.create(moshi))
            .build()
            .create(YouTubeApiService::class.java)
    }

    val spotifyService: SpotifyApiService by lazy {
        Retrofit.Builder()
            .baseUrl("https://api.spotify.com/")
            .client(okHttpClient)
            .addConverterFactory(MoshiConverterFactory.create(moshi))
            .build()
            .create(SpotifyApiService::class.java)
    }
}
