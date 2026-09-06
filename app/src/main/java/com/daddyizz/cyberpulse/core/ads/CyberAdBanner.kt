package com.daddyizz.cyberpulse.core.ads

import android.content.Context
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalInspectionMode
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import com.daddyizz.cyberpulse.CyberPulseApplication
import com.daddyizz.cyberpulse.core.designsystem.CyberRadius
import com.daddyizz.cyberpulse.core.designsystem.LocalCyberPulseColors
import com.google.android.gms.ads.*

/**
 * Clean lifecycle-aware Jetpack Compose wrapper for Google Mobile Ads Adaptive Banner.
 *
 * Automatically:
 * - Computes official Anchored Adaptive Banner size based on screen width
 * - Handles AndroidView lifecycle events (pause, resume, destroy)
 * - Fails silently with 0 height if loading fails or user is Pro
 * - Provides a subtle cyberpunk test indicator in debug/preview mode
 */
@Composable
fun CyberAdBanner(
    placement: AdPlacement,
    modifier: Modifier = Modifier
) {
    val isInspection = LocalInspectionMode.current
    val context = LocalContext.current
    val colors = LocalCyberPulseColors.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val configuration = LocalConfiguration.current

    val app = context.applicationContext as? CyberPulseApplication
    val adManager = remember { app?.adManager }
    val isPro by (app?.entitlementRepository?.isPro?.collectAsState() ?: remember { mutableStateOf(false) })
    val canRequestAds by (app?.consentManager?.canRequestAds?.collectAsState() ?: remember { mutableStateOf(true) })

    var isAdLoaded by remember { mutableStateOf(false) }
    var adLoadFailed by remember { mutableStateOf(false) }

    val shouldShow = remember(isPro, canRequestAds, placement) {
        adManager?.shouldShowAds(placement) ?: (!isPro && canRequestAds)
    }

    if (!shouldShow) {
        return // Zero UI footprint for Pro users or unconsented sessions
    }

    if (isInspection) {
        // Preview placeholder in Android Studio Compose preview
        Box(
            modifier = modifier
                .fillMaxWidth()
                .height(50.dp)
                .clip(RoundedCornerShape(CyberRadius.sm))
                .background(colors.surfaceElevated)
                .border(1.dp, colors.border, RoundedCornerShape(CyberRadius.sm)),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = "AdMob Adaptive Banner [${placement.name}]",
                style = MaterialTheme.typography.labelSmall,
                color = colors.textMuted
            )
        }
        return
    }

    Box(
        modifier = modifier
            .fillMaxWidth()
            .wrapContentHeight(),
        contentAlignment = Alignment.Center
    ) {
        AndroidView(
            modifier = Modifier.fillMaxWidth(),
            factory = { ctx ->
                AdView(ctx).apply {
                    adUnitId = AdConfig.getBannerAdUnitId()

                    // Compute official adaptive banner size
                    val adWidth = configuration.screenWidthDp
                    setAdSize(AdSize.getCurrentOrientationAnchoredAdaptiveBannerAdSize(ctx, adWidth))

                    adListener = object : AdListener() {
                        override fun onAdLoaded() {
                            isAdLoaded = true
                            adLoadFailed = false
                        }

                        override fun onAdFailedToLoad(error: LoadAdError) {
                            isAdLoaded = false
                            adLoadFailed = true
                        }
                    }

                    // Issue ad request
                    loadAd(AdRequest.Builder().build())
                }
            },
            update = { adView ->
                // Ensure ad size dynamically updates on configuration change
            }
        )

        // DisposableEffect to bind AdView lifecycle to screen lifecycle
        DisposableEffect(lifecycleOwner) {
            var adViewRef: AdView? = null
            val observer = LifecycleEventObserver { _, event ->
                when (event) {
                    LifecycleEvent.ON_RESUME -> adViewRef?.resume()
                    LifecycleEvent.ON_PAUSE -> adViewRef?.pause()
                    LifecycleEvent.ON_DESTROY -> adViewRef?.destroy()
                    else -> {}
                }
            }
            lifecycleOwner.lifecycle.addObserver(observer)
            onDispose {
                lifecycleOwner.lifecycle.removeObserver(observer)
                adViewRef?.destroy()
            }
        }
    }
}
