package com.daddyizz.cyberpulse.feature.settings

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.daddyizz.cyberpulse.core.designsystem.CyberCard
import com.daddyizz.cyberpulse.core.designsystem.CyberRadius
import com.daddyizz.cyberpulse.core.designsystem.CyberSpacing
import com.daddyizz.cyberpulse.core.designsystem.LocalCyberPulseColors

/**
 * Block 10: Legal, Privacy Policy & Third-Party Disclosures Dialog.
 *
 * Compliant with:
 * - Google Play Data Safety & Account Deletion URL guidelines
 * - YouTube API Services Developer Policies
 * - Spotify Developer Platform Terms
 * - Radio Browser open data guidelines
 */
@Composable
fun PrivacyLegalDialog(
    onDismiss: () -> Unit
) {
    val colors = LocalCyberPulseColors.current
    val context = LocalContext.current

    Dialog(onDismissRequest = onDismiss) {
        Card(
            shape = RoundedCornerShape(CyberRadius.xl),
            colors = CardDefaults.cardColors(containerColor = colors.surface),
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 20.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp)
                    .verticalScroll(rememberScrollState())
            ) {
                // Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Privacy & Legal Policies",
                        style = MaterialTheme.typography.titleLarge,
                        color = colors.textPrimary,
                        fontWeight = FontWeight.Bold
                    )
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, contentDescription = "Close", tint = colors.textSecondary)
                    }
                }

                Spacer(modifier = Modifier.height(CyberSpacing.md))

                // Privacy Policy Card
                CyberCard(modifier = Modifier.fillMaxWidth()) {
                    Column {
                        Text(
                            text = "Privacy Policy & Data Safety",
                            style = MaterialTheme.typography.titleSmall,
                            color = colors.primaryAccent,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = "CyberPulse respects your privacy. Local audio files, MediaStore scans, and passwords never leave your device. Only playback metrics necessary for Replay and cloud playlists are synchronized when you choose to create an account.",
                            style = MaterialTheme.typography.bodySmall,
                            color = colors.textSecondary
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Button(
                            onClick = {
                                val intent = Intent(Intent.ACTION_VIEW, Uri.parse("https://daddyizz.github.io/cyberpulse/privacy"))
                                context.startActivity(intent)
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = colors.surfaceElevated),
                            shape = RoundedCornerShape(CyberRadius.sm)
                        ) {
                            Icon(Icons.Default.OpenInNew, contentDescription = null, tint = colors.primaryAccent, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Open Full Privacy Policy", color = colors.primaryAccent, fontSize = 12.sp)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(CyberSpacing.md))

                // Data Deletion URL Card (Play Store Requirement)
                CyberCard(modifier = Modifier.fillMaxWidth()) {
                    Column {
                        Text(
                            text = "Account & Data Deletion",
                            style = MaterialTheme.typography.titleSmall,
                            color = colors.primaryAccent,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = "You can delete your account directly in the app from the Account menu, or request deletion online pursuant to Google Play Store requirements.",
                            style = MaterialTheme.typography.bodySmall,
                            color = colors.textSecondary
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        OutlinedButton(
                            onClick = {
                                val intent = Intent(Intent.ACTION_VIEW, Uri.parse("https://daddyizz.github.io/cyberpulse/delete-account"))
                                context.startActivity(intent)
                            },
                            shape = RoundedCornerShape(CyberRadius.sm)
                        ) {
                            Text("Web Data Deletion Portal", color = colors.textPrimary, fontSize = 12.sp)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(CyberSpacing.md))

                // Third Party Disclosures
                CyberCard(modifier = Modifier.fillMaxWidth()) {
                    Column {
                        Text(
                            text = "Third-Party Services & Attributions",
                            style = MaterialTheme.typography.titleSmall,
                            color = colors.primaryAccent,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = "• YouTube Data API: Subject to YouTube Terms of Service and Google Privacy Policy.\n" +
                                    "• Spotify Web API: Metadata and album artwork powered by Spotify.\n" +
                                    "• Radio Browser: Community-contributed worldwide streaming directory.\n" +
                                    "• AndroidX Media3: High-performance audio architecture.",
                            style = MaterialTheme.typography.bodySmall,
                            color = colors.textSecondary
                        )
                    }
                }

                Spacer(modifier = Modifier.height(CyberSpacing.md))

                // Open-source licenses
                CyberCard(modifier = Modifier.fillMaxWidth()) {
                    Column {
                        Text(
                            text = "Open-Source Software",
                            style = MaterialTheme.typography.titleSmall,
                            color = colors.primaryAccent,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = "CyberPulse incorporates open-source libraries licensed under the Apache 2.0 and MIT licenses, including Jetpack Compose, KotlinX Coroutines, OkHttp, Retrofit, Moshi, and Coil.",
                            style = MaterialTheme.typography.bodySmall,
                            color = colors.textSecondary
                        )
                    }
                }
            }
        }
    }
}
