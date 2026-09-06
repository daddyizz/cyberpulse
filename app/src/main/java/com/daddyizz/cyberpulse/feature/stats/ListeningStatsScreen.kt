package com.daddyizz.cyberpulse.feature.stats

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.daddyizz.cyberpulse.core.analytics.*
import com.daddyizz.cyberpulse.core.designsystem.*
import com.daddyizz.cyberpulse.core.model.MusicSource

@Composable
fun ListeningStatsScreen(
    viewModel: ListeningStatsViewModel,
    onBackClick: () -> Unit,
    onNavigateToReplay: () -> Unit,
    onNavigateToPro: () -> Unit,
    modifier: Modifier = Modifier
) {
    val uiState by viewModel.uiState.collectAsState()
    val colors = LocalCyberPulseColors.current

    Scaffold(
        containerColor = Color.Transparent,
        modifier = modifier.fillMaxSize()
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .statusBarsPadding()
        ) {
            // Top Navigation Bar
            CyberTopBar(
                title = "Listening Stats",
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(
                            imageVector = Icons.Default.ArrowBack,
                            contentDescription = "Back",
                            tint = colors.textPrimary
                        )
                    }
                },
                actions = {
                    IconButton(onClick = onNavigateToReplay) {
                        Icon(
                            imageVector = Icons.Default.AutoAwesome,
                            contentDescription = "CyberPulse Replay",
                            tint = colors.primaryAccent
                        )
                    }
                    IconButton(onClick = { viewModel.refresh() }) {
                        Icon(
                            imageVector = Icons.Default.Refresh,
                            contentDescription = "Refresh",
                            tint = colors.textSecondary
                        )
                    }
                }
            )

            // Period Selector Tabs (7 Days, 30 Days, This Year, All Time)
            PeriodSelector(
                selectedPeriod = uiState.selectedPeriod,
                isPro = uiState.isPro,
                onSelectPeriod = { viewModel.selectPeriod(it) }
            )

            Spacer(modifier = Modifier.height(CyberSpacing.md))

            if (uiState.isLoading) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(bottom = 80.dp),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator(color = colors.primaryAccent)
                }
            } else if (!uiState.hasMinimumData && uiState.stats.totalListeningMinutes == 0L) {
                EmptyStatsState(
                    onGenerateDemo = { viewModel.generateDemoStats() },
                    onNavigateToReplay = onNavigateToReplay
                )
            } else {
                StatsContent(
                    stats = uiState.stats,
                    isPro = uiState.isPro,
                    onNavigateToReplay = onNavigateToReplay,
                    onNavigateToPro = onNavigateToPro,
                    onClearStats = { viewModel.clearAllData() }
                )
            }
        }
    }

    // Pro Feature Lock Dialog
    if (uiState.showProLockDialog) {
        AlertDialog(
            onDismissRequest = { viewModel.dismissProDialog() },
            title = {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.Lock,
                        contentDescription = null,
                        tint = colors.warningAccent
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Advanced Analytics", color = colors.textPrimary)
                }
            },
            text = {
                Text(
                    "30-day trends, annual recaps, full catalog distributions, and Android Auto road metrics are exclusive to CyberPulse Pro.",
                    color = colors.textSecondary
                )
            },
            confirmButton = {
                CyberButton(
                    text = "Upgrade to Pro",
                    onClick = {
                        viewModel.dismissProDialog()
                        onNavigateToPro()
                    }
                )
            },
            dismissButton = {
                TextButton(onClick = { viewModel.dismissProDialog() }) {
                    Text("Maybe Later", color = colors.textMuted)
                }
            },
            containerColor = colors.surfaceElevated
        )
    }
}

@Composable
private fun PeriodSelector(
    selectedPeriod: ListeningPeriod,
    isPro: Boolean,
    onSelectPeriod: (ListeningPeriod) -> Unit
) {
    val colors = LocalCyberPulseColors.current

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = CyberSpacing.screenHorizontal)
            .clip(RoundedCornerShape(CyberRadius.md))
            .background(colors.surfaceElevated)
            .border(0.5.dp, colors.border, RoundedCornerShape(CyberRadius.md))
            .padding(4.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        val periods = listOf(
            ListeningPeriod.WEEK_7_DAYS to "7 Days",
            ListeningPeriod.MONTH_30_DAYS to "30 Days",
            ListeningPeriod.THIS_YEAR to "This Year",
            ListeningPeriod.ALL_TIME to "All Time"
        )

        periods.forEach { (period, label) ->
            val isSelected = selectedPeriod == period
            val isLocked = !isPro && period != ListeningPeriod.WEEK_7_DAYS

            Box(
                modifier = Modifier
                    .weight(1f)
                    .clip(RoundedCornerShape(CyberRadius.sm))
                    .background(
                        if (isSelected) colors.primaryAccent.copy(alpha = 0.2f) else Color.Transparent
                    )
                    .border(
                        width = if (isSelected) 1.dp else 0.dp,
                        color = if (isSelected) colors.primaryAccent else Color.Transparent,
                        shape = RoundedCornerShape(CyberRadius.sm)
                    )
                    .clickable { onSelectPeriod(period) }
                    .padding(vertical = 8.dp),
                contentAlignment = Alignment.Center
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.Center
                ) {
                    Text(
                        text = label,
                        style = MaterialTheme.typography.labelMedium,
                        color = if (isSelected) colors.primaryAccent else colors.textSecondary,
                        fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
                    )
                    if (isLocked) {
                        Spacer(modifier = Modifier.width(3.dp))
                        Icon(
                            imageVector = Icons.Default.Lock,
                            contentDescription = "Pro",
                            tint = colors.textMuted,
                            modifier = Modifier.size(11.dp)
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun StatsContent(
    stats: ListeningStats,
    isPro: Boolean,
    onNavigateToReplay: () -> Unit,
    onNavigateToPro: () -> Unit,
    onClearStats: () -> Unit
) {
    val colors = LocalCyberPulseColors.current

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = CyberSpacing.screenHorizontal),
        contentPadding = PaddingValues(bottom = 90.dp)
    ) {
        // 1. CyberPulse Replay Banner Shortcut
        item {
            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(CyberRadius.md))
                    .clickable(onClick = onNavigateToReplay)
                    .border(
                        1.dp,
                        Brush.horizontalGradient(listOf(colors.primaryAccent, colors.secondaryAccent)),
                        RoundedCornerShape(CyberRadius.md)
                    ),
                color = colors.surfaceElevated
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(CyberSpacing.md),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(42.dp)
                                .clip(CircleShape)
                                .background(colors.primaryAccent.copy(alpha = 0.15f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.AutoAwesome,
                                contentDescription = null,
                                tint = colors.primaryAccent,
                                modifier = Modifier.size(24.dp)
                            )
                        }
                        Spacer(modifier = Modifier.width(CyberSpacing.md))
                        Column {
                            Text(
                                text = "CyberPulse Replay",
                                style = MaterialTheme.typography.titleMedium,
                                color = colors.textPrimary,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "Explore your annual listening story",
                                style = MaterialTheme.typography.bodySmall,
                                color = colors.textSecondary
                            )
                        }
                    }
                    Icon(
                        imageVector = Icons.Default.ChevronRight,
                        contentDescription = null,
                        tint = colors.primaryAccent
                    )
                }
            }
            Spacer(modifier = Modifier.height(CyberSpacing.sectionSpacing))
        }

        // 2. High-Level Metrics Grid
        item {
            CyberSectionHeader(title = "Overview")
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(CyberSpacing.sm)
            ) {
                MetricCard(
                    title = "Listening Time",
                    value = formatMinutes(stats.totalListeningMinutes),
                    subtitle = "total audio duration",
                    icon = Icons.Default.Headphones,
                    modifier = Modifier.weight(1f)
                )
                MetricCard(
                    title = "Qualified Plays",
                    value = stats.totalPlays.toString(),
                    subtitle = ">= 30s playback",
                    icon = Icons.Default.PlayCircle,
                    modifier = Modifier.weight(1f)
                )
            }
            Spacer(modifier = Modifier.height(CyberSpacing.sm))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(CyberSpacing.sm)
            ) {
                MetricCard(
                    title = "Unique Tracks",
                    value = stats.uniqueTracksCount.toString(),
                    subtitle = "distinct songs",
                    icon = Icons.Default.MusicNote,
                    modifier = Modifier.weight(1f)
                )
                MetricCard(
                    title = "Daily Average",
                    value = "%.0f min".format(stats.dailyAverageMinutes),
                    subtitle = "average per day",
                    icon = Icons.Default.DateRange,
                    modifier = Modifier.weight(1f)
                )
            }
            Spacer(modifier = Modifier.height(CyberSpacing.sectionSpacing))
        }

        // 3. Listening Streaks Section
        item {
            CyberSectionHeader(title = "Listening Streak")
            CyberCard(modifier = Modifier.fillMaxWidth()) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceAround
                ) {
                    StreakDisplay(
                        label = "Current Streak",
                        days = stats.currentStreakDays,
                        icon = Icons.Default.Whatshot,
                        accentColor = colors.primaryAccent
                    )
                    Box(
                        modifier = Modifier
                            .height(50.dp)
                            .width(1.dp)
                            .background(colors.border)
                    )
                    StreakDisplay(
                        label = "Longest Streak",
                        days = stats.longestStreakDays,
                        icon = Icons.Default.EmojiEvents,
                        accentColor = colors.secondaryAccent
                    )
                }
                Spacer(modifier = Modifier.height(CyberSpacing.sm))
                Text(
                    text = "A qualifying day requires at least 10 minutes of listening or 3 qualified tracks.",
                    style = MaterialTheme.typography.bodySmall,
                    color = colors.textMuted,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth()
                )
            }
            Spacer(modifier = Modifier.height(CyberSpacing.sectionSpacing))
        }

        // 4. Past 7 Days Native Compose Bar Chart
        item {
            CyberSectionHeader(title = "7-Day Listening Trend")
            CyberCard(modifier = Modifier.fillMaxWidth()) {
                DailyListeningBarChart(bars = stats.dailyBars)
            }
            Spacer(modifier = Modifier.height(CyberSpacing.sectionSpacing))
        }

        // 5. Time-of-Day Habits
        item {
            CyberSectionHeader(title = "Listening Habits")
            CyberCard(modifier = Modifier.fillMaxWidth()) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(46.dp)
                            .clip(CircleShape)
                            .background(colors.surfaceElevated)
                            .border(1.dp, colors.primaryAccent, CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.NightsStay,
                            contentDescription = null,
                            tint = colors.primaryAccent
                        )
                    }
                    Spacer(modifier = Modifier.width(CyberSpacing.md))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = stats.timeOfDayCategory,
                            style = MaterialTheme.typography.titleMedium,
                            color = colors.textPrimary,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "Peak listening on ${stats.mostActiveDayOfWeek}",
                            style = MaterialTheme.typography.bodySmall,
                            color = colors.textSecondary
                        )
                    }
                }

                Spacer(modifier = Modifier.height(CyberSpacing.md))
                HourlyDistributionView(distribution = stats.hourlyDistribution)
            }
            Spacer(modifier = Modifier.height(CyberSpacing.sectionSpacing))
        }

        // 6. Top Tracks Section
        item {
            CyberSectionHeader(title = "Top Songs")
            if (stats.topTracks.isEmpty()) {
                CyberCard(modifier = Modifier.fillMaxWidth()) {
                    Text(
                        text = "No songs have reached qualified play status in this period.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = colors.textMuted
                    )
                }
            } else {
                CyberCard(modifier = Modifier.fillMaxWidth()) {
                    Column(verticalArrangement = Arrangement.spacedBy(CyberSpacing.sm)) {
                        stats.topTracks.forEachIndexed { index, trackStat ->
                            TopTrackRow(rank = index + 1, stat = trackStat)
                            if (index < stats.topTracks.size - 1) {
                                HorizontalDivider(
                                    color = colors.border.copy(alpha = 0.4f),
                                    modifier = Modifier.padding(vertical = 4.dp)
                                )
                            }
                        }
                    }
                }
            }
            Spacer(modifier = Modifier.height(CyberSpacing.sectionSpacing))
        }

        // 7. Top Artists Section
        item {
            CyberSectionHeader(title = "Top Artists")
            if (stats.topArtists.isEmpty()) {
                CyberCard(modifier = Modifier.fillMaxWidth()) {
                    Text(
                        text = "No artist listening data recorded for this period.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = colors.textMuted
                    )
                }
            } else {
                CyberCard(modifier = Modifier.fillMaxWidth()) {
                    Column(verticalArrangement = Arrangement.spacedBy(CyberSpacing.sm)) {
                        stats.topArtists.forEachIndexed { index, artistStat ->
                            TopArtistRow(rank = index + 1, stat = artistStat)
                            if (index < stats.topArtists.size - 1) {
                                HorizontalDivider(
                                    color = colors.border.copy(alpha = 0.4f),
                                    modifier = Modifier.padding(vertical = 4.dp)
                                )
                            }
                        }
                    }
                }
            }
            Spacer(modifier = Modifier.height(CyberSpacing.sectionSpacing))
        }

        // 8. Top Genres (if available)
        if (stats.topGenres.isNotEmpty()) {
            item {
                CyberSectionHeader(title = "Top Genres")
                CyberCard(modifier = Modifier.fillMaxWidth()) {
                    Column(verticalArrangement = Arrangement.spacedBy(CyberSpacing.sm)) {
                        stats.topGenres.forEach { genreStat ->
                            GenreProgressBar(stat = genreStat)
                        }
                    }
                }
                Spacer(modifier = Modifier.height(CyberSpacing.sectionSpacing))
            }
        }

        // 9. Source Breakdown Section
        item {
            CyberSectionHeader(title = "Listening by Source")
            CyberCard(modifier = Modifier.fillMaxWidth()) {
                Column(verticalArrangement = Arrangement.spacedBy(CyberSpacing.sm)) {
                    stats.sourceBreakdown.forEach { item ->
                        SourceBreakdownRow(item = item)
                    }
                }
            }
            Spacer(modifier = Modifier.height(CyberSpacing.sectionSpacing))
        }

        // 10. Cyber DJ & Android Auto Road Insights
        if (stats.cyberDjMinutes > 0 || stats.androidAutoMinutes > 0) {
            item {
                CyberSectionHeader(title = "Modes & Extended Listening")
                CyberCard(modifier = Modifier.fillMaxWidth()) {
                    if (stats.cyberDjMinutes > 0) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(Icons.Default.GraphicEq, contentDescription = null, tint = colors.secondaryAccent)
                            Spacer(modifier = Modifier.width(8.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text("Cyber DJ Continuous Discovery", style = MaterialTheme.typography.titleSmall, color = colors.textPrimary)
                                Text("${stats.cyberDjMinutes} minutes • Favorite: ${stats.cyberDjFavoriteMode ?: "Standard"}", style = MaterialTheme.typography.bodySmall, color = colors.textSecondary)
                            }
                        }
                        if (stats.androidAutoMinutes > 0) {
                            Spacer(modifier = Modifier.height(8.dp))
                        }
                    }
                    if (stats.androidAutoMinutes > 0) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(Icons.Default.DirectionsCar, contentDescription = null, tint = colors.primaryAccent)
                            Spacer(modifier = Modifier.width(8.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text("Time on the Road (Android Auto)", style = MaterialTheme.typography.titleSmall, color = colors.textPrimary)
                                Text("${stats.androidAutoMinutes} minutes road listening", style = MaterialTheme.typography.bodySmall, color = colors.textSecondary)
                            }
                        }
                    }
                }
                Spacer(modifier = Modifier.height(CyberSpacing.sectionSpacing))
            }
        }

        // 11. Footer with Tracking Since & Clear Action
        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = CyberSpacing.md),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "🔒 Analytics stored entirely on your device. Tracking since ${stats.trackingSinceDate}.",
                    style = MaterialTheme.typography.bodySmall,
                    color = colors.textMuted,
                    textAlign = TextAlign.Center
                )
                Spacer(modifier = Modifier.height(CyberSpacing.sm))
                TextButton(onClick = onClearStats) {
                    Text("Clear Analytics History", color = colors.errorAccent, style = MaterialTheme.typography.bodySmall)
                }
            }
        }
    }
}

@Composable
private fun MetricCard(
    title: String,
    value: String,
    subtitle: String,
    icon: ImageVector,
    modifier: Modifier = Modifier
) {
    val colors = LocalCyberPulseColors.current

    CyberCard(modifier = modifier) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(text = title, style = MaterialTheme.typography.bodySmall, color = colors.textSecondary)
            Icon(imageVector = icon, contentDescription = null, tint = colors.primaryAccent, modifier = Modifier.size(18.dp))
        }
        Spacer(modifier = Modifier.height(CyberSpacing.xs))
        Text(
            text = value,
            style = MaterialTheme.typography.headlineMedium,
            color = colors.textPrimary,
            fontWeight = FontWeight.Bold
        )
        Text(text = subtitle, style = MaterialTheme.typography.labelSmall, color = colors.textMuted)
    }
}

@Composable
private fun StreakDisplay(
    label: String,
    days: Int,
    icon: ImageVector,
    accentColor: Color
) {
    val colors = LocalCyberPulseColors.current

    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(imageVector = icon, contentDescription = null, tint = accentColor, modifier = Modifier.size(20.dp))
            Spacer(modifier = Modifier.width(4.dp))
            Text(
                text = "$days",
                style = MaterialTheme.typography.headlineMedium,
                color = colors.textPrimary,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = if (days == 1) " day" else " days",
                style = MaterialTheme.typography.bodyMedium,
                color = colors.textSecondary
            )
        }
        Text(text = label, style = MaterialTheme.typography.bodySmall, color = colors.textSecondary)
    }
}

@Composable
private fun DailyListeningBarChart(bars: List<DailyListeningBar>) {
    val colors = LocalCyberPulseColors.current
    val maxMinutes = bars.maxOfOrNull { it.minutes }?.coerceAtLeast(1L) ?: 1L

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(130.dp)
            .padding(top = 12.dp, bottom = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.Bottom
    ) {
        bars.forEach { bar ->
            val fraction = (bar.minutes.toFloat() / maxMinutes).coerceIn(0.05f, 1f)

            Column(
                modifier = Modifier.weight(1f),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Bottom
            ) {
                if (bar.minutes > 0) {
                    Text(
                        text = "${bar.minutes}m",
                        style = MaterialTheme.typography.labelSmall,
                        color = colors.primaryAccent,
                        fontSize = 9.sp
                    )
                    Spacer(modifier = Modifier.height(2.dp))
                }
                Box(
                    modifier = Modifier
                        .width(22.dp)
                        .fillMaxHeight(fraction)
                        .clip(RoundedCornerShape(topStart = 4.dp, topEnd = 4.dp))
                        .background(
                            Brush.verticalGradient(
                                listOf(colors.primaryAccent, colors.secondaryAccent)
                            )
                        )
                )
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = bar.dayOfWeekLabel,
                    style = MaterialTheme.typography.labelSmall,
                    color = colors.textSecondary
                )
            }
        }
    }
}

@Composable
private fun HourlyDistributionView(distribution: Map<Int, Long>) {
    val colors = LocalCyberPulseColors.current
    val maxHourMin = distribution.values.maxOrNull()?.coerceAtLeast(1L) ?: 1L

    Column {
        Text(
            text = "Activity by Hour of Day",
            style = MaterialTheme.typography.labelMedium,
            color = colors.textSecondary
        )
        Spacer(modifier = Modifier.height(8.dp))
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(48.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.Bottom
        ) {
            for (h in 0..23) {
                val min = distribution[h] ?: 0L
                val fraction = (min.toFloat() / maxHourMin).coerceIn(0.08f, 1f)

                Box(
                    modifier = Modifier
                        .weight(1f)
                        .padding(horizontal = 1.dp)
                        .fillMaxHeight(fraction)
                        .clip(RoundedCornerShape(topStart = 2.dp, topEnd = 2.dp))
                        .background(
                            if (min > 0) colors.primaryAccent.copy(alpha = 0.8f) else colors.border.copy(alpha = 0.3f)
                        )
                )
            }
        }
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 4.dp),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text("12 AM", style = MaterialTheme.typography.labelSmall, color = colors.textMuted, fontSize = 9.sp)
            Text("6 AM", style = MaterialTheme.typography.labelSmall, color = colors.textMuted, fontSize = 9.sp)
            Text("12 PM", style = MaterialTheme.typography.labelSmall, color = colors.textMuted, fontSize = 9.sp)
            Text("6 PM", style = MaterialTheme.typography.labelSmall, color = colors.textMuted, fontSize = 9.sp)
            Text("11 PM", style = MaterialTheme.typography.labelSmall, color = colors.textMuted, fontSize = 9.sp)
        }
    }
}

@Composable
private fun TopTrackRow(rank: Int, stat: TrackPlayStat) {
    val colors = LocalCyberPulseColors.current

    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = "$rank",
            style = MaterialTheme.typography.titleMedium,
            color = if (rank <= 3) colors.primaryAccent else colors.textMuted,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.width(24.dp)
        )
        Box(
            modifier = Modifier
                .size(40.dp)
                .clip(RoundedCornerShape(CyberRadius.sm))
                .background(colors.surfaceElevated),
            contentAlignment = Alignment.Center
        ) {
            Icon(Icons.Default.MusicNote, contentDescription = null, tint = colors.textSecondary)
        }
        Spacer(modifier = Modifier.width(CyberSpacing.md))
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = stat.title,
                style = MaterialTheme.typography.bodyLarge,
                color = colors.textPrimary,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            Text(
                text = stat.artist,
                style = MaterialTheme.typography.bodySmall,
                color = colors.textSecondary,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }
        Column(horizontalAlignment = Alignment.End) {
            Text(
                text = "${stat.playCount} plays",
                style = MaterialTheme.typography.labelMedium,
                color = colors.primaryAccent,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = "${stat.totalListenedMinutes}m",
                style = MaterialTheme.typography.labelSmall,
                color = colors.textMuted
            )
        }
    }
}

@Composable
private fun TopArtistRow(rank: Int, stat: ArtistPlayStat) {
    val colors = LocalCyberPulseColors.current

    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = "$rank",
            style = MaterialTheme.typography.titleMedium,
            color = if (rank <= 3) colors.primaryAccent else colors.textMuted,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.width(24.dp)
        )
        Box(
            modifier = Modifier
                .size(40.dp)
                .clip(CircleShape)
                .background(colors.surfaceElevated)
                .border(1.dp, colors.primaryAccent.copy(alpha = 0.5f), CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Icon(Icons.Default.Person, contentDescription = null, tint = colors.primaryAccent)
        }
        Spacer(modifier = Modifier.width(CyberSpacing.md))
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = stat.artistName,
                style = MaterialTheme.typography.bodyLarge,
                color = colors.textPrimary,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            Text(
                text = "${stat.uniqueTracksCount} unique tracks",
                style = MaterialTheme.typography.bodySmall,
                color = colors.textSecondary
            )
        }
        Column(horizontalAlignment = Alignment.End) {
            Text(
                text = "${stat.totalListenedMinutes} min",
                style = MaterialTheme.typography.labelMedium,
                color = colors.textPrimary,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = "${stat.playCount} plays",
                style = MaterialTheme.typography.labelSmall,
                color = colors.textMuted
            )
        }
    }
}

@Composable
private fun GenreProgressBar(stat: GenrePlayStat) {
    val colors = LocalCyberPulseColors.current

    Column(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(text = stat.genreName, style = MaterialTheme.typography.bodyMedium, color = colors.textPrimary)
            Text(text = "%.0f%%".format(stat.percentage), style = MaterialTheme.typography.bodySmall, color = colors.primaryAccent)
        }
        Spacer(modifier = Modifier.height(4.dp))
        LinearProgressIndicator(
            progress = { (stat.percentage / 100f).coerceIn(0f, 1f) },
            modifier = Modifier
                .fillMaxWidth()
                .height(6.dp)
                .clip(RoundedCornerShape(3.dp)),
            color = colors.primaryAccent,
            trackColor = colors.surfaceElevated
        )
    }
}

@Composable
private fun SourceBreakdownRow(item: SourceStatItem) {
    val colors = LocalCyberPulseColors.current

    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            val icon = when (item.source) {
                MusicSource.LOCAL, MusicSource.LOCAL_STORAGE -> Icons.Default.Folder
                MusicSource.RADIO -> Icons.Default.Radio
                MusicSource.YOUTUBE -> Icons.Default.SmartDisplay
                MusicSource.SPOTIFY -> Icons.Default.Podcasts
                else -> Icons.Default.GraphicEq
            }
            Icon(imageVector = icon, contentDescription = null, tint = colors.primaryAccent, modifier = Modifier.size(18.dp))
            Spacer(modifier = Modifier.width(8.dp))
            Column {
                Text(text = item.label, style = MaterialTheme.typography.bodyMedium, color = colors.textPrimary)
                if (item.source == MusicSource.YOUTUBE) {
                    Text(text = "External video playback", style = MaterialTheme.typography.labelSmall, color = colors.textMuted)
                }
            }
        }
        Column(horizontalAlignment = Alignment.End) {
            Text(text = "${item.totalMinutes} min", style = MaterialTheme.typography.bodyMedium, color = colors.textPrimary, fontWeight = FontWeight.Bold)
            Text(text = "%.0f%%".format(item.percentage), style = MaterialTheme.typography.labelSmall, color = colors.textSecondary)
        }
    }
}

@Composable
private fun EmptyStatsState(
    onGenerateDemo: () -> Unit,
    onNavigateToReplay: () -> Unit
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
                .size(80.dp)
                .clip(CircleShape)
                .background(colors.surfaceElevated)
                .border(1.5.dp, colors.primaryAccent, CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Default.BarChart,
                contentDescription = null,
                tint = colors.primaryAccent,
                modifier = Modifier.size(42.dp)
            )
        }
        Spacer(modifier = Modifier.height(CyberSpacing.lg))
        Text(
            text = "Keep listening to unlock your CyberPulse stats",
            style = MaterialTheme.typography.headlineSmall,
            color = colors.textPrimary,
            textAlign = TextAlign.Center,
            fontWeight = FontWeight.Bold
        )
        Spacer(modifier = Modifier.height(CyberSpacing.sm))
        Text(
            text = "Every statistic in CyberPulse is derived entirely from real playback events recorded on your device. Start a track or station to begin building your auditory footprint.",
            style = MaterialTheme.typography.bodyMedium,
            color = colors.textSecondary,
            textAlign = TextAlign.Center
        )
        Spacer(modifier = Modifier.height(CyberSpacing.xl))

        // Demo Data Button for Testing
        CyberButton(
            text = "Generate Demo Stats (120 plays)",
            onClick = onGenerateDemo,
            modifier = Modifier.fillMaxWidth(0.85f)
        )
    }
}

private fun formatMinutes(minutes: Long): String {
    if (minutes < 60) return "${minutes}m"
    val hours = minutes / 60
    val rem = minutes % 60
    return "${hours}h ${rem}m"
}
