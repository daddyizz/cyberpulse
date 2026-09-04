package com.daddyizz.cyberpulse.feature.explore

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.GraphicEq
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.daddyizz.cyberpulse.core.designsystem.*

data class ExploreCategory(
    val title: String,
    val description: String,
    val gradientColors: List<Color>
)

@Composable
fun ExploreScreen(
    onCategoryClick: (String) -> Unit,
    onNavigateToCyberRadio: () -> Unit = {},
    modifier: Modifier = Modifier
) {
    val colors = LocalCyberPulseColors.current

    val moodCards = listOf(
        ExploreCategory("Night Drive", "High-bpm neon synth pulses", listOf(Color(0xFF0F2027), Color(0xFF203A43), Color(0xFF00F5FF))),
        ExploreCategory("Gym Energy", "Aggressive industrial beats", listOf(Color(0xFF2C0B4D), Color(0xFFFF2ED1))),
        ExploreCategory("Deep Focus", "Subliminal binaural cyber flow", listOf(Color(0xFF051C14), Color(0xFFB8FF2C))),
        ExploreCategory("Cyber Chill", "Muted lo-fi rain frequencies", listOf(Color(0xFF171B28), Color(0xFF8B5CFF))),
        ExploreCategory("Throwback", "Classic 80s analog synth waves", listOf(Color(0xFF33082F), Color(0xFFFF5E3A))),
        ExploreCategory("Party Mode", "Club peak-time dance floor", listOf(Color(0xFF1F0D3D), Color(0xFF00F5FF)))
    )

    val genreCards = listOf(
        "Synthwave", "Cyberpunk", "Darksynth", "Industrial", "EBM", "Midtempo", "Chiptune", "Ambient"
    )

    val activityCards = listOf(
        "Gaming & Twitch", "Late-Night Coding", "Workout & Cardio", "Night Commute", "Meditation"
    )

    val decadeCards = listOf("80s Retro", "90s Cyber", "2000s Matrix", "2077 Future")

    val languageCards = listOf("English", "Japanese Cyber-Pop", "Korean Pulse", "Global Instrumental")

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = CyberSpacing.screenHorizontal),
        contentPadding = PaddingValues(bottom = 90.dp)
    ) {
        item {
            Spacer(modifier = Modifier.height(CyberSpacing.lg))
            Text(
                text = "Explore",
                style = MaterialTheme.typography.headlineLarge,
                color = colors.textPrimary
            )
            Text(
                text = "Discover soundscapes across frequencies and dimensions.",
                style = MaterialTheme.typography.bodyMedium,
                color = colors.textSecondary
            )
            Spacer(modifier = Modifier.height(CyberSpacing.md))

            // Featured Live Radio Banner
            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(CyberRadius.md))
                    .clickable(onClick = onNavigateToCyberRadio)
                    .border(1.dp, colors.neonPink.copy(alpha = 0.5f), RoundedCornerShape(CyberRadius.md)),
                color = colors.surfaceElevated
            ) {
                Row(
                    modifier = Modifier.padding(CyberSpacing.md),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(50.dp)
                            .clip(RoundedCornerShape(CyberRadius.sm))
                            .background(colors.neonPink.copy(alpha = 0.2f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = androidx.compose.material.icons.filled.Radio,
                            contentDescription = "Radio",
                            tint = colors.neonPink,
                            modifier = Modifier.size(28.dp)
                        )
                    }
                    Spacer(modifier = Modifier.width(CyberSpacing.md))
                    Column(modifier = Modifier.weight(1f)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = "CYBER RADIO",
                                style = MaterialTheme.typography.titleMedium,
                                color = colors.textPrimary,
                                fontWeight = FontWeight.Bold
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Surface(
                                color = Color(0xFFFF2A6D).copy(alpha = 0.15f),
                                shape = RoundedCornerShape(4.dp),
                                border = androidx.compose.foundation.BorderStroke(0.5.dp, Color(0xFFFF2A6D))
                            ) {
                                Text(
                                    text = "LIVE",
                                    color = Color(0xFFFF2A6D),
                                    fontSize = 9.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    modifier = Modifier.padding(horizontal = 4.dp, vertical = 1.dp)
                                )
                            }
                        }
                        Text(
                            text = "Tune in to live Malaysian & global internet radio stations",
                            style = MaterialTheme.typography.bodySmall,
                            color = colors.textSecondary
                        )
                    }
                    Icon(
                        imageVector = androidx.compose.material.icons.filled.ChevronRight,
                        contentDescription = "Open",
                        tint = colors.textSecondary
                    )
                }
            }

            Spacer(modifier = Modifier.height(CyberSpacing.lg))
        }

        // Section: Mood & Vibe
        item {
            CyberSectionHeader(title = "Mood & Vibe")
            Column(verticalArrangement = Arrangement.spacedBy(CyberSpacing.md)) {
                for (i in moodCards.indices step 2) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(CyberSpacing.md)
                    ) {
                        ExploreGradientCard(
                            category = moodCards[i],
                            onClick = { onCategoryClick(moodCards[i].title) },
                            modifier = Modifier.weight(1f)
                        )
                        if (i + 1 < moodCards.size) {
                            ExploreGradientCard(
                                category = moodCards[i + 1],
                                onClick = { onCategoryClick(moodCards[i + 1].title) },
                                modifier = Modifier.weight(1f)
                            )
                        } else {
                            Spacer(modifier = Modifier.weight(1f))
                        }
                    }
                }
            }
            Spacer(modifier = Modifier.height(CyberSpacing.sectionSpacing))
        }

        // Section: Genres
        item {
            CyberSectionHeader(title = "Genres")
            LazyRow(
                horizontalArrangement = Arrangement.spacedBy(CyberSpacing.sm)
            ) {
                items(genreCards) { genre ->
                    CyberChip(
                        text = genre,
                        isSelected = false,
                        onToggle = { onCategoryClick(genre) }
                    )
                }
            }
            Spacer(modifier = Modifier.height(CyberSpacing.sectionSpacing))
        }

        // Section: Activity
        item {
            CyberSectionHeader(title = "Activity")
            LazyRow(
                horizontalArrangement = Arrangement.spacedBy(CyberSpacing.sm)
            ) {
                items(activityCards) { act ->
                    CyberChip(
                        text = act,
                        isSelected = false,
                        onToggle = { onCategoryClick(act) }
                    )
                }
            }
            Spacer(modifier = Modifier.height(CyberSpacing.sectionSpacing))
        }

        // Section: Decades
        item {
            CyberSectionHeader(title = "Decades")
            LazyRow(
                horizontalArrangement = Arrangement.spacedBy(CyberSpacing.sm)
            ) {
                items(decadeCards) { decade ->
                    CyberChip(
                        text = decade,
                        isSelected = false,
                        onToggle = { onCategoryClick(decade) }
                    )
                }
            }
            Spacer(modifier = Modifier.height(CyberSpacing.sectionSpacing))
        }

        // Section: Languages
        item {
            CyberSectionHeader(title = "Languages")
            LazyRow(
                horizontalArrangement = Arrangement.spacedBy(CyberSpacing.sm)
            ) {
                items(languageCards) { lang ->
                    CyberChip(
                        text = lang,
                        isSelected = false,
                        onToggle = { onCategoryClick(lang) }
                    )
                }
            }
            Spacer(modifier = Modifier.height(CyberSpacing.sectionSpacing))
        }
    }
}

@Composable
private fun ExploreGradientCard(
    category: ExploreCategory,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val colors = LocalCyberPulseColors.current
    Box(
        modifier = modifier
            .height(110.dp)
            .clip(RoundedCornerShape(CyberRadius.md))
            .background(Brush.linearGradient(category.gradientColors))
            .border(1.dp, colors.border, RoundedCornerShape(CyberRadius.md))
            .clickable(onClick = onClick)
            .padding(CyberSpacing.md)
    ) {
        Column(
            modifier = Modifier.fillMaxSize(),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Text(
                text = category.title,
                style = MaterialTheme.typography.titleLarge,
                color = Color.White
            )
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = category.description,
                    style = MaterialTheme.typography.labelMedium,
                    color = Color.White.copy(alpha = 0.8f),
                    modifier = Modifier.weight(1f)
                )
                Icon(
                    imageVector = Icons.Default.GraphicEq,
                    contentDescription = null,
                    tint = Color.White.copy(alpha = 0.6f),
                    modifier = Modifier.size(20.dp)
                )
            }
        }
    }
}
