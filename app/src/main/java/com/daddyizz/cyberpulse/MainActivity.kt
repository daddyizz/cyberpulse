package com.daddyizz.cyberpulse

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.core.content.ContextCompat
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.navigation.compose.rememberNavController
import com.daddyizz.cyberpulse.core.data.MusicRepository
import com.daddyizz.cyberpulse.core.data.UserPreferences
import com.daddyizz.cyberpulse.core.data.UserPreferencesRepository
import com.daddyizz.cyberpulse.core.designsystem.CyberPulseTheme
import com.daddyizz.cyberpulse.core.navigation.CyberPulseNavHost

class MainActivity : ComponentActivity() {

    private lateinit var preferencesRepository: UserPreferencesRepository
    private lateinit var musicRepository: MusicRepository

    private val requestNotificationPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { /* Graceful handling: notification displayed if granted; background playback continues regardless */ }

    override fun onCreate(savedInstanceState: Bundle?) {
        // Install Android 12+ compliant splash screen with clean transition
        val splashScreen = installSplashScreen()

        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        // Check and request POST_NOTIFICATIONS on Android 13+ (API 33+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                requestNotificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
            }
        }

        // Block 7: Gather UMP Privacy Consent at app launch
        CyberPulseApplication.instance.consentManager.gatherConsent(this)

        preferencesRepository = UserPreferencesRepository(applicationContext)
        musicRepository = MusicRepository(context = applicationContext)

        setContent {
            val userPreferences by preferencesRepository.userPreferencesFlow
                .collectAsState(initial = UserPreferences())

            // Dynamic theme selection: Cyberpunk (#07090F) or OLED Black (#000000)
            CyberPulseTheme(themeName = userPreferences.theme) {
                val navController = rememberNavController()

                Surface(modifier = Modifier.fillMaxSize()) {
                    CyberPulseNavHost(
                        navController = navController,
                        preferencesRepository = preferencesRepository,
                        musicRepository = musicRepository,
                        userPreferences = userPreferences
                    )
                }
            }
        }
    }
}
