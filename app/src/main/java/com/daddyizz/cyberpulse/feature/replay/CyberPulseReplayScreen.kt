package com.daddyizz.cyberpulse.feature.replay

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.daddyizz.cyberpulse.core.analytics.CyberPulseReplayData
import com.daddyizz.cyberpulse.core.analytics.ReplayStoryCard
import com.daddyizz.cyberpulse.core.designsystem.*

@Composable
fun CyberPulseReplayScreen(
    viewModel: CyberPulseReplayViewModel,
    onClose: () -> Unit,
    modifier: Modifier = Modifier
) {
    val uiState by viewModel.uiState.collectAsState()
    val colors = LocalCyberPulseColors.current
    val context = LocalContext.current

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(Color(0xFF070B14))
            .statusBarsPadding()
            .navigationBarsPadding()
    ) {
        if (uiState.isLoading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = colors.primaryAccent)
            }
        } else {
            val replay = uiState.replayData
            if (replay == null || !replay.isEligible) {
                // Ineligible State with progress bar
                IneligibleReplayView(
                    replay = replay,
                    onGenerateTestData = { viewModel.generateTestDataset() },
                    onClose = onClose
                )
            } else {
                // Story Cards Pager Layout
                ReplayStoryPager(
                    cards = uiState.storyCards,
                    currentIndex = uiState.currentCardIndex,
                    replayData = replay,
                    onNext = { viewModel.nextCard() },
                    onPrevious = { viewModel.previousCard() },
                    onClose = onClose,
                    onShare = { ReplayShareHelper.shareReplayText(context, replay) }
                )
            }
        }
    }
}

@Composable
private fun ReplayStoryPager(
    cards: List<ReplayStoryCard>,
    currentIndex: Int,
    replayData: CyberPulseReplayData,
    onNext: () -> Unit,
    onPrevious: () -> Unit,
    onClose: () -> Unit,
    onShare: () -> Unit
) {
    val colors = LocalCyberPulseColors.current
    val currentCard = cards.getOrNull(currentIndex) ?: return

    Column(modifier = Modifier.fillMaxSize()) {
        // Story Segment Progress Bars
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 12.dp),
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            cards.indices.forEach { index ->
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .height(3.dp)
                        .clip(RoundedCornerShape(1.5.dp))
                        .background(
                            when {
                                index < currentIndex -> colors.primaryAccent
                                index == currentIndex -> colors.primaryAccent
                                else -> colors.surfaceElevated.copy(alpha = 0.5f)
                            }
                        )
                )
            }
        }

        // Top Controls: App Branding & Close Button
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = "CYBERPULSE REPLAY ${replayData.year}",
                    style = MaterialTheme.typography.labelMedium,
                    color = colors.primaryAccent,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp
                )
                if (replayData.isPreliminary) {
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "• IN PROGRESS",
                        style = MaterialTheme.typography.labelSmall,
                        color = colors.textMuted
                    )
                }
            }
            IconButton(onClick = onClose) {
                Icon(
                    imageVector = Icons.Default.Close,
                    contentDescription = "Close Replay",
                    tint = colors.textPrimary
                )
            }
        }

        // Interactive Tap Zones for Story Navigation
        Box(
            modifier = Modifier
                .fillMaxSize()
                .weight(1f)
        ) {
            // Main Story Card Body
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 24.dp, vertical = 16.dp),
                contentAlignment = Alignment.Center
            ) {
                AnimatedContent(
                    targetState = currentCard,
                    transitionSpec = {
                        fadeIn(animationSpec = tween(220)) togetherWith fadeOut(animationSpec = tween(180))
                    },
                    label = "StoryCardAnimation"
                ) { card ->
                    when (card) {
                        is ReplayStoryCard.Intro -> StoryIntroCard(card, colors)
                        is ReplayStoryCard.TotalMinutes -> StoryTotalMinutesCard(card, colors)
                        is ReplayStoryCard.SongsAndArtists -> StorySongsArtistsCard(card, colors)
                        is ReplayStoryCard.TopSong -> StoryTopSongCard(card, colors)
                        is ReplayStoryCard.TopArtist -> StoryTopArtistCard(card, colors)
                        is ReplayStoryCard.Top5Artists -> StoryTop5ArtistsCard(card, colors)
                        is ReplayStoryCard.Top10Songs -> StoryTop10SongsCard(card, colors)
                        is ReplayStoryCard.GenreHighlight -> StoryGenreCard(card, colors)
                        is ReplayStoryCard.ListeningHabits -> StoryHabitsCard(card, colors)
                        is ReplayStoryCard.CyberDjHighlight -> StoryDjCard(card, colors)
                        is ReplayStoryCard.RoadListeningHighlight -> StoryRoadCard(card, colors)
                        is ReplayStoryCard.PrimarySourceHighlight -> StorySourceCard(card, colors)
                        is ReplayStoryCard.PersonalitySummary -> StoryPersonalityCard(card, colors)
                        is ReplayStoryCard.FinalShareCard -> StoryFinalCard(card, colors, onShare)
                    }
                }
            }

            // Left Tap Zone (Previous Card)
            Box(
                modifier = Modifier
                    .fillMaxHeight()
                    .fillMaxWidth(0.25f)
                    .align(Alignment.CenterStart)
                    .clickable(
                        interactionSource = remember { MutableInteractionSource() },
                        indication = null,
                        onClick = onPrevious
                    )
            )

            // Right Tap Zone (Next Card)
            Box(
                modifier = Modifier
                    .fillMaxHeight()
                    .fillMaxWidth(0.75f)
                    .align(Alignment.CenterEnd)
                    .clickable(
                        interactionSource = remember { MutableInteractionSource() },
                        indication = null,
                        onClick = onNext
                    )
            )
        }
    }
}

@Composable
private fun StoryIntroCard(card: ReplayStoryCard.Intro, colors: CyberPulseColors) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Box(
            modifier = Modifier
                .size(100.dp)
                .clip(CircleShape)
                .background(colors.primaryAccent.copy(alpha = 0.12f))
                .border(2.dp, colors.primaryAccent, CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Default.AutoAwesome,
                contentDescription = null,
                tint = colors.primaryAccent,
                modifier = Modifier.size(52.dp)
            )
        }
        Spacer(modifier = Modifier.height(28.dp))
        Text(
            text = "Welcome to your",
            style = MaterialTheme.typography.titleLarge,
            color = colors.textSecondary
        )
        Text(
            text = "${card.year} Replay",
            style = MaterialTheme.typography.displayMedium,
            color = colors.textPrimary,
            fontWeight = FontWeight.ExtraBold
        )
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            text = "A retrospective powered exclusively by your authentic listening history.",
            style = MaterialTheme.typography.bodyLarge,
            color = colors.textSecondary,
            textAlign = TextAlign.Center
        )
        Spacer(modifier = Modifier.height(32.dp))
        Text(
            text = "Tap anywhere to begin →",
            style = MaterialTheme.typography.labelLarge,
            color = colors.primaryAccent
        )
    }
}

@Composable
private fun StoryTotalMinutesCard(card: ReplayStoryCard.TotalMinutes, colors: CyberPulseColors) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(text = "You listened to", style = MaterialTheme.typography.titleLarge, color = colors.textSecondary)
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = "${card.totalMinutes}",
            style = MaterialTheme.typography.displayLarge,
            color = colors.primaryAccent,
            fontWeight = FontWeight.Black
        )
        Text(
            text = "MINUTES OF MUSIC",
            style = MaterialTheme.typography.titleMedium,
            color = colors.textPrimary,
            fontWeight = FontWeight.Bold,
            letterSpacing = 2.sp
        )
        Spacer(modifier = Modifier.height(20.dp))
        Text(
            text = "That's roughly ${card.totalHours} hours spent exploring sonic dimensions.",
            style = MaterialTheme.typography.bodyLarge,
            color = colors.textSecondary,
            textAlign = TextAlign.Center
        )
    }
}

@Composable
private fun StorySongsArtistsCard(card: ReplayStoryCard.SongsAndArtists, colors: CyberPulseColors) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(text = "Your Sonic Horizon", style = MaterialTheme.typography.headlineMedium, color = colors.textPrimary, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.height(32.dp))
        CyberCard(modifier = Modifier.fillMaxWidth()) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(text = "${card.totalSongs}", style = MaterialTheme.typography.displaySmall, color = colors.primaryAccent, fontWeight = FontWeight.Bold)
                    Text(text = "Unique Songs Played", style = MaterialTheme.typography.bodyMedium, color = colors.textSecondary)
                }
                Icon(Icons.Default.MusicNote, contentDescription = null, tint = colors.primaryAccent, modifier = Modifier.size(36.dp))
            }
        }
        Spacer(modifier = Modifier.height(16.dp))
        CyberCard(modifier = Modifier.fillMaxWidth()) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(text = "${card.uniqueArtistsCount}", style = MaterialTheme.typography.displaySmall, color = colors.secondaryAccent, fontWeight = FontWeight.Bold)
                    Text(text = "Different Artists Discovered", style = MaterialTheme.typography.bodyMedium, color = colors.textSecondary)
                }
                Icon(Icons.Default.Person, contentDescription = null, tint = colors.secondaryAccent, modifier = Modifier.size(36.dp))
            }
        }
    }
}

@Composable
private fun StoryTopSongCard(card: ReplayStoryCard.TopSong, colors: CyberPulseColors) {
    val stat = card.songStat
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(text = "Your #1 Song", style = MaterialTheme.typography.titleLarge, color = colors.secondaryAccent, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.height(24.dp))
        Box(
            modifier = Modifier
                .size(130.dp)
                .clip(RoundedCornerShape(CyberRadius.lg))
                .background(colors.surfaceElevated)
                .border(2.dp, colors.primaryAccent, RoundedCornerShape(CyberRadius.lg)),
            contentAlignment = Alignment.Center
        ) {
            Icon(Icons.Default.MusicNote, contentDescription = null, tint = colors.primaryAccent, modifier = Modifier.size(64.dp))
        }
        Spacer(modifier = Modifier.height(24.dp))
        Text(
            text = stat.title,
            style = MaterialTheme.typography.headlineMedium,
            color = colors.textPrimary,
            fontWeight = FontWeight.Bold,
            textAlign = TextAlign.Center
        )
        Text(
            text = stat.artist,
            style = MaterialTheme.typography.titleMedium,
            color = colors.textSecondary,
            textAlign = TextAlign.Center
        )
        Spacer(modifier = Modifier.height(24.dp))
        Text(
            text = "${stat.playCount} plays • ${stat.totalListenedMinutes} minutes listened",
            style = MaterialTheme.typography.bodyLarge,
            color = colors.primaryAccent,
            fontWeight = FontWeight.SemiBold
        )
    }
}

@Composable
private fun StoryTopArtistCard(card: ReplayStoryCard.TopArtist, colors: CyberPulseColors) {
    val stat = card.artistStat
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(text = "Your #1 Artist", style = MaterialTheme.typography.titleLarge, color = colors.primaryAccent, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.height(24.dp))
        Box(
            modifier = Modifier
                .size(130.dp)
                .clip(CircleShape)
                .background(colors.surfaceElevated)
                .border(2.dp, colors.secondaryAccent, CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Icon(Icons.Default.Person, contentDescription = null, tint = colors.secondaryAccent, modifier = Modifier.size(64.dp))
        }
        Spacer(modifier = Modifier.height(24.dp))
        Text(
            text = stat.artistName,
            style = MaterialTheme.typography.headlineMedium,
            color = colors.textPrimary,
            fontWeight = FontWeight.Bold,
            textAlign = TextAlign.Center
        )
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            text = "${stat.totalListenedMinutes} minutes • ${stat.playCount} plays",
            style = MaterialTheme.typography.bodyLarge,
            color = colors.secondaryAccent,
            fontWeight = FontWeight.SemiBold
        )
        Text(
            text = "${stat.uniqueTracksCount} distinct tracks explored",
            style = MaterialTheme.typography.bodyMedium,
            color = colors.textSecondary
        )
    }
}

@Composable
private fun StoryTop5ArtistsCard(card: ReplayStoryCard.Top5Artists, colors: CyberPulseColors) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(text = "Top Artists", style = MaterialTheme.typography.headlineMedium, color = colors.textPrimary, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.height(20.dp))
        CyberCard(modifier = Modifier.fillMaxWidth()) {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                card.artists.take(5).forEachIndexed { index, stat ->
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "${index + 1}",
                            style = MaterialTheme.typography.titleLarge,
                            color = if (index == 0) colors.primaryAccent else colors.textMuted,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.width(28.dp)
                        )
                        Column(modifier = Modifier.weight(1f)) {
                            Text(text = stat.artistName, style = MaterialTheme.typography.bodyLarge, color = colors.textPrimary, fontWeight = FontWeight.SemiBold)
                            Text(text = "${stat.playCount} plays", style = MaterialTheme.typography.labelSmall, color = colors.textMuted)
                        }
                        Text(text = "${stat.totalListenedMinutes}m", style = MaterialTheme.typography.labelMedium, color = colors.primaryAccent)
                    }
                }
            }
        }
    }
}

@Composable
private fun StoryTop10SongsCard(card: ReplayStoryCard.Top10Songs, colors: CyberPulseColors) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(text = "Top 10 Songs", style = MaterialTheme.typography.headlineMedium, color = colors.textPrimary, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.height(16.dp))
        CyberCard(modifier = Modifier.fillMaxWidth().heightIn(max = 380.dp)) {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                itemsIndexed(card.songs) { index, stat ->
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "${index + 1}",
                            style = MaterialTheme.typography.bodyLarge,
                            color = if (index == 0) colors.primaryAccent else colors.textMuted,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.width(24.dp)
                        )
                        Column(modifier = Modifier.weight(1f)) {
                            Text(text = stat.title, style = MaterialTheme.typography.bodyMedium, color = colors.textPrimary, maxLines = 1, overflow = TextOverflow.Ellipsis)
                            Text(text = stat.artist, style = MaterialTheme.typography.labelSmall, color = colors.textSecondary, maxLines = 1, overflow = TextOverflow.Ellipsis)
                        }
                        Text(text = "${stat.playCount}p", style = MaterialTheme.typography.labelSmall, color = colors.primaryAccent)
                    }
                }
            }
        }
    }
}

@Composable
private fun StoryGenreCard(card: ReplayStoryCard.GenreHighlight, colors: CyberPulseColors) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(text = "Dominant Soundscape", style = MaterialTheme.typography.titleLarge, color = colors.textSecondary)
        Spacer(modifier = Modifier.height(28.dp))
        Box(
            modifier = Modifier
                .clip(RoundedCornerShape(CyberRadius.lg))
                .background(Brush.horizontalGradient(listOf(colors.primaryAccent.copy(alpha = 0.2f), colors.secondaryAccent.copy(alpha = 0.2f))))
                .border(2.dp, colors.primaryAccent, RoundedCornerShape(CyberRadius.lg))
                .padding(horizontal = 32.dp, vertical = 24.dp),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = card.genre,
                style = MaterialTheme.typography.headlineMedium,
                color = colors.textPrimary,
                fontWeight = FontWeight.Bold
            )
        }
        Spacer(modifier = Modifier.height(24.dp))
        Text(
            text = "Your signature auditory atmosphere throughout the year.",
            style = MaterialTheme.typography.bodyMedium,
            color = colors.textSecondary,
            textAlign = TextAlign.Center
        )
    }
}

@Composable
private fun StoryHabitsCard(card: ReplayStoryCard.ListeningHabits, colors: CyberPulseColors) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(text = "Rhythm & Habit", style = MaterialTheme.typography.headlineMedium, color = colors.textPrimary, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.height(24.dp))
        CyberCard(modifier = Modifier.fillMaxWidth()) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.Schedule, contentDescription = null, tint = colors.primaryAccent, modifier = Modifier.size(32.dp))
                Spacer(modifier = Modifier.width(16.dp))
                Column {
                    Text(text = "Peak Time", style = MaterialTheme.typography.labelSmall, color = colors.textSecondary)
                    Text(text = card.peakTime, style = MaterialTheme.typography.titleMedium, color = colors.textPrimary, fontWeight = FontWeight.Bold)
                }
            }
        }
        Spacer(modifier = Modifier.height(16.dp))
        CyberCard(modifier = Modifier.fillMaxWidth()) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.Whatshot, contentDescription = null, tint = colors.warningAccent, modifier = Modifier.size(32.dp))
                Spacer(modifier = Modifier.width(16.dp))
                Column {
                    Text(text = "Longest Streak", style = MaterialTheme.typography.labelSmall, color = colors.textSecondary)
                    Text(text = "${card.longestStreakDays} Consecutive Days", style = MaterialTheme.typography.titleMedium, color = colors.textPrimary, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
private fun StoryDjCard(card: ReplayStoryCard.CyberDjHighlight, colors: CyberPulseColors) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Icon(Icons.Default.GraphicEq, contentDescription = null, tint = colors.secondaryAccent, modifier = Modifier.size(64.dp))
        Spacer(modifier = Modifier.height(20.dp))
        Text(text = "Cyber DJ Sessions", style = MaterialTheme.typography.headlineMedium, color = colors.textPrimary, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.height(12.dp))
        Text(
            text = "You enjoyed ${card.cyberDjMinutes} minutes guided by algorithmic DJ transitions.",
            style = MaterialTheme.typography.bodyLarge,
            color = colors.textSecondary,
            textAlign = TextAlign.Center
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = "Favorite Mode: ${card.favoriteMode}",
            style = MaterialTheme.typography.titleMedium,
            color = colors.secondaryAccent,
            fontWeight = FontWeight.Bold
        )
    }
}

@Composable
private fun StoryRoadCard(card: ReplayStoryCard.RoadListeningHighlight, colors: CyberPulseColors) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Icon(Icons.Default.DirectionsCar, contentDescription = null, tint = colors.primaryAccent, modifier = Modifier.size(64.dp))
        Spacer(modifier = Modifier.height(20.dp))
        Text(text = "Time on the Road", style = MaterialTheme.typography.headlineMedium, color = colors.textPrimary, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.height(12.dp))
        Text(
            text = "${card.roadMinutes} minutes with Android Auto",
            style = MaterialTheme.typography.titleLarge,
            color = colors.primaryAccent,
            fontWeight = FontWeight.Bold
        )
        if (card.topRoadSong != null) {
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "Most played on the road:\n\"${card.topRoadSong}\"",
                style = MaterialTheme.typography.bodyMedium,
                color = colors.textSecondary,
                textAlign = TextAlign.Center
            )
        }
    }
}

@Composable
private fun StorySourceCard(card: ReplayStoryCard.PrimarySourceHighlight, colors: CyberPulseColors) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Icon(Icons.Default.Podcasts, contentDescription = null, tint = colors.primaryAccent, modifier = Modifier.size(64.dp))
        Spacer(modifier = Modifier.height(20.dp))
        Text(text = "Your Primary Stage", style = MaterialTheme.typography.headlineMedium, color = colors.textPrimary, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.height(12.dp))
        Text(
            text = card.source.name.replace("_", " "),
            style = MaterialTheme.typography.titleLarge,
            color = colors.primaryAccent,
            fontWeight = FontWeight.Bold
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = "Your most frequented audio source in CyberPulse.",
            style = MaterialTheme.typography.bodyMedium,
            color = colors.textSecondary,
            textAlign = TextAlign.Center
        )
    }
}

@Composable
private fun StoryPersonalityCard(card: ReplayStoryCard.PersonalitySummary, colors: CyberPulseColors) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(text = "Your Sonic Personality", style = MaterialTheme.typography.titleLarge, color = colors.secondaryAccent)
        Spacer(modifier = Modifier.height(24.dp))
        Box(
            modifier = Modifier
                .clip(RoundedCornerShape(CyberRadius.lg))
                .background(colors.surfaceElevated)
                .border(2.dp, colors.primaryAccent, RoundedCornerShape(CyberRadius.lg))
                .padding(horizontal = 28.dp, vertical = 20.dp),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = card.title,
                style = MaterialTheme.typography.headlineLarge,
                color = colors.primaryAccent,
                fontWeight = FontWeight.Black
            )
        }
        Spacer(modifier = Modifier.height(20.dp))
        Text(
            text = card.description,
            style = MaterialTheme.typography.bodyLarge,
            color = colors.textSecondary,
            textAlign = TextAlign.Center
        )
    }
}

@Composable
private fun StoryFinalCard(card: ReplayStoryCard.FinalShareCard, colors: CyberPulseColors, onShare: () -> Unit) {
    val replay = card.replayData
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier.fillMaxWidth()
    ) {
        // Neon Card Snapshot
        CyberCard(
            modifier = Modifier
                .fillMaxWidth()
                .border(
                    1.dp,
                    Brush.verticalGradient(listOf(colors.primaryAccent, colors.secondaryAccent)),
                    RoundedCornerShape(CyberRadius.md)
                )
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    text = "CYBERPULSE REPLAY ${replay.year}",
                    style = MaterialTheme.typography.labelMedium,
                    color = colors.primaryAccent,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp
                )
                Spacer(modifier = Modifier.height(12.dp))
                Text(
                    text = "${replay.totalMinutes} min",
                    style = MaterialTheme.typography.headlineLarge,
                    color = colors.textPrimary,
                    fontWeight = FontWeight.Black
                )
                Text(
                    text = "Personality: ${replay.personalityTitle}",
                    style = MaterialTheme.typography.bodyMedium,
                    color = colors.secondaryAccent,
                    fontWeight = FontWeight.SemiBold
                )
                Spacer(modifier = Modifier.height(16.dp))
                HorizontalDivider(color = colors.border.copy(alpha = 0.5f))
                Spacer(modifier = Modifier.height(12.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column {
                        Text("Top Song", style = MaterialTheme.typography.labelSmall, color = colors.textMuted)
                        Text(replay.topSong?.title ?: "N/A", style = MaterialTheme.typography.bodyMedium, color = colors.textPrimary, fontWeight = FontWeight.Bold, maxLines = 1)
                    }
                    Column(horizontalAlignment = Alignment.End) {
                        Text("Top Artist", style = MaterialTheme.typography.labelSmall, color = colors.textMuted)
                        Text(replay.topArtist?.artistName ?: "N/A", style = MaterialTheme.typography.bodyMedium, color = colors.textPrimary, fontWeight = FontWeight.Bold, maxLines = 1)
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(28.dp))
        CyberButton(
            text = "Share My Replay",
            onClick = onShare,
            modifier = Modifier.fillMaxWidth(0.85f)
        )
    }
}

@Composable
private fun IneligibleReplayView(
    replay: CyberPulseReplayData?,
    onGenerateTestData: () -> Unit,
    onClose: () -> Unit
) {
    val colors = LocalCyberPulseColors.current

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(CyberSpacing.screenHorizontal),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Box(
            modifier = Modifier
                .size(72.dp)
                .clip(CircleShape)
                .background(colors.surfaceElevated)
                .border(1.dp, colors.primaryAccent, CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Icon(Icons.Default.AutoAwesome, contentDescription = null, tint = colors.primaryAccent, modifier = Modifier.size(36.dp))
        }
        Spacer(modifier = Modifier.height(CyberSpacing.lg))
        Text(
            text = "CyberPulse Replay ${replay?.year ?: 2026}",
            style = MaterialTheme.typography.headlineSmall,
            color = colors.textPrimary,
            fontWeight = FontWeight.Bold,
            textAlign = TextAlign.Center
        )
        Spacer(modifier = Modifier.height(CyberSpacing.sm))
        Text(
            text = "Replay unlocks when you reach at least 100 qualified plays or 300 minutes of listening.",
            style = MaterialTheme.typography.bodyMedium,
            color = colors.textSecondary,
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(CyberSpacing.xl))

        // Progress Bar
        val plays = replay?.qualifiedPlaysCount ?: 0
        val minutes = replay?.totalMinutes ?: 0L
        val playsFraction = (plays / 100f).coerceIn(0f, 1f)

        LinearProgressIndicator(
            progress = { playsFraction },
            modifier = Modifier
                .fillMaxWidth(0.85f)
                .height(8.dp)
                .clip(RoundedCornerShape(4.dp)),
            color = colors.primaryAccent,
            trackColor = colors.surfaceElevated
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = "$plays / 100 qualified plays • $minutes / 300 minutes",
            style = MaterialTheme.typography.bodySmall,
            color = colors.primaryAccent,
            fontWeight = FontWeight.SemiBold
        )

        Spacer(modifier = Modifier.height(CyberSpacing.xl))

        // Demo Testing Button
        CyberButton(
            text = "Generate Replay Test Data",
            onClick = onGenerateTestData,
            modifier = Modifier.fillMaxWidth(0.85f)
        )

        Spacer(modifier = Modifier.height(CyberSpacing.md))
        TextButton(onClick = onClose) {
            Text("Back to Player", color = colors.textMuted)
        }
    }
}
