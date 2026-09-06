package com.daddyizz.cyberpulse.feature.pro

import android.app.Activity
import android.content.Intent
import android.net.Uri
import androidx.compose.animation.AnimatedVisibility
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
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.daddyizz.cyberpulse.CyberPulseApplication
import com.daddyizz.cyberpulse.core.billing.CyberPulsePlan
import com.daddyizz.cyberpulse.core.billing.ProductCatalog
import com.daddyizz.cyberpulse.core.billing.ProEntitlement
import com.daddyizz.cyberpulse.core.billing.RestoreResult
import com.daddyizz.cyberpulse.core.billing.SubscriptionStatus
import com.daddyizz.cyberpulse.core.designsystem.*
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CyberPulseProScreen(
    onBackClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val activity = context as? Activity
    val colors = LocalCyberPulseColors.current
    val coroutineScope = rememberCoroutineScope()
    val snackbarHostState = remember { SnackbarHostState() }

    val app = remember { CyberPulseApplication.instance }
    val billingManager = remember { app.billingManager }
    val entitlementRepo = remember { app.entitlementRepository }
    val entitlement by entitlementRepo.entitlement.collectAsState()
    val isPro by entitlementRepo.isPro.collectAsState()
    val isPending by entitlementRepo.isPending.collectAsState()

    val productDetailsMap by billingManager.productDetailsMap.collectAsState()

    // Build real dynamic plans from Google Play product details
    val plans = remember(productDetailsMap) {
        val monthlyDetails = productDetailsMap[SubscriptionStatus.PRODUCT_ID_PRO_MONTHLY]
        val yearlyDetails = productDetailsMap[SubscriptionStatus.PRODUCT_ID_PRO_YEARLY]

        if (monthlyDetails != null && yearlyDetails != null) {
            listOf(
                ProductCatalog.fromProductDetails(monthlyDetails),
                ProductCatalog.fromProductDetails(yearlyDetails)
            )
        } else {
            ProductCatalog.DEFAULT_PLANS
        }
    }

    var selectedPlanId by remember { mutableStateOf(SubscriptionStatus.PRODUCT_ID_PRO_YEARLY) }
    val activePlan = plans.firstOrNull { it.productId == selectedPlanId } ?: plans.first()

    var isRestoring by remember { mutableStateOf(false) }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        topBar = {
            TopAppBar(
                title = { },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(
                            imageVector = Icons.Default.Close,
                            contentDescription = "Close",
                            tint = colors.textPrimary
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color.Transparent
                )
            )
        },
        containerColor = colors.background,
        modifier = modifier.fillMaxSize()
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(horizontal = CyberSpacing.screenHorizontal),
            contentPadding = PaddingValues(bottom = 40.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Header Section
            item {
                Spacer(modifier = Modifier.height(8.dp))
                Box(
                    modifier = Modifier
                        .size(72.dp)
                        .clip(CircleShape)
                        .background(
                            Brush.linearGradient(
                                listOf(colors.primaryAccent, colors.secondaryAccent, colors.tertiaryAccent)
                            )
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Bolt,
                        contentDescription = null,
                        tint = Color.Black,
                        modifier = Modifier.size(42.dp)
                    )
                }

                Spacer(modifier = Modifier.height(CyberSpacing.md))

                Text(
                    text = "CyberPulse Pro",
                    style = MaterialTheme.typography.headlineLarge,
                    color = colors.textPrimary,
                    fontWeight = FontWeight.Bold,
                    textAlign = TextAlign.Center
                )

                Spacer(modifier = Modifier.height(CyberSpacing.xs))

                Text(
                    text = "Take your universe further.",
                    style = MaterialTheme.typography.titleMedium,
                    color = colors.primaryAccent,
                    textAlign = TextAlign.Center
                )

                Spacer(modifier = Modifier.height(CyberSpacing.lg))
            }

            // If already Pro
            if (isPro) {
                item {
                    CyberCard(
                        modifier = Modifier
                            .fillMaxWidth()
                            .border(1.dp, colors.successAccent, RoundedCornerShape(CyberRadius.md))
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Icon(
                                Icons.Default.CheckCircle,
                                contentDescription = null,
                                tint = colors.successAccent,
                                modifier = Modifier.size(32.dp)
                            )
                            Column {
                                Text(
                                    text = "Your CyberPulse Pro membership is active",
                                    color = colors.textPrimary,
                                    fontWeight = FontWeight.Bold,
                                    style = MaterialTheme.typography.titleMedium
                                )
                                Text(
                                    text = "All CyberPulse AdMob ads removed • Synthwave Pro unlocked",
                                    color = colors.textSecondary,
                                    style = MaterialTheme.typography.bodySmall
                                )
                            }
                        }
                    }
                    Spacer(modifier = Modifier.height(CyberSpacing.lg))
                }
            } else if (isPending) {
                item {
                    CyberCard(
                        modifier = Modifier
                            .fillMaxWidth()
                            .border(1.dp, colors.secondaryAccent, RoundedCornerShape(CyberRadius.md))
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(28.dp),
                                color = colors.secondaryAccent,
                                strokeWidth = 2.dp
                            )
                            Column {
                                Text(
                                    text = "Purchase Pending",
                                    color = colors.textPrimary,
                                    fontWeight = FontWeight.Bold,
                                    style = MaterialTheme.typography.titleMedium
                                )
                                Text(
                                    text = "Waiting for Google Play payment confirmation...",
                                    color = colors.textSecondary,
                                    style = MaterialTheme.typography.bodySmall
                                )
                            }
                        }
                    }
                    Spacer(modifier = Modifier.height(CyberSpacing.lg))
                }
            }

            // Plan Selector (Monthly vs Yearly)
            if (!isPro) {
                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(CyberSpacing.md)
                    ) {
                        plans.forEach { plan ->
                            val isSelected = plan.productId == selectedPlanId
                            Surface(
                                modifier = Modifier
                                    .weight(1f)
                                    .clip(RoundedCornerShape(CyberRadius.md))
                                    .clickable { selectedPlanId = plan.productId }
                                    .border(
                                        width = if (isSelected) 2.dp else 1.dp,
                                        color = if (isSelected) colors.primaryAccent else colors.border,
                                        shape = RoundedCornerShape(CyberRadius.md)
                                    ),
                                color = if (isSelected) colors.surfaceElevated else colors.surface
                            ) {
                                Column(
                                    modifier = Modifier.padding(14.dp),
                                    horizontalAlignment = Alignment.Start
                                ) {
                                    if (plan.formattedSavings != null) {
                                        Surface(
                                            color = colors.primaryAccent.copy(alpha = 0.2f),
                                            shape = RoundedCornerShape(CyberRadius.xs)
                                        ) {
                                            Text(
                                                text = plan.formattedSavings,
                                                color = colors.primaryAccent,
                                                fontSize = 10.sp,
                                                fontWeight = FontWeight.Bold,
                                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                            )
                                        }
                                        Spacer(modifier = Modifier.height(6.dp))
                                    } else {
                                        Spacer(modifier = Modifier.height(18.dp))
                                    }

                                    Text(
                                        text = if (plan.productId == SubscriptionStatus.PRODUCT_ID_PRO_YEARLY) "Yearly" else "Monthly",
                                        style = MaterialTheme.typography.titleMedium,
                                        color = colors.textPrimary,
                                        fontWeight = FontWeight.Bold
                                    )

                                    Spacer(modifier = Modifier.height(4.dp))

                                    Text(
                                        text = "${plan.localizedPrice} ${plan.billingPeriod}",
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = if (isSelected) colors.primaryAccent else colors.textSecondary,
                                        fontWeight = FontWeight.SemiBold
                                    )
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(CyberSpacing.lg))

                    // Purchase Action Button
                    CyberButton(
                        text = "Start CyberPulse Pro",
                        onClick = {
                            if (activity != null && activePlan.productDetails != null) {
                                billingManager.launchPurchaseFlow(
                                    activity = activity,
                                    productDetails = activePlan.productDetails,
                                    offerToken = activePlan.offerToken
                                )
                            } else {
                                coroutineScope.launch {
                                    snackbarHostState.showSnackbar("Connecting to Google Play Store...")
                                }
                            }
                        },
                        modifier = Modifier.fillMaxWidth()
                    )

                    Spacer(modifier = Modifier.height(6.dp))

                    Text(
                        text = "Auto-renews at ${activePlan.localizedPrice} ${activePlan.billingPeriod}. Cancel anytime in Google Play.",
                        style = MaterialTheme.typography.bodySmall,
                        color = colors.textMuted,
                        textAlign = TextAlign.Center
                    )

                    Spacer(modifier = Modifier.height(CyberSpacing.xl))
                }
            }

            // Free vs Pro Feature Matrix
            item {
                Text(
                    text = "Tier Comparison",
                    style = MaterialTheme.typography.titleLarge,
                    color = colors.textPrimary,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(CyberSpacing.md))

                CyberCard(modifier = Modifier.fillMaxWidth()) {
                    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                        FeatureComparisonRow(
                            feature = "Local Device Audio & Radio",
                            freeText = "Included",
                            proText = "Included",
                            isProHighlight = false
                        )
                        HorizontalDivider(color = colors.border.copy(alpha = 0.5f), thickness = 0.5.dp)
                        FeatureComparisonRow(
                            feature = "Android Auto Integration",
                            freeText = "Included (No ads)",
                            proText = "Included (No ads)",
                            isProHighlight = false
                        )
                        HorizontalDivider(color = colors.border.copy(alpha = 0.5f), thickness = 0.5.dp)
                        FeatureComparisonRow(
                            feature = "CyberPulse AdMob Ads",
                            freeText = "Phone visual ads",
                            proText = "Zero CyberPulse ads",
                            isProHighlight = true
                        )
                        HorizontalDivider(color = colors.border.copy(alpha = 0.5f), thickness = 0.5.dp)
                        FeatureComparisonRow(
                            feature = "Themes & Appearance",
                            freeText = "Cyberpunk & OLED",
                            proText = "Synthwave Pro + all themes",
                            isProHighlight = true
                        )
                        HorizontalDivider(color = colors.border.copy(alpha = 0.5f), thickness = 0.5.dp)
                        FeatureComparisonRow(
                            feature = "Future AI & DJ Engine",
                            freeText = "Standard limits",
                            proText = "Priority expanded limits",
                            isProHighlight = true
                        )
                    }
                }

                Spacer(modifier = Modifier.height(CyberSpacing.lg))

                // Important Legal / YouTube ad disclosure
                Surface(
                    color = colors.surfaceElevated.copy(alpha = 0.5f),
                    shape = RoundedCornerShape(CyberRadius.sm),
                    border = androidx.compose.foundation.BorderStroke(0.5.dp, colors.border)
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        verticalAlignment = Alignment.Top,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Icon(
                            Icons.Default.Info,
                            contentDescription = null,
                            tint = colors.textMuted,
                            modifier = Modifier.size(18.dp)
                        )
                        Text(
                            text = "CyberPulse Pro removes advertisements controlled directly by CyberPulse. Third-party content (such as embedded YouTube video playback) retains its own licensing and standard provider stream behaviors.",
                            style = MaterialTheme.typography.bodySmall,
                            color = colors.textMuted,
                            lineHeight = 16.sp
                        )
                    }
                }

                Spacer(modifier = Modifier.height(CyberSpacing.xl))

                // Management & Recovery Buttons
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceEvenly
                ) {
                    TextButton(
                        onClick = {
                            if (!isRestoring) {
                                isRestoring = true
                                coroutineScope.launch {
                                    val result = entitlementRepo.restorePurchases()
                                    isRestoring = false
                                    val message = when (result) {
                                        is RestoreResult.Restored -> "Purchases restored! CyberPulse Pro is active."
                                        is RestoreResult.NoPurchasesFound -> "No active CyberPulse Pro purchase found."
                                        is RestoreResult.Error -> "Restore failed: ${result.message}"
                                    }
                                    snackbarHostState.showSnackbar(message)
                                }
                            }
                        }
                    ) {
                        Text("Restore Purchases", color = colors.primaryAccent)
                    }

                    TextButton(
                        onClick = {
                            // Open official Google Play Subscriptions management sheet
                            try {
                                val intent = Intent(
                                    Intent.ACTION_VIEW,
                                    Uri.parse("https://play.google.com/store/account/subscriptions")
                                )
                                context.startActivity(intent)
                            } catch (e: Exception) {
                                coroutineScope.launch {
                                    snackbarHostState.showSnackbar("Please open Google Play Store > Subscriptions")
                                }
                            }
                        }
                    ) {
                        Text("Manage Subscription", color = colors.primaryAccent)
                    }
                }

                Spacer(modifier = Modifier.height(CyberSpacing.sm))

                // Terms of Service & Privacy Policy links
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Terms of Service",
                        style = MaterialTheme.typography.labelMedium,
                        color = colors.textMuted,
                        modifier = Modifier.clickable {
                            try {
                                context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("https://cyberpulse.app/terms")))
                            } catch (e: Exception) {}
                        }
                    )
                    Text(
                        text = " • ",
                        color = colors.textMuted,
                        modifier = Modifier.padding(horizontal = 6.dp)
                    )
                    Text(
                        text = "Privacy Policy",
                        style = MaterialTheme.typography.labelMedium,
                        color = colors.textMuted,
                        modifier = Modifier.clickable {
                            try {
                                context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("https://cyberpulse.app/privacy")))
                            } catch (e: Exception) {}
                        }
                    )
                }
            }
        }
    }
}

@Composable
private fun FeatureComparisonRow(
    feature: String,
    freeText: String,
    proText: String,
    isProHighlight: Boolean
) {
    val colors = LocalCyberPulseColors.current

    Column(modifier = Modifier.fillMaxWidth()) {
        Text(
            text = feature,
            color = colors.textPrimary,
            fontWeight = FontWeight.SemiBold,
            style = MaterialTheme.typography.bodyMedium
        )
        Spacer(modifier = Modifier.height(4.dp))
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(
                text = "Free: $freeText",
                color = colors.textSecondary,
                style = MaterialTheme.typography.bodySmall
            )
            Text(
                text = "Pro: $proText",
                color = if (isProHighlight) colors.primaryAccent else colors.textPrimary,
                fontWeight = if (isProHighlight) FontWeight.Bold else FontWeight.Normal,
                style = MaterialTheme.typography.bodySmall
            )
        }
    }
}
