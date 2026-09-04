package com.daddyizz.cyberpulse.feature.profile

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import com.daddyizz.cyberpulse.core.designsystem.*
import com.daddyizz.cyberpulse.core.model.UserProfile

@Composable
fun ProfileScreen(
    userProfile: UserProfile = UserProfile(),
    onNavigateToSettings: () -> Unit,
    onFeatureClick: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    val colors = LocalCyberPulseColors.current

    val menuItems = listOf(
        Triple("Account", Icons.Default.ManageAccounts, "Account"),
        Triple("Listening Stats", Icons.Default.BarChart, "Listening Stats"),
        Triple("Appearance", Icons.Default.Palette, "Appearance"),
        Triple("Playback", Icons.Default.GraphicEq, "Playback Engine"),
        Triple("Notifications", Icons.Default.Notifications, "Notifications"),
        Triple("Privacy", Icons.Default.Security, "Privacy Controls"),
        Triple("CyberPulse Pro", Icons.Default.Star, "CyberPulse Pro Subscription"),
        Triple("Settings", Icons.Default.Settings, "Settings"),
        Triple("About", Icons.Default.Info, "About CyberPulse")
    )

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = CyberSpacing.screenHorizontal),
        contentPadding = PaddingValues(bottom = 90.dp)
    ) {
        item {
            Spacer(modifier = Modifier.height(CyberSpacing.lg))
            Text(
                text = "Profile",
                style = MaterialTheme.typography.headlineLarge,
                color = colors.textPrimary
            )
            Spacer(modifier = Modifier.height(CyberSpacing.lg))

            // User Info Card
            CyberCard(modifier = Modifier.fillMaxWidth()) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(64.dp)
                            .clip(CircleShape)
                            .background(colors.surfaceElevated)
                            .border(2.dp, colors.primaryAccent, CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Person,
                            contentDescription = "Avatar",
                            tint = colors.primaryAccent,
                            modifier = Modifier.size(34.dp)
                        )
                    }
                    Spacer(modifier = Modifier.width(CyberSpacing.md))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = userProfile.username,
                            style = MaterialTheme.typography.titleLarge,
                            color = colors.textPrimary
                        )
                        Text(
                            text = "${userProfile.handle} • ${userProfile.subscriptionTier} Tier",
                            style = MaterialTheme.typography.bodyMedium,
                            color = colors.primaryAccent
                        )
                    }
                }

                Spacer(modifier = Modifier.height(CyberSpacing.md))

                // Stats row
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(CyberRadius.sm))
                        .background(colors.surfaceSecondary)
                        .padding(vertical = CyberSpacing.sm),
                    horizontalArrangement = Arrangement.SpaceEvenly
                ) {
                    ProfileStatItem(count = userProfile.playlistCount, label = "Playlists")
                    ProfileStatItem(count = userProfile.likedSongsCount, label = "Liked")
                    ProfileStatItem(count = userProfile.followingCount, label = "Following")
                }
            }

            Spacer(modifier = Modifier.height(CyberSpacing.xl))
        }

        // Menu Section
        item {
            Text(
                text = "Preferences & System",
                style = MaterialTheme.typography.titleMedium,
                color = colors.textSecondary
            )
            Spacer(modifier = Modifier.height(CyberSpacing.sm))
        }

        items(menuItems.size) { index ->
            val (title, icon, featureName) = menuItems[index]
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(CyberRadius.md))
                    .clickable {
                        if (title == "Settings" || title == "Appearance") {
                            onNavigateToSettings()
                        } else {
                            onFeatureClick(featureName)
                        }
                    }
                    .padding(vertical = CyberSpacing.md, horizontal = CyberSpacing.sm),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = title,
                    tint = colors.primaryAccent,
                    modifier = Modifier.size(24.dp)
                )
                Spacer(modifier = Modifier.width(CyberSpacing.md))
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleMedium,
                    color = colors.textPrimary,
                    modifier = Modifier.weight(1f)
                )
                Icon(
                    imageVector = Icons.Default.ChevronRight,
                    contentDescription = null,
                    tint = colors.textMuted
                )
            }
        }
    }
}

@Composable
private fun ProfileStatItem(count: Int, label: String) {
    val colors = LocalCyberPulseColors.current
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(
            text = count.toString(),
            style = MaterialTheme.typography.titleLarge,
            color = colors.textPrimary
        )
        Text(
            text = label,
            style = MaterialTheme.typography.labelMedium,
            color = colors.textSecondary
        )
    }
}
