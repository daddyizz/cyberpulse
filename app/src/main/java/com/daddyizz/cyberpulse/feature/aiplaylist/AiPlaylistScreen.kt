package com.daddyizz.cyberpulse.feature.aiplaylist

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.daddyizz.cyberpulse.core.model.Track
import com.daddyizz.cyberpulse.core.recommendation.PlaylistResolutionMode
import com.daddyizz.cyberpulse.core.recommendation.ResolvedPlaylist
import com.daddyizz.cyberpulse.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AiPlaylistScreen(
    onNavigateBack: () -> Unit,
    onNavigateToPro: () -> Unit,
    modifier: Modifier = Modifier,
    viewModel: AiPlaylistViewModel = viewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val promptText by viewModel.prompt.collectAsState()
    val targetDuration by viewModel.targetDurationMinutes.collectAsState()
    val resolutionMode by viewModel.resolutionMode.collectAsState()
    val remainingQuota by viewModel.generationsRemaining.collectAsState()
    val isPro by viewModel.isPro.collectAsState()
    val isSaved by viewModel.isSaved.collectAsState()
    val recentPlaylists by viewModel.recentGeneratedPlaylists.collectAsState()

    var showRefineDialog by remember { mutableStateOf(false) }

    Scaffold(
        modifier = modifier.fillMaxSize(),
        containerColor = BackgroundDark,
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "AI Playlist Generator",
                        color = TextPrimary,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Back",
                            tint = TextPrimary
                        )
                    }
                },
                actions = {
                    if (isPro) {
                        Surface(
                            color = NeonAmber.copy(alpha = 0.2f),
                            shape = RoundedCornerShape(12.dp),
                            border = androidx.compose.foundation.BorderStroke(1.dp, NeonAmber),
                            modifier = Modifier.padding(end = 12.dp)
                        ) {
                            Text(
                                text = "PRO UNLIMITED",
                                color = NeonAmber,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                            )
                        }
                    } else {
                        Surface(
                            color = SurfaceVariantDark,
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier
                                .padding(end = 12.dp)
                                .clickable { onNavigateToPro() }
                        ) {
                            Text(
                                text = "$remainingQuota Free Left",
                                color = NeonCyan,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.SemiBold,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                            )
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = BackgroundDark)
            )
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            when (val state = uiState) {
                is AiPlaylistUiState.Idle -> {
                    AiPlaylistInputContent(
                        prompt = promptText,
                        onPromptChange = viewModel::updatePrompt,
                        targetDuration = targetDuration,
                        onSelectDuration = viewModel::selectDuration,
                        resolutionMode = resolutionMode,
                        onSelectResolutionMode = viewModel::setResolutionMode,
                        onGenerate = { viewModel.generatePlaylist() },
                        recentPlaylists = recentPlaylists,
                        onSelectRecent = viewModel::loadExistingPlaylist
                    )
                }
                is AiPlaylistUiState.Generating -> {
                    AiPlaylistGeneratingContent(prompt = state.prompt)
                }
                is AiPlaylistUiState.Success -> {
                    AiPlaylistResultContent(
                        playlist = state.resolvedPlaylist,
                        isSaved = isSaved,
                        onPlay = { viewModel.playPlaylist(state.resolvedPlaylist, shuffle = false) },
                        onShuffle = { viewModel.playPlaylist(state.resolvedPlaylist, shuffle = true) },
                        onSave = { viewModel.savePlaylist(state.resolvedPlaylist) },
                        onRefine = { showRefineDialog = true },
                        onNewPrompt = viewModel::resetToInput,
                        onTrackClick = { track -> viewModel.playTrack(track, state.resolvedPlaylist) }
                    )
                }
                is AiPlaylistUiState.Error -> {
                    AiPlaylistErrorContent(
                        error = state.message,
                        onFallbackLocal = { viewModel.generateSmartLocalMix(promptText) },
                        onRetry = { viewModel.generatePlaylist() },
                        onBackToInput = viewModel::resetToInput
                    )
                }
            }

            if (showRefineDialog) {
                RefinePlaylistDialog(
                    onDismiss = { showRefineDialog = false },
                    onRefine = { instruction ->
                        viewModel.refinePlaylist(instruction)
                        showRefineDialog = false
                    }
                )
            }
        }
    }
}

@Composable
private fun AiPlaylistInputContent(
    prompt: String,
    onPromptChange: (String) -> Unit,
    targetDuration: Int,
    onSelectDuration: (Int) -> Unit,
    resolutionMode: PlaylistResolutionMode,
    onSelectResolutionMode: (PlaylistResolutionMode) -> Unit,
    onGenerate: () -> Unit,
    recentPlaylists: List<ResolvedPlaylist>,
    onSelectRecent: (ResolvedPlaylist) -> Unit
) {
    val focusManager = LocalFocusManager.current
    val inspirationChips = listOf(
        "Night Drive with heavy synthwave",
        "Cyber Surge high-BPM workout",
        "Deep focus electronic ambient",
        "Neon Chill lo-fi rain textures",
        "80s Retro nostalgia outrun",
        "Party banger peak energy",
        "Nusantara Cyber Malay hits",
        "Late night cyberpunk drift"
    )

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
        contentPadding = PaddingValues(vertical = 16.dp)
    ) {
        item {
            Text(
                text = "Describe your desired vibe",
                color = TextPrimary,
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = "AI translates your prompt into real, playable tracks from your local music, radio, and catalogs.",
                color = TextSecondary,
                fontSize = 13.sp,
                modifier = Modifier.padding(top = 4.dp)
            )
        }

        item {
            OutlinedTextField(
                value = prompt,
                onValueChange = onPromptChange,
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(min = 100.dp),
                placeholder = {
                    Text(
                        text = "e.g. Rainy midnight drive through Tokyo with warm synthwave basslines and calm tempo...",
                        color = TextSecondary.copy(alpha = 0.6f),
                        fontSize = 14.sp
                    )
                },
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = NeonCyan,
                    unfocusedBorderColor = SurfaceVariantDark,
                    focusedTextColor = TextPrimary,
                    unfocusedTextColor = TextPrimary,
                    cursorColor = NeonCyan
                ),
                shape = RoundedCornerShape(12.dp),
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done),
                keyboardActions = KeyboardActions(onDone = { focusManager.clearFocus() })
            )
        }

        item {
            Text(
                text = "Quick Inspiration",
                color = TextPrimary,
                fontSize = 14.sp,
                fontWeight = FontWeight.SemiBold
            )
            Spacer(modifier = Modifier.height(8.dp))
            FlowRowChips(
                chips = inspirationChips,
                onSelectChip = { chip ->
                    onPromptChange(chip)
                }
            )
        }

        item {
            Text(
                text = "Session Duration",
                color = TextPrimary,
                fontSize = 14.sp,
                fontWeight = FontWeight.SemiBold
            )
            Spacer(modifier = Modifier.height(8.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                listOf(15, 30, 45, 60, 90).forEach { mins ->
                    val isSelected = targetDuration == mins
                    FilterChip(
                        selected = isSelected,
                        onClick = { onSelectDuration(mins) },
                        label = { Text("$mins min") },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = NeonCyan.copy(alpha = 0.2f),
                            selectedLabelColor = NeonCyan,
                            containerColor = SurfaceVariantDark,
                            labelColor = TextSecondary
                        ),
                        border = if (isSelected) androidx.compose.foundation.BorderStroke(1.dp, NeonCyan) else null
                    )
                }
            }
        }

        item {
            Text(
                text = "Playback Mode",
                color = TextPrimary,
                fontSize = 14.sp,
                fontWeight = FontWeight.SemiBold
            )
            Spacer(modifier = Modifier.height(8.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                FilterChip(
                    selected = resolutionMode == PlaylistResolutionMode.PLAYABLE_NOW,
                    onClick = { onSelectResolutionMode(PlaylistResolutionMode.PLAYABLE_NOW) },
                    label = { Text("Playable Now (Media3 Direct)") },
                    leadingIcon = {
                        Icon(
                            imageVector = Icons.Default.PlayArrow,
                            contentDescription = null,
                            modifier = Modifier.size(16.dp)
                        )
                    },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = NeonPurple.copy(alpha = 0.2f),
                        selectedLabelColor = NeonPurple,
                        containerColor = SurfaceVariantDark,
                        labelColor = TextSecondary
                    ),
                    border = if (resolutionMode == PlaylistResolutionMode.PLAYABLE_NOW) androidx.compose.foundation.BorderStroke(1.dp, NeonPurple) else null
                )

                FilterChip(
                    selected = resolutionMode == PlaylistResolutionMode.DISCOVERY,
                    onClick = { onSelectResolutionMode(PlaylistResolutionMode.DISCOVERY) },
                    label = { Text("Discovery Mix") },
                    leadingIcon = {
                        Icon(
                            imageVector = Icons.Default.Explore,
                            contentDescription = null,
                            modifier = Modifier.size(16.dp)
                        )
                    },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = NeonCyan.copy(alpha = 0.2f),
                        selectedLabelColor = NeonCyan,
                        containerColor = SurfaceVariantDark,
                        labelColor = TextSecondary
                    ),
                    border = if (resolutionMode == PlaylistResolutionMode.DISCOVERY) androidx.compose.foundation.BorderStroke(1.dp, NeonCyan) else null
                )
            }
        }

        item {
            Spacer(modifier = Modifier.height(8.dp))
            Button(
                onClick = onGenerate,
                enabled = prompt.isNotBlank(),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = NeonCyan,
                    contentColor = BackgroundDark,
                    disabledContainerColor = SurfaceVariantDark,
                    disabledContentColor = TextSecondary
                )
            ) {
                Icon(imageVector = Icons.Default.AutoAwesome, contentDescription = null)
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "Synthesize Playlist",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }

        if (recentPlaylists.isNotEmpty()) {
            item {
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = "Recent AI Playlists",
                    color = TextPrimary,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.SemiBold
                )
            }
            items(recentPlaylists) { pl ->
                Surface(
                    color = SurfaceDark,
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onSelectRecent(pl) }
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(40.dp)
                                .clip(RoundedCornerShape(6.dp))
                                .background(NeonPurple.copy(alpha = 0.3f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(imageVector = Icons.Default.GraphicEq, contentDescription = null, tint = NeonPurple)
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = pl.title,
                                color = TextPrimary,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.SemiBold,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                            Text(
                                text = "${pl.tracks.size} tracks • ${pl.formattedDuration}",
                                color = TextSecondary,
                                fontSize = 12.sp
                            )
                        }
                        Icon(imageVector = Icons.Default.ChevronRight, contentDescription = null, tint = TextSecondary)
                    }
                }
            }
        }
    }
}

@Composable
private fun FlowRowChips(
    chips: List<String>,
    onSelectChip: (String) -> Unit
) {
    LazyRow(
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        items(chips) { chip ->
            Surface(
                color = SurfaceVariantDark,
                shape = RoundedCornerShape(16.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceVariantDark.copy(alpha = 0.8f)),
                modifier = Modifier.clickable { onSelectChip(chip) }
            ) {
                Text(
                    text = chip,
                    color = TextPrimary,
                    fontSize = 12.sp,
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                )
            }
        }
    }
}

@Composable
private fun AiPlaylistGeneratingContent(prompt: String) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        CircularProgressIndicator(
            color = NeonCyan,
            modifier = Modifier.size(56.dp),
            strokeWidth = 4.dp
        )
        Spacer(modifier = Modifier.height(24.dp))
        Text(
            text = "Synthesizing Pulse Flow...",
            color = TextPrimary,
            fontSize = 18.sp,
            fontWeight = FontWeight.Bold
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = "\"$prompt\"",
            color = NeonCyan,
            fontSize = 14.sp,
            maxLines = 2,
            overflow = TextOverflow.Ellipsis
        )
        Spacer(modifier = Modifier.height(12.dp))
        Text(
            text = "Extracting mood intent • Resolving real playable sources • Optimizing BPM arc",
            color = TextSecondary,
            fontSize = 12.sp
        )
    }
}

@Composable
private fun AiPlaylistResultContent(
    playlist: ResolvedPlaylist,
    isSaved: Boolean,
    onPlay: () -> Unit,
    onShuffle: () -> Unit,
    onSave: () -> Unit,
    onRefine: () -> Unit,
    onNewPrompt: () -> Unit,
    onTrackClick: (Track) -> Unit
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(bottom = 32.dp)
    ) {
        item {
            // Neon Hero Header Card
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(
                        Brush.verticalGradient(
                            listOf(NeonPurple.copy(alpha = 0.35f), BackgroundDark)
                        )
                    )
                    .padding(20.dp)
            ) {
                Column {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Surface(
                            color = NeonCyan.copy(alpha = 0.2f),
                            shape = RoundedCornerShape(8.dp),
                            border = androidx.compose.foundation.BorderStroke(1.dp, NeonCyan)
                        ) {
                            Text(
                                text = "AI CURATED PULSE",
                                color = NeonCyan,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                            )
                        }
                        TextButton(onClick = onNewPrompt) {
                            Icon(imageVector = Icons.Default.Edit, contentDescription = null, tint = TextSecondary, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(text = "New Prompt", color = TextSecondary, fontSize = 12.sp)
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = playlist.title,
                        color = TextPrimary,
                        fontSize = 22.sp,
                        fontWeight = FontWeight.Bold
                    )
                    if (!playlist.description.isNullOrBlank()) {
                        Text(
                            text = playlist.description,
                            color = TextSecondary,
                            fontSize = 13.sp,
                            modifier = Modifier.padding(top = 4.dp)
                        )
                    }

                    Spacer(modifier = Modifier.height(12.dp))
                    // Composition Badges
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "${playlist.tracks.size} tracks • ${playlist.formattedDuration}",
                            color = TextPrimary,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                        if (playlist.sourceComposition.localCount > 0) {
                            Surface(color = SurfaceVariantDark, shape = CircleShape) {
                                Text(
                                    text = "${playlist.sourceComposition.localCount} Local",
                                    color = NeonAmber,
                                    fontSize = 10.sp,
                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                )
                            }
                        }
                        if (playlist.sourceComposition.radioCount > 0) {
                            Surface(color = SurfaceVariantDark, shape = CircleShape) {
                                Text(
                                    text = "${playlist.sourceComposition.radioCount} Radio",
                                    color = NeonPurple,
                                    fontSize = 10.sp,
                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))
                    // Action Buttons Row
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Button(
                            onClick = onPlay,
                            colors = ButtonDefaults.buttonColors(containerColor = NeonCyan, contentColor = BackgroundDark),
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier.weight(1f)
                        ) {
                            Icon(imageVector = Icons.Default.PlayArrow, contentDescription = null)
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Play", fontWeight = FontWeight.Bold)
                        }

                        Button(
                            onClick = onShuffle,
                            colors = ButtonDefaults.buttonColors(containerColor = SurfaceVariantDark, contentColor = TextPrimary),
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier.weight(1f)
                        ) {
                            Icon(imageVector = Icons.Default.Shuffle, contentDescription = null)
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Shuffle")
                        }

                        IconButton(
                            onClick = onSave,
                            modifier = Modifier
                                .background(if (isSaved) NeonPurple.copy(alpha = 0.2f) else SurfaceVariantDark, RoundedCornerShape(10.dp))
                        ) {
                            Icon(
                                imageVector = if (isSaved) Icons.Default.Check else Icons.Default.BookmarkBorder,
                                contentDescription = "Save Playlist",
                                tint = if (isSaved) NeonPurple else TextPrimary
                            )
                        }

                        IconButton(
                            onClick = onRefine,
                            modifier = Modifier.background(SurfaceVariantDark, RoundedCornerShape(10.dp))
                        ) {
                            Icon(
                                imageVector = Icons.Default.Tune,
                                contentDescription = "Refine Mix",
                                tint = TextPrimary
                            )
                        }
                    }
                }
            }
        }

        item {
            Text(
                text = "Tracks in Queue",
                color = TextPrimary,
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp)
            )
        }

        items(playlist.tracks) { track ->
            TrackRowItem(
                track = track,
                onClick = { onTrackClick(track) }
            )
        }
    }
}

@Composable
private fun TrackRowItem(
    track: Track,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(horizontal = 16.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(44.dp)
                .clip(RoundedCornerShape(8.dp))
                .background(SurfaceVariantDark),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Default.MusicNote,
                contentDescription = null,
                tint = NeonCyan
            )
        }

        Spacer(modifier = Modifier.width(12.dp))

        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = track.title,
                color = TextPrimary,
                fontSize = 14.sp,
                fontWeight = FontWeight.SemiBold,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            Text(
                text = track.artist,
                color = TextSecondary,
                fontSize = 12.sp,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }

        Spacer(modifier = Modifier.width(8.dp))

        Text(
            text = track.formattedDuration,
            color = TextSecondary,
            fontSize = 12.sp
        )
    }
}

@Composable
private fun AiPlaylistErrorContent(
    error: String,
    onFallbackLocal: () -> Unit,
    onRetry: () -> Unit,
    onBackToInput: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(
            imageVector = Icons.Default.CloudOff,
            contentDescription = null,
            tint = NeonAmber,
            modifier = Modifier.size(56.dp)
        )
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            text = "AI Service Notice",
            color = TextPrimary,
            fontSize = 18.sp,
            fontWeight = FontWeight.Bold
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = error,
            color = TextSecondary,
            fontSize = 13.sp,
            textAlign = androidx.compose.ui.text.style.TextAlign.Center
        )
        Spacer(modifier = Modifier.height(24.dp))

        Button(
            onClick = onFallbackLocal,
            colors = ButtonDefaults.buttonColors(containerColor = NeonPurple),
            shape = RoundedCornerShape(10.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Icon(imageVector = Icons.Default.Bolt, contentDescription = null)
            Spacer(modifier = Modifier.width(8.dp))
            Text("Generate Smart Local Mix", fontWeight = FontWeight.Bold)
        }

        Spacer(modifier = Modifier.height(8.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            OutlinedButton(
                onClick = onRetry,
                colors = ButtonDefaults.outlinedButtonColors(contentColor = TextPrimary),
                modifier = Modifier.weight(1f)
            ) {
                Text("Retry")
            }
            OutlinedButton(
                onClick = onBackToInput,
                colors = ButtonDefaults.outlinedButtonColors(contentColor = TextSecondary),
                modifier = Modifier.weight(1f)
            ) {
                Text("Edit Prompt")
            }
        }
    }
}

@Composable
private fun RefinePlaylistDialog(
    onDismiss: () -> Unit,
    onRefine: (String) -> Unit
) {
    var customText by remember { mutableStateOf("") }
    val quickRefinements = listOf(
        "More energetic",
        "Chill it down",
        "Less rock",
        "More synthwave",
        "More Malay songs",
        "Deep night vibe"
    )

    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = SurfaceDark,
        title = {
            Text("Refine Playlist", color = TextPrimary, fontWeight = FontWeight.Bold, fontSize = 18.sp)
        },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text("Select a quick tuning instruction or type your own:", color = TextSecondary, fontSize = 13.sp)
                FlowRowChips(
                    chips = quickRefinements,
                    onSelectChip = { onRefine(it) }
                )
                OutlinedTextField(
                    value = customText,
                    onValueChange = { customText = it },
                    placeholder = { Text("e.g. Higher tempo and deeper bass...", color = TextSecondary) },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = NeonCyan,
                        unfocusedBorderColor = SurfaceVariantDark,
                        focusedTextColor = TextPrimary,
                        unfocusedTextColor = TextPrimary
                    ),
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            Button(
                onClick = { if (customText.isNotBlank()) onRefine(customText) },
                enabled = customText.isNotBlank(),
                colors = ButtonDefaults.buttonColors(containerColor = NeonCyan, contentColor = BackgroundDark)
            ) {
                Text("Apply")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel", color = TextSecondary)
            }
        }
    )
}
