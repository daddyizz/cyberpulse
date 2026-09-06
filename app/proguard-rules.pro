# ====================================================================
# CYBERPULSE MUSIC - PRODUCTION R8 / PROGUARD MINIFICATION RULES
# Block 10: Production Hardening & Release Optimization
# ====================================================================

# 1. CyberPulse Data Models & Serialization
-keep class com.daddyizz.cyberpulse.core.model.** { *; }
-keep class com.daddyizz.cyberpulse.core.auth.** { *; }
-keep class com.daddyizz.cyberpulse.core.sync.** { *; }
-keep class com.daddyizz.cyberpulse.core.analytics.** { *; }
-keep class com.daddyizz.cyberpulse.core.lyrics.** { *; }
-keep class com.daddyizz.cyberpulse.core.cache.** { *; }

# 2. Moshi JSON Reflection & Adapters
-keepattributes *Annotation*, Signature, InnerClasses, EnclosingMethod
-keepclassmembers class * {
    @com.squareup.moshi.Json <fields>;
}
-keep class com.squareup.moshi.** { *; }
-keepclassmembers class * {
    @com.squareup.moshi.FromJson *;
    @com.squareup.moshi.ToJson *;
}

# 3. Retrofit & OkHttp Networking
-keepclassmembers,allowobfuscation interface * {
    @retrofit2.http.* <methods>;
}
-dontwarn okhttp3.**
-dontwarn okio.**
-dontwarn retrofit2.**
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }

# 4. AndroidX Media3 & ExoPlayer Playback Engine
-keep class androidx.media3.exoplayer.** { *; }
-keep class androidx.media3.session.** { *; }
-keep class androidx.media3.common.** { *; }
-keep class androidx.media3.datasource.** { *; }
-keep class com.daddyizz.cyberpulse.core.player.CyberPulsePlaybackService { *; }

# 5. Google Play Billing Client
-keep class com.android.billingclient.api.** { *; }

# 6. Google Mobile Ads (AdMob) & UMP
-keep class com.google.android.gms.ads.** { *; }
-keep class com.google.android.ump.** { *; }
-dontwarn com.google.android.gms.ads.**

# 7. Coil Image Loading & Memory/Disk Cache
-keep class coil.** { *; }
-keepclassmembers class coil.transform.** { *; }

# 8. Kotlin Coroutines & Flow
-dontwarn kotlinx.coroutines.**
-keep class kotlinx.coroutines.** { *; }

# 9. Jetpack Compose Rules
-keep class androidx.compose.runtime.** { *; }
-keep class androidx.compose.material3.** { *; }

# 10. Strip debug logging from release builds (except errors)
-assumenosideeffects class android.util.Log {
    public static boolean isLoggable(java.lang.String, int);
    public static int v(...);
    public static int d(...);
}
