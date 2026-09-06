package com.daddyizz.cyberpulse.core.billing

/**
 * Normalized purchase transaction status from Google Play or backend verification.
 */
enum class PurchaseStatus {
    UNSPECIFIED,
    PURCHASED,
    PENDING,
    ACKNOWLEDGED,
    EXPIRED,
    CANCELLED,
    REFUNDED
}

/**
 * Domain representation of a tracked subscription purchase.
 */
data class CyberPurchase(
    val orderId: String?,
    val packageName: String,
    val productId: String,
    val purchaseTime: Long,
    val purchaseState: PurchaseStatus,
    val purchaseToken: String,
    val isAcknowledged: Boolean,
    val isAutoRenewing: Boolean = true
)
