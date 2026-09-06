package com.daddyizz.cyberpulse.core.recommendation

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.core.longPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.daddyizz.cyberpulse.core.billing.EntitlementRepository
import com.daddyizz.cyberpulse.core.billing.PremiumFeature
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import java.util.Calendar

private val Context.aiUsageDataStore by preferencesDataStore(name = "cyberpulse_ai_usage")

/**
 * Tracks daily AI feature usage and evaluates tier quotas against EntitlementRepository.
 *
 * Free Tier:
 * - 5 AI playlist generations per day (resets at midnight).
 * - Standard Cyber DJ modes: DRIVE, CHILL, WORKOUT, FOCUS.
 *
 * Pro Tier (CyberPulse Pro):
 * - Unlimited / expanded AI playlist generations.
 * - All Cyber DJ modes unlocked (PARTY, SLEEP, DISCOVER, THROWBACK).
 * - Deep tuning sliders (dynamic energy, discovery ratio).
 */
class AiUsageRepository(
    private val context: Context,
    private val entitlementRepository: EntitlementRepository
) {

    companion object {
        const val FREE_DAILY_GENERATIONS_LIMIT = 5
        private val KEY_LAST_USAGE_EPOCH = longPreferencesKey("last_ai_usage_epoch")
        private val KEY_GENERATIONS_TODAY = intPreferencesKey("generations_today")
    }

    val generationsRemainingFlow: Flow<Int> = context.aiUsageDataStore.data.map { prefs ->
        val isPro = entitlementRepository.canUse(PremiumFeature.AI_PLAYLIST_PLUS)
        if (isPro) return@map 999 // Unlimited for Pro

        val lastEpoch = prefs[KEY_LAST_USAGE_EPOCH] ?: 0L
        val count = if (isSameDay(lastEpoch, System.currentTimeMillis())) {
            prefs[KEY_GENERATIONS_TODAY] ?: 0
        } else {
            0
        }
        (FREE_DAILY_GENERATIONS_LIMIT - count).coerceAtLeast(0)
    }

    /**
     * Checks whether user can generate an AI playlist right now.
     */
    suspend fun canGenerateAiPlaylist(): Boolean {
        if (entitlementRepository.canUse(PremiumFeature.AI_PLAYLIST_PLUS)) {
            return true
        }
        val prefs = context.aiUsageDataStore.data.first()
        val lastEpoch = prefs[KEY_LAST_USAGE_EPOCH] ?: 0L
        val count = if (isSameDay(lastEpoch, System.currentTimeMillis())) {
            prefs[KEY_GENERATIONS_TODAY] ?: 0
        } else {
            0
        }
        return count < FREE_DAILY_GENERATIONS_LIMIT
    }

    /**
     * Records an AI playlist generation and updates daily count.
     */
    suspend fun recordGeneration() {
        context.aiUsageDataStore.edit { prefs ->
            val now = System.currentTimeMillis()
            val lastEpoch = prefs[KEY_LAST_USAGE_EPOCH] ?: 0L
            val currentCount = if (isSameDay(lastEpoch, now)) {
                prefs[KEY_GENERATIONS_TODAY] ?: 0
            } else {
                0
            }
            prefs[KEY_LAST_USAGE_EPOCH] = now
            prefs[KEY_GENERATIONS_TODAY] = currentCount + 1
        }
    }

    /**
     * Checks whether the user can start a specific Cyber DJ mode.
     */
    fun canAccessDjMode(mode: CyberDjMode): Boolean {
        if (!mode.isProExclusive) return true
        return entitlementRepository.canUse(PremiumFeature.CYBER_DJ_PLUS)
    }

    /**
     * Checks if advanced DJ tuning (fine-tuning discovery ratio & energy sliders) is unlocked.
     */
    fun canUseAdvancedDjTuning(): Boolean {
        return entitlementRepository.canUse(PremiumFeature.CYBER_DJ_PLUS)
    }

    private fun isSameDay(epoch1: Long, epoch2: Long): Boolean {
        if (epoch1 <= 0L || epoch2 <= 0L) return false
        val cal1 = Calendar.getInstance().apply { timeInMillis = epoch1 }
        val cal2 = Calendar.getInstance().apply { timeInMillis = epoch2 }
        return cal1.get(Calendar.YEAR) == cal2.get(Calendar.YEAR) &&
                cal1.get(Calendar.DAY_OF_YEAR) == cal2.get(Calendar.DAY_OF_YEAR)
    }
}
