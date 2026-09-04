package com.daddyizz.cyberpulse.core.designsystem

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.daddyizz.cyberpulse.core.model.Artist
import com.daddyizz.cyberpulse.core.model.Playlist
import com.daddyizz.cyberpulse.core.model.Track

/**
 * CyberPulseBackground: The foundational layout canvas with subtle gradient depth.
 */
@Composable
fun CyberPulseBackground(
    modifier: Modifier = Modifier,
    dynamicGlow: Boolean = true,
    content: @Composable BoxScope.() -> Unit
) {
    val colors = LocalCyberPulseColors.current
    Box(
        modifier = modifier
            .fillMaxSize()
            .background(colors.background)
    ) {
        if (dynamicGlow) {
            // Subtle top atmospheric glow
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(280.dp)
                    .background(
                        Brush.verticalGradient(
                            colors = listOf(
                                colors.secondaryAccent.copy(alpha = 0.08f),
                                colors.primaryAccent.copy(alpha = 0.03f),
                                Color.Transparent
                            )
                        )
                    )
            )
        }
        content()
    }
}

/**
 * CyberCard: Base surface container with refined borders and elevation.
 */
@Composable
fun CyberCard(
    modifier: Modifier = Modifier,
    onClick: (() -> Unit)? = null,
    shape: RoundedCornerShape = RoundedCornerShape(CyberRadius.md),
    borderColor: Color = LocalCyberPulseColors.current.border,
    backgroundColor: Color = LocalCyberPulseColors.current.surfaceCard,
    content: @Composable ColumnScope.() -> Unit
) {
    val clickableModifier = if (onClick != null) {
        Modifier.clickable(onClick = onClick)
    } else Modifier

    Column(
        modifier = modifier
            .clip(shape)
            .background(backgroundColor)
            .border(1.dp, borderColor, shape)
            .then(clickableModifier)
            .padding(CyberSpacing.md)
    ) {
        content()
    }
}

/**
 * Reusable abstract cyberpunk gradient artwork generator.
 */
@Composable
fun CyberArtworkPlaceholder(
    keyName: String,
    modifier: Modifier = Modifier,
    shape: RoundedCornerShape = RoundedCornerShape(CyberRadius.sm)
) {
    val colors = LocalCyberPulseColors.current
    val gradientColors = when (keyName) {
        "neon_horizon" -> listOf(Color(0xFF0F2027), Color(0xFF203A43), Color(0xFF00F5FF))
        "purple_pulse" -> listOf(Color(0xFF2C0B4D), Color(0xFF8B5CFF), Color(0xFFFF2ED1))
        "digital_rain" -> listOf(Color(0xFF051C14), Color(0xFF0D3B2C), Color(0xFFB8FF2C))
        "midnight_circuit" -> listOf(Color(0xFF10131C), Color(0xFF1F2436), Color(0xFF00F5FF))
        "electric_dream" -> listOf(Color(0xFF33082F), Color(0xFFFF2ED1), Color(0xFF8B5CFF))
        else -> listOf(colors.surfaceElevated, colors.secondaryAccent.copy(alpha = 0.4f), colors.primaryAccent.copy(alpha = 0.6f))
    }

    Box(
        modifier = modifier
            .clip(shape)
            .background(Brush.linearGradient(gradientColors)),
        contentAlignment = Alignment.Center
    ) {
        Icon(
            imageVector = Icons.Default.GraphicEq,
            contentDescription = "Artwork graphic",
            tint = Color.White.copy(alpha = 0.35f),
            modifier = Modifier.size(28.dp)
        )
    }
}

/**
 * CyberMusicCard: Track card displaying artwork, song title, and artist.
 */
@Composable
fun CyberMusicCard(
    track: Track,
    onTrackClick: (Track) -> Unit,
    modifier: Modifier = Modifier
) {
    val colors = LocalCyberPulseColors.current
    Column(
        modifier = modifier
            .width(150.dp)
            .clickable { onTrackClick(track) }
    ) {
        CyberArtworkPlaceholder(
            keyName = track.placeholderArtworkKey,
            modifier = Modifier
                .size(150.dp)
                .border(1.dp, colors.border, RoundedCornerShape(CyberRadius.md)),
            shape = RoundedCornerShape(CyberRadius.md)
        )
        Spacer(modifier = Modifier.height(CyberSpacing.sm))
        Text(
            text = track.title,
            style = MaterialTheme.typography.titleMedium,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            color = colors.textPrimary
        )
        Text(
            text = track.artist,
            style = MaterialTheme.typography.bodyMedium,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            color = colors.textSecondary
        )
    }
}

/**
 * CyberArtistCard: Artist card with circular artwork.
 */
@Composable
fun CyberArtistCard(
    artist: Artist,
    onArtistClick: (Artist) -> Unit,
    modifier: Modifier = Modifier
) {
    val colors = LocalCyberPulseColors.current
    Column(
        modifier = modifier
            .width(120.dp)
            .clickable { onArtistClick(artist) },
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Box(
            modifier = Modifier
                .size(110.dp)
                .clip(CircleShape)
                .border(1.5.dp, colors.primaryAccent.copy(alpha = 0.5f), CircleShape)
                .background(Brush.sweepGradient(listOf(colors.surfaceElevated, colors.secondaryAccent, colors.primaryAccent))),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Default.Person,
                contentDescription = artist.name,
                tint = colors.textPrimary,
                modifier = Modifier.size(44.dp)
            )
        }
        Spacer(modifier = Modifier.height(CyberSpacing.sm))
        Text(
            text = artist.name,
            style = MaterialTheme.typography.titleMedium,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            color = colors.textPrimary,
            textAlign = TextAlign.Center
        )
        Text(
            text = "Artist",
            style = MaterialTheme.typography.labelMedium,
            color = colors.textMuted
        )
    }
}

/**
 * CyberPlaylistCard: Square artwork playlist card with title and subtitle.
 */
@Composable
fun CyberPlaylistCard(
    playlist: Playlist,
    onPlaylistClick: (Playlist) -> Unit,
    modifier: Modifier = Modifier
) {
    val colors = LocalCyberPulseColors.current
    Column(
        modifier = modifier
            .width(160.dp)
            .clickable { onPlaylistClick(playlist) }
    ) {
        CyberArtworkPlaceholder(
            keyName = playlist.artworkKey,
            modifier = Modifier
                .size(160.dp)
                .border(1.dp, colors.border, RoundedCornerShape(CyberRadius.md)),
            shape = RoundedCornerShape(CyberRadius.md)
        )
        Spacer(modifier = Modifier.height(CyberSpacing.sm))
        Text(
            text = playlist.title,
            style = MaterialTheme.typography.titleMedium,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            color = colors.textPrimary
        )
        Text(
            text = playlist.subtitle,
            style = MaterialTheme.typography.bodyMedium,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            color = colors.textSecondary
        )
    }
}

/**
 * CyberSectionHeader: Clean section title with optional action.
 */
@Composable
fun CyberSectionHeader(
    title: String,
    modifier: Modifier = Modifier,
    actionLabel: String? = null,
    onActionClick: (() -> Unit)? = null
) {
    val colors = LocalCyberPulseColors.current
    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = CyberSpacing.screenHorizontal, vertical = CyberSpacing.xs),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = title,
            style = MaterialTheme.typography.headlineMedium,
            color = colors.textPrimary
        )
        if (actionLabel != null && onActionClick != null) {
            Text(
                text = actionLabel,
                style = MaterialTheme.typography.labelLarge,
                color = colors.primaryAccent,
                modifier = Modifier.clickable(onClick = onActionClick)
            )
        }
    }
}

/**
 * CyberPrimaryButton: High-contrast cyberpunk action button with glowing neon cyan edge.
 */
@Composable
fun CyberPrimaryButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    icon: ImageVector? = null,
    enabled: Boolean = true
) {
    val colors = LocalCyberPulseColors.current
    Button(
        onClick = onClick,
        enabled = enabled,
        modifier = modifier
            .height(52.dp)
            .fillMaxWidth(),
        shape = RoundedCornerShape(CyberRadius.md),
        colors = ButtonDefaults.buttonColors(
            containerColor = colors.primaryAccent,
            contentColor = Color(0xFF07090F),
            disabledContainerColor = colors.surfaceElevated,
            disabledContentColor = colors.textMuted
        )
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Center
        ) {
            if (icon != null) {
                Icon(imageVector = icon, contentDescription = null, modifier = Modifier.size(20.dp))
                Spacer(modifier = Modifier.width(CyberSpacing.sm))
            }
            Text(
                text = text,
                style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.Bold)
            )
        }
    }
}

/**
 * CyberSecondaryButton: Outline futuristic button.
 */
@Composable
fun CyberSecondaryButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true
) {
    val colors = LocalCyberPulseColors.current
    OutlinedButton(
        onClick = onClick,
        enabled = enabled,
        modifier = modifier
            .height(52.dp)
            .fillMaxWidth(),
        shape = RoundedCornerShape(CyberRadius.md),
        border = BorderStroke(1.dp, colors.border),
        colors = ButtonDefaults.outlinedButtonColors(
            contentColor = colors.textPrimary
        )
    ) {
        Text(
            text = text,
            style = MaterialTheme.typography.labelLarge
        )
    }
}

/**
 * CyberIconButton: Square/circular touch target for icons.
 */
@Composable
fun CyberIconButton(
    icon: ImageVector,
    contentDescription: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    tint: Color = LocalCyberPulseColors.current.textPrimary
) {
    IconButton(
        onClick = onClick,
        modifier = modifier.size(44.dp)
    ) {
        Icon(imageVector = icon, contentDescription = contentDescription, tint = tint)
    }
}

/**
 * CyberSearchBar: Futuristic text search input.
 */
@Composable
fun CyberSearchBar(
    query: String,
    onQueryChange: (String) -> Unit,
    modifier: Modifier = Modifier,
    placeholder: String = "Songs, artists, albums and playlists",
    onSearch: () -> Unit = {}
) {
    val colors = LocalCyberPulseColors.current
    Row(
        modifier = modifier
            .fillMaxWidth()
            .height(52.dp)
            .clip(RoundedCornerShape(CyberRadius.md))
            .background(colors.surfaceSecondary)
            .border(1.dp, colors.border, RoundedCornerShape(CyberRadius.md))
            .padding(horizontal = CyberSpacing.md),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = Icons.Default.Search,
            contentDescription = "Search",
            tint = colors.textMuted
        )
        Spacer(modifier = Modifier.width(CyberSpacing.sm))
        BasicTextField(
            value = query,
            onValueChange = onQueryChange,
            singleLine = true,
            textStyle = MaterialTheme.typography.bodyLarge.copy(color = colors.textPrimary),
            cursorBrush = SolidColor(colors.primaryAccent),
            keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
            keyboardActions = KeyboardActions(onSearch = { onSearch() }),
            modifier = Modifier.weight(1f),
            decorationBox = { innerTextField ->
                if (query.isEmpty()) {
                    Text(
                        text = placeholder,
                        style = MaterialTheme.typography.bodyLarge,
                        color = colors.textMuted,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
                innerTextField()
            }
        )
        if (query.isNotEmpty()) {
            IconButton(
                onClick = { onQueryChange("") },
                modifier = Modifier.size(28.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Close,
                    contentDescription = "Clear search",
                    tint = colors.textSecondary,
                    modifier = Modifier.size(18.dp)
                )
            }
        }
    }
}

/**
 * CyberChip: Selectable chip for genres, filters, and tags.
 */
@Composable
fun CyberChip(
    text: String,
    isSelected: Boolean,
    onToggle: () -> Unit,
    modifier: Modifier = Modifier
) {
    val colors = LocalCyberPulseColors.current
    val background = if (isSelected) colors.primaryAccent.copy(alpha = 0.15f) else colors.surfaceSecondary
    val border = if (isSelected) colors.primaryAccent else colors.border
    val textColor = if (isSelected) colors.primaryAccent else colors.textSecondary

    Box(
        modifier = modifier
            .clip(RoundedCornerShape(CyberRadius.full))
            .background(background)
            .border(1.dp, border, RoundedCornerShape(CyberRadius.full))
            .clickable(onClick = onToggle)
            .padding(horizontal = CyberSpacing.lg, vertical = CyberSpacing.sm),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = text,
            style = MaterialTheme.typography.labelLarge.copy(
                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
            ),
            color = textColor
        )
    }
}

/**
 * CyberBottomNavigation: Fixed bottom navigation bar.
 */
@Composable
fun CyberBottomNavigation(
    selectedRoute: String,
    onNavigate: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    val colors = LocalCyberPulseColors.current
    val items = listOf(
        Triple("home", "Home", Icons.Default.Home),
        Triple("search", "Search", Icons.Default.Search),
        Triple("explore", "Explore", Icons.Default.Explore),
        Triple("library", "Library", Icons.Default.LibraryMusic),
        Triple("profile", "Profile", Icons.Default.Person)
    )

    NavigationBar(
        modifier = modifier
            .fillMaxWidth()
            .height(CyberSpacing.bottomNavHeight)
            .border(width = 0.5.dp, color = colors.border, shape = RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp)),
        containerColor = colors.surfaceSecondary,
        tonalElevation = CyberElevation.elevated
    ) {
        items.forEach { (route, label, icon) ->
            val isSelected = selectedRoute == route
            NavigationBarItem(
                selected = isSelected,
                onClick = { onNavigate(route) },
                icon = {
                    Icon(
                        imageVector = icon,
                        contentDescription = label,
                        modifier = Modifier.size(24.dp)
                    )
                },
                label = {
                    Text(
                        text = label,
                        style = MaterialTheme.typography.labelMedium.copy(
                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
                        )
                    )
                },
                colors = NavigationBarItemDefaults.colors(
                    selectedIconColor = colors.primaryAccent,
                    selectedTextColor = colors.primaryAccent,
                    unselectedIconColor = colors.textMuted,
                    unselectedTextColor = colors.textMuted,
                    indicatorColor = colors.primaryAccent.copy(alpha = 0.12f)
                )
            )
        }
    }
}

/**
 * CyberTopBar: Unified header bar.
 */
@Composable
fun CyberTopBar(
    title: String,
    modifier: Modifier = Modifier,
    navigationIcon: @Composable (() -> Unit)? = null,
    actions: @Composable RowScope.() -> Unit = {}
) {
    val colors = LocalCyberPulseColors.current
    Row(
        modifier = modifier
            .fillMaxWidth()
            .height(56.dp)
            .padding(horizontal = CyberSpacing.screenHorizontal),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            if (navigationIcon != null) {
                navigationIcon()
                Spacer(modifier = Modifier.width(CyberSpacing.sm))
            }
            Text(
                text = title,
                style = MaterialTheme.typography.titleLarge,
                color = colors.textPrimary
            )
        }
        Row(verticalAlignment = Alignment.CenterVertically) {
            actions()
        }
    }
}

/**
 * CyberMiniPlayerPlaceholder: Persistent mini player docked above bottom navigation.
 * Integrated with Media3 playback engine, swipe gestures, and live state.
 */
@Composable
fun CyberMiniPlayerPlaceholder(
    currentTrack: Track?,
    isPlaying: Boolean,
    onPlayPauseToggle: () -> Unit,
    onExpandClick: () -> Unit,
    modifier: Modifier = Modifier,
    progressFraction: Float = 0f,
    isBuffering: Boolean = false,
    onNextClick: (() -> Unit)? = null,
    onPreviousClick: (() -> Unit)? = null
) {
    if (currentTrack == null) return
    val colors = LocalCyberPulseColors.current

    var totalDrag by remember { mutableFloatStateOf(0f) }

    Box(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = CyberSpacing.md, vertical = CyberSpacing.xs)
            .height(CyberSpacing.miniPlayerHeight)
            .clip(RoundedCornerShape(CyberRadius.md))
            .background(colors.surfaceElevated)
            .border(1.dp, colors.borderHighlight, RoundedCornerShape(CyberRadius.md))
            .clickable(onClick = onExpandClick)
    ) {
        Row(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = CyberSpacing.md),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(
                modifier = Modifier.weight(1f),
                verticalAlignment = Alignment.CenterVertically
            ) {
                CyberArtworkPlaceholder(
                    keyName = currentTrack.placeholderArtworkKey,
                    modifier = Modifier.size(44.dp),
                    shape = RoundedCornerShape(CyberRadius.sm)
                )
                Spacer(modifier = Modifier.width(CyberSpacing.md))
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = currentTrack.title,
                        style = MaterialTheme.typography.titleMedium,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        color = colors.textPrimary
                    )
                    Text(
                        text = if (isBuffering) "Buffering pulse..." else currentTrack.artist,
                        style = MaterialTheme.typography.bodyMedium,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        color = if (isBuffering) colors.primaryAccent else colors.textSecondary
                    )
                }
            }
            Row(verticalAlignment = Alignment.CenterVertically) {
                if (onPreviousClick != null) {
                    IconButton(
                        onClick = onPreviousClick,
                        modifier = Modifier.size(36.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.SkipPrevious,
                            contentDescription = "Previous Track",
                            tint = colors.textSecondary,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                }

                IconButton(
                    onClick = onPlayPauseToggle,
                    modifier = Modifier.size(40.dp)
                ) {
                    if (isBuffering) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(20.dp),
                            color = colors.primaryAccent,
                            strokeWidth = 2.dp
                        )
                    } else {
                        Icon(
                            imageVector = if (isPlaying) Icons.Default.Pause else Icons.Default.PlayArrow,
                            contentDescription = if (isPlaying) "Pause" else "Play",
                            tint = colors.primaryAccent
                        )
                    }
                }

                if (onNextClick != null) {
                    IconButton(
                        onClick = onNextClick,
                        modifier = Modifier.size(36.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.SkipNext,
                            contentDescription = "Next Track",
                            tint = colors.textSecondary,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                }

                IconButton(
                    onClick = onExpandClick,
                    modifier = Modifier.size(36.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.KeyboardArrowUp,
                        contentDescription = "Expand Player",
                        tint = colors.textSecondary,
                        modifier = Modifier.size(22.dp)
                    )
                }
            }
        }

        // Sleek cyber progress indicator along the bottom
        if (progressFraction > 0f) {
            LinearProgressIndicator(
                progress = { progressFraction.coerceIn(0f, 1f) },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(2.5.dp)
                    .align(Alignment.BottomCenter),
                color = colors.primaryAccent,
                trackColor = Color.Transparent
            )
        }
    }
}

/**
 * CyberLoadingPlaceholder: Loading spinner with cyberpunk theme.
 */
@Composable
fun CyberLoadingPlaceholder(
    modifier: Modifier = Modifier,
    label: String = "Loading CyberPulse data..."
) {
    val colors = LocalCyberPulseColors.current
    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(CyberSpacing.xxl),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalAlignment = Alignment.CenterVertically
    ) {
        CircularProgressIndicator(
            color = colors.primaryAccent,
            modifier = Modifier.size(36.dp)
        )
        Spacer(modifier = Modifier.height(CyberSpacing.md))
        Text(
            text = label,
            style = MaterialTheme.typography.bodyMedium,
            color = colors.textSecondary
        )
    }
}

/**
 * CyberEmptyState: Clean empty state screen component.
 */
@Composable
fun CyberEmptyState(
    title: String,
    description: String,
    modifier: Modifier = Modifier,
    actionButtonText: String? = null,
    onActionClick: (() -> Unit)? = null
) {
    val colors = LocalCyberPulseColors.current
    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(CyberSpacing.xxl),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = Icons.Default.GraphicEq,
            contentDescription = null,
            tint = colors.textMuted,
            modifier = Modifier.size(48.dp)
        )
        Spacer(modifier = Modifier.height(CyberSpacing.md))
        Text(
            text = title,
            style = MaterialTheme.typography.titleLarge,
            color = colors.textPrimary,
            textAlign = TextAlign.Center
        )
        Spacer(modifier = Modifier.height(CyberSpacing.xs))
        Text(
            text = description,
            style = MaterialTheme.typography.bodyMedium,
            color = colors.textSecondary,
            textAlign = TextAlign.Center
        )
        if (actionButtonText != null && onActionClick != null) {
            Spacer(modifier = Modifier.height(CyberSpacing.lg))
            CyberPrimaryButton(
                text = actionButtonText,
                onClick = onActionClick,
                modifier = Modifier.width(200.dp)
            )
        }
    }
}
