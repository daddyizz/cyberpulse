package com.daddyizz.cyberpulse.feature.settings

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.daddyizz.cyberpulse.CyberPulseApplication
import com.daddyizz.cyberpulse.core.cache.StorageBreakdown
import com.daddyizz.cyberpulse.core.designsystem.CyberCard
import com.daddyizz.cyberpulse.core.designsystem.CyberRadius
import com.daddyizz.cyberpulse.core.designsystem.CyberSpacing
import com.daddyizz.cyberpulse.core.designsystem.LocalCyberPulseColors
import kotlinx.coroutines.launch

/**
 * Block 10: Production Cache and Storage Inspection Dialog.
 */
@Composable
fun StorageCacheDialog(
    onDismiss: () -> Unit
) {
    val app = remember { CyberPulseApplication.instance }
    val storageManager = app.storageCacheManager
    val colors = LocalCyberPulseColors.current
    val coroutineScope = rememberCoroutineScope()

    var breakdown by remember { mutableStateOf(StorageBreakdown()) }
    var isClearing by remember { mutableStateOf(false) }
    var statusMessage by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(Unit) {
        breakdown = storageManager.calculateStorageUsage()
    }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            shape = RoundedCornerShape(CyberRadius.xl),
            colors = CardDefaults.cardColors(containerColor = colors.surface),
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 24.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp)
            ) {
                // Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Storage & Cache",
                        style = MaterialTheme.typography.titleLarge,
                        color = colors.textPrimary,
                        fontWeight = FontWeight.Bold
                    )
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, contentDescription = "Close", tint = colors.textSecondary)
                    }
                }

                Spacer(modifier = Modifier.height(CyberSpacing.md))

                // Breakdown Card
                CyberCard(modifier = Modifier.fillMaxWidth()) {
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        StorageRow("Artwork Cache (Coil)", breakdown.formattedArtwork, colors.textPrimary, colors.primaryAccent)
                        StorageRow("Metadata & Search Index", breakdown.formattedMetadata, colors.textPrimary, colors.secondaryAccent)
                        StorageRow("Lyrics Cache (LRC)", breakdown.formattedLyrics, colors.textPrimary, colors.successAccent)
                        StorageRow("Temporary Audio Buffers", breakdown.formattedTemp, colors.textPrimary, colors.textSecondary)
                        Divider(color = colors.border, thickness = 1.dp)
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = "Total Recoverable Cache",
                                style = MaterialTheme.typography.titleSmall,
                                color = colors.textPrimary,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = breakdown.formattedTotal,
                                style = MaterialTheme.typography.titleSmall,
                                color = colors.primaryAccent,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(CyberSpacing.md))

                Text(
                    text = "Clearing cache will free up space safely. Your playlists, liked songs, and listening statistics will not be deleted.",
                    style = MaterialTheme.typography.bodySmall,
                    color = colors.textMuted
                )

                Spacer(modifier = Modifier.height(CyberSpacing.md))

                Button(
                    onClick = {
                        coroutineScope.launch {
                            isClearing = true
                            storageManager.clearAppCache()
                            breakdown = storageManager.calculateStorageUsage()
                            isClearing = false
                            statusMessage = "Cache successfully cleared."
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = colors.primaryAccent),
                    shape = RoundedCornerShape(CyberRadius.md),
                    enabled = !isClearing
                ) {
                    Icon(Icons.Default.CleaningServices, contentDescription = null, tint = Color.Black)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = if (isClearing) "Clearing Cache..." else "Clear App Cache",
                        color = Color.Black,
                        fontWeight = FontWeight.Bold
                    )
                }

                if (statusMessage != null) {
                    Spacer(modifier = Modifier.height(CyberSpacing.sm))
                    Text(
                        text = statusMessage ?: "",
                        color = colors.successAccent,
                        style = MaterialTheme.typography.bodySmall
                    )
                }
            }
        }
    }
}

@Composable
private fun StorageRow(
    title: String,
    sizeStr: String,
    titleColor: Color,
    valueColor: Color
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(text = title, style = MaterialTheme.typography.bodyMedium, color = titleColor)
        Text(text = sizeStr, style = MaterialTheme.typography.bodyMedium, color = valueColor, fontWeight = FontWeight.SemiBold)
    }
}
