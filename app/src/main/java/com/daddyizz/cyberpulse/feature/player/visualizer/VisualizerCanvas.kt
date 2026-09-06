package com.daddyizz.cyberpulse.feature.player.visualizer

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Waves
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.*
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.daddyizz.cyberpulse.core.designsystem.*
import com.daddyizz.cyberpulse.core.visualizer.VisualizerMode
import com.daddyizz.cyberpulse.core.visualizer.VisualizerState
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.sin

@Composable
fun VisualizerView(
    state: VisualizerState,
    onSelectMode: (VisualizerMode) -> Unit,
    onUnlockPro: () -> Unit,
    modifier: Modifier = Modifier,
    primaryColor: Color = Color.Unspecified,
    secondaryColor: Color = Color.Unspecified
) {
    val colors = LocalCyberPulseColors.current
    val effectivePrimary = if (primaryColor != Color.Unspecified) primaryColor else colors.primaryAccent
    val effectiveSecondary = if (secondaryColor != Color.Unspecified) secondaryColor else colors.secondaryAccent

    Box(
        modifier = modifier
            .fillMaxSize()
            .clip(RoundedCornerShape(CyberRadius.lg))
            .background(colors.backgroundSecondary)
    ) {
        // Main Visualizer Drawing Canvas
        Canvas(
            modifier = Modifier.fillMaxSize()
        ) {
            when (state.mode) {
                VisualizerMode.NEON_WAVE -> drawNeonWave(state, effectivePrimary, effectiveSecondary)
                VisualizerMode.SPECTRUM_PULSE -> drawSpectrumPulse(state, effectivePrimary, effectiveSecondary)
                VisualizerMode.CYBER_GRID -> drawCyberGrid(state, effectivePrimary, effectiveSecondary)
                VisualizerMode.ORBITAL_PULSE -> drawOrbitalPulse(state, effectivePrimary, effectiveSecondary)
                VisualizerMode.PARTICLE_FLOW -> drawParticleFlow(state, effectivePrimary, effectiveSecondary)
            }
        }

        // Ambient Mode / Capture Restriction Badge
        if (!state.isRealAudioAvailable || state.captureDisabledReason != null) {
            Surface(
                modifier = Modifier
                    .align(Alignment.TopStart)
                    .padding(12.dp),
                shape = RoundedCornerShape(CyberRadius.sm),
                color = colors.surfaceCard.copy(alpha = 0.85f),
                border = androidx.compose.foundation.BorderStroke(1.dp, colors.border)
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(6.dp)
                            .clip(CircleShape)
                            .background(colors.secondaryAccent)
                    )
                    Text(
                        text = if (state.captureDisabledReason != null) "Ambient Mode (Protected)" else "Ambient Mode",
                        style = MaterialTheme.typography.labelSmall,
                        color = colors.textSecondary,
                        fontSize = 11.sp
                    )
                }
            }
        }

        // Pro Locked Overlay
        AnimatedVisibility(
            visible = state.isProLocked,
            enter = fadeIn(),
            exit = fadeOut(),
            modifier = Modifier.align(Alignment.Center)
        ) {
            Surface(
                modifier = Modifier
                    .fillMaxWidth(0.85f)
                    .clip(RoundedCornerShape(CyberRadius.md))
                    .border(1.dp, colors.primaryAccent.copy(alpha = 0.6f), RoundedCornerShape(CyberRadius.md)),
                color = colors.surfaceElevated.copy(alpha = 0.94f)
            ) {
                Column(
                    modifier = Modifier.padding(CyberSpacing.lg),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Lock,
                        contentDescription = "Pro Locked",
                        tint = colors.primaryAccent,
                        modifier = Modifier.size(32.dp)
                    )
                    Text(
                        text = "${state.mode.displayName} is a Pro Feature",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = colors.textPrimary
                    )
                    Text(
                        text = state.mode.description,
                        style = MaterialTheme.typography.bodySmall,
                        color = colors.textSecondary
                    )
                    Button(
                        onClick = onUnlockPro,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = colors.primaryAccent,
                            contentColor = Color.Black
                        ),
                        shape = RoundedCornerShape(CyberRadius.sm)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Bolt,
                            contentDescription = null,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "Unlock with CyberPulse Pro",
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }

        // Mode Selector Row (Bottom of Visualizer)
        Surface(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .fillMaxWidth()
                .padding(bottom = 8.dp),
            color = Color.Transparent
        ) {
            LazyRow(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(VisualizerMode.entries) { mode ->
                    val isSelected = state.mode == mode
                    val chipBg = if (isSelected) colors.primaryAccent.copy(alpha = 0.2f) else colors.surfaceCard.copy(alpha = 0.75f)
                    val borderColor = if (isSelected) colors.primaryAccent else colors.border

                    Surface(
                        modifier = Modifier
                            .clip(RoundedCornerShape(CyberRadius.sm))
                            .clickable { onSelectMode(mode) }
                            .border(1.dp, borderColor, RoundedCornerShape(CyberRadius.sm)),
                        color = chipBg
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            if (mode.isPro) {
                                Icon(
                                    imageVector = Icons.Default.Lock,
                                    contentDescription = "Pro",
                                    tint = if (isSelected) colors.primaryAccent else colors.textMuted,
                                    modifier = Modifier.size(12.dp)
                                )
                            }
                            Text(
                                text = mode.displayName,
                                style = MaterialTheme.typography.labelSmall,
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                                color = if (isSelected) colors.primaryAccent else colors.textSecondary
                            )
                        }
                    }
                }
            }
        }
    }
}

// 1. NEON WAVE RENDERER
private fun DrawScope.drawNeonWave(state: VisualizerState, primary: Color, secondary: Color) {
    val waveform = state.waveform
    if (waveform.isEmpty()) return

    val centerY = size.height * 0.5f
    val waveHeight = size.height * 0.35f
    val stepX = size.width / (waveform.size - 1).coerceAtLeast(1)

    val path = Path()
    val mirrorPath = Path()

    for (i in waveform.indices) {
        val x = i * stepX
        val yOffset = waveform[i] * waveHeight
        val y = centerY + yOffset
        val mirrorY = centerY - (yOffset * 0.6f)

        if (i == 0) {
            path.moveTo(x, y)
            mirrorPath.moveTo(x, mirrorY)
        } else {
            path.lineTo(x, y)
            mirrorPath.lineTo(x, mirrorY)
        }
    }

    // Outer glow
    drawPath(
        path = path,
        color = primary.copy(alpha = 0.3f),
        style = Stroke(width = 10f, cap = StrokeCap.Round, join = StrokeJoin.Round)
    )
    // Inner crisp beam
    drawPath(
        path = path,
        color = primary,
        style = Stroke(width = 3.5f, cap = StrokeCap.Round, join = StrokeJoin.Round)
    )

    // Mirror reflection wave
    drawPath(
        path = mirrorPath,
        color = secondary.copy(alpha = 0.4f),
        style = Stroke(width = 2f, cap = StrokeCap.Round)
    )
}

// 2. SPECTRUM PULSE RENDERER
private fun DrawScope.drawSpectrumPulse(state: VisualizerState, primary: Color, secondary: Color) {
    val bands = state.fftBands
    if (bands.isEmpty()) return

    val barCount = bands.size
    val totalSpacing = (barCount + 1) * 6f
    val barWidth = ((size.width - totalSpacing) / barCount).coerceAtLeast(4f)
    val maxBarHeight = size.height * 0.75f
    val baseY = size.height * 0.85f

    for (i in 0 until barCount) {
        val x = 6f + i * (barWidth + 6f)
        val magnitude = bands[i].coerceIn(0.04f, 1f)
        val barHeight = magnitude * maxBarHeight
        val topY = baseY - barHeight

        // Bar gradient
        drawRect(
            brush = Brush.verticalGradient(
                colors = listOf(primary, secondary),
                startY = topY,
                endY = baseY
            ),
            topLeft = Offset(x, topY),
            size = Size(barWidth, barHeight)
        )

        // Floating peak indicator cap
        drawRect(
            color = Color.White,
            topLeft = Offset(x, topY - 4f),
            size = Size(barWidth, 3f)
        )
    }
}

// 3. CYBER GRID RENDERER
private fun DrawScope.drawCyberGrid(state: VisualizerState, primary: Color, secondary: Color) {
    val horizonY = size.height * 0.4f
    val energy = state.energy.coerceIn(0f, 1f)

    // Glowing synthwave sun / core at horizon
    drawCircle(
        brush = Brush.radialGradient(
            colors = listOf(secondary.copy(alpha = 0.8f), primary.copy(alpha = 0.2f), Color.Transparent),
            center = Offset(size.width * 0.5f, horizonY),
            radius = size.width * (0.25f + energy * 0.1f)
        ),
        center = Offset(size.width * 0.5f, horizonY),
        radius = size.width * (0.25f + energy * 0.1f)
    )

    // Horizon line
    drawLine(
        color = primary,
        start = Offset(0f, horizonY),
        end = Offset(size.width, horizonY),
        strokeWidth = 2.5f
    )

    // Perspective perspective lines radiating from center horizon to bottom
    val perspectiveCount = 10
    val centerX = size.width * 0.5f
    for (i in 0..perspectiveCount) {
        val bottomX = (i.toFloat() / perspectiveCount) * size.width
        drawLine(
            color = primary.copy(alpha = 0.45f),
            start = Offset(centerX, horizonY),
            end = Offset(bottomX, size.height),
            strokeWidth = 1.5f
        )
    }

    // Horizontal grid rungs undulating to audio energy
    val rungCount = 7
    for (r in 1..rungCount) {
        val t = (r.toFloat() / rungCount) * (r.toFloat() / rungCount) // exponential perspective
        val rungY = horizonY + t * (size.height - horizonY)
        val displacement = sin(r.toDouble() * 1.5 + energy * 4.0).toFloat() * (energy * 12f)
        drawLine(
            color = secondary.copy(alpha = 0.4f + 0.5f * t),
            start = Offset(0f, rungY + displacement),
            end = Offset(size.width, rungY + displacement),
            strokeWidth = 1.5f + t * 2f
        )
    }
}

// 4. ORBITAL PULSE RENDERER
private fun DrawScope.drawOrbitalPulse(state: VisualizerState, primary: Color, secondary: Color) {
    val center = Offset(size.width * 0.5f, size.height * 0.5f)
    val baseRadius = (size.minDimension * 0.18f)
    val energy = state.energy.coerceIn(0f, 1f)

    // Core pulsing reactor
    drawCircle(
        brush = Brush.radialGradient(
            colors = listOf(primary, secondary.copy(alpha = 0.4f), Color.Transparent),
            center = center,
            radius = baseRadius * (1f + energy * 0.6f)
        ),
        center = center,
        radius = baseRadius * (1f + energy * 0.6f)
    )

    // 3 Concentric orbital rings
    val ringCount = 3
    for (r in 1..ringCount) {
        val radius = baseRadius * (1.6f * r) * (1f + energy * 0.15f * r)
        drawCircle(
            color = primary.copy(alpha = 0.35f / r),
            center = center,
            radius = radius,
            style = Stroke(width = 2f)
        )

        // Orbiting satellite nodes
        val angle = (energy * PI * 2 * r + r * 1.2).toFloat()
        val nodeX = center.x + radius * cos(angle)
        val nodeY = center.y + radius * sin(angle)
        drawCircle(
            color = secondary,
            center = Offset(nodeX, nodeY),
            radius = 4f + energy * 4f
        )
    }
}

// 5. PARTICLE FLOW RENDERER
private fun DrawScope.drawParticleFlow(state: VisualizerState, primary: Color, secondary: Color) {
    val energy = state.energy.coerceIn(0f, 1f)
    val particleCount = 28

    for (p in 0 until particleCount) {
        // Deterministic particle positions derived from index + energy
        val seed = p * 137.5f
        val relX = ((seed % 100) / 100f) * size.width
        val baseY = ((p * 37) % 100) / 100f * size.height
        val drift = (energy * 30f * sin(p.toDouble())).toFloat()
        val currentY = (baseY - drift + size.height) % size.height

        val particleRadius = 3f + (p % 4) * 1.5f + energy * 3f
        val color = if (p % 2 == 0) primary else secondary

        drawCircle(
            color = color.copy(alpha = 0.45f + energy * 0.45f),
            center = Offset(relX, currentY),
            radius = particleRadius
        )
    }
}
