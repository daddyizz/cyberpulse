package com.daddyizz.cyberpulse.core.data

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.*
import androidx.datastore.preferences.preferencesDataStore
import com.daddyizz.cyberpulse.core.common.Constants
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.map
import java.io.IOException

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = Constants.PREFS_DATASTORE_NAME)

data class UserPreferences(
    val isOnboardingCompleted: Boolean = false,
    val selectedGenres: Set<String> = emptySet(),
    val selectedArtists: Set<String> = emptySet(),
    val theme: String = Constants.THEME_CYBERPUNK,
    val reduceAnimations: Boolean = false,
    val dynamicBackgrounds: Boolean = true,
    val dataSaver: Boolean = false,
    val recommendationsEnabled: Boolean = true,
    val notificationsEnabled: Boolean = false,
    val aiPersonalizationEnabled: Boolean = true,
    val listeningHistoryForRecommendationsEnabled: Boolean = true,
    val allowExplicitContent: Boolean = true,
    val preferredLanguages: Set<String> = setOf("English", "Malay", "Indonesian"),
    val visualizerEnabled: Boolean = true,
    val visualizerMode: String = "NEON_WAVE",
    val visualizerPerformance: String = "NORMAL",
    val visualizerUseArtworkColors: Boolean = true,
    val visualizerBatterySaverAdaptation: Boolean = true,
    val lyricsAutoScroll: Boolean = true,
    val lyricsTapToSeek: Boolean = true,
    val lyricsLargeText: Boolean = false
)

class UserPreferencesRepository(private val context: Context) {

    private object PreferenceKeys {
        val ONBOARDING_COMPLETED = booleanPreferencesKey(Constants.KEY_ONBOARDING_COMPLETED)
        val SELECTED_GENRES = stringSetPreferencesKey(Constants.KEY_SELECTED_GENRES)
        val SELECTED_ARTISTS = stringSetPreferencesKey(Constants.KEY_SELECTED_ARTISTS)
        val THEME = stringPreferencesKey(Constants.KEY_THEME)
        val REDUCE_ANIMATIONS = booleanPreferencesKey(Constants.KEY_REDUCE_ANIMATIONS)
        val DYNAMIC_BACKGROUNDS = booleanPreferencesKey(Constants.KEY_DYNAMIC_BACKGROUNDS)
        val DATA_SAVER = booleanPreferencesKey(Constants.KEY_DATA_SAVER)
        val RECOMMENDATIONS_ENABLED = booleanPreferencesKey(Constants.KEY_RECOMMENDATIONS_ENABLED)
        val NOTIFICATIONS_ENABLED = booleanPreferencesKey(Constants.KEY_NOTIFICATIONS_ENABLED)
        val AI_PERSONALIZATION_ENABLED = booleanPreferencesKey("ai_personalization_enabled")
        val LISTENING_HISTORY_ENABLED = booleanPreferencesKey("listening_history_enabled")
        val ALLOW_EXPLICIT_CONTENT = booleanPreferencesKey("allow_explicit_content")
        val PREFERRED_LANGUAGES = stringSetPreferencesKey("preferred_languages")
        val VISUALIZER_ENABLED = booleanPreferencesKey("visualizer_enabled")
        val VISUALIZER_MODE = stringPreferencesKey("visualizer_mode")
        val VISUALIZER_PERFORMANCE = stringPreferencesKey("visualizer_performance")
        val VISUALIZER_USE_ARTWORK_COLORS = booleanPreferencesKey("visualizer_use_artwork_colors")
        val VISUALIZER_BATTERY_SAVER_ADAPTATION = booleanPreferencesKey("visualizer_battery_saver_adaptation")
        val LYRICS_AUTO_SCROLL = booleanPreferencesKey("lyrics_auto_scroll")
        val LYRICS_TAP_TO_SEEK = booleanPreferencesKey("lyrics_tap_to_seek")
        val LYRICS_LARGE_TEXT = booleanPreferencesKey("lyrics_large_text")
    }

    val userPreferencesFlow: Flow<UserPreferences> = context.dataStore.data
        .catch { exception ->
            if (exception is IOException) {
                emit(emptyPreferences())
            } else {
                throw exception
            }
        }
        .map { preferences ->
            UserPreferences(
                isOnboardingCompleted = preferences[PreferenceKeys.ONBOARDING_COMPLETED] ?: false,
                selectedGenres = preferences[PreferenceKeys.SELECTED_GENRES] ?: emptySet(),
                selectedArtists = preferences[PreferenceKeys.SELECTED_ARTISTS] ?: emptySet(),
                theme = preferences[PreferenceKeys.THEME] ?: Constants.THEME_CYBERPUNK,
                reduceAnimations = preferences[PreferenceKeys.REDUCE_ANIMATIONS] ?: false,
                dynamicBackgrounds = preferences[PreferenceKeys.DYNAMIC_BACKGROUNDS] ?: true,
                dataSaver = preferences[PreferenceKeys.DATA_SAVER] ?: false,
                recommendationsEnabled = preferences[PreferenceKeys.RECOMMENDATIONS_ENABLED] ?: true,
                notificationsEnabled = preferences[PreferenceKeys.NOTIFICATIONS_ENABLED] ?: false,
                aiPersonalizationEnabled = preferences[PreferenceKeys.AI_PERSONALIZATION_ENABLED] ?: true,
                listeningHistoryForRecommendationsEnabled = preferences[PreferenceKeys.LISTENING_HISTORY_ENABLED] ?: true,
                allowExplicitContent = preferences[PreferenceKeys.ALLOW_EXPLICIT_CONTENT] ?: true,
                preferredLanguages = preferences[PreferenceKeys.PREFERRED_LANGUAGES] ?: setOf("English", "Malay", "Indonesian"),
                visualizerEnabled = preferences[PreferenceKeys.VISUALIZER_ENABLED] ?: true,
                visualizerMode = preferences[PreferenceKeys.VISUALIZER_MODE] ?: "NEON_WAVE",
                visualizerPerformance = preferences[PreferenceKeys.VISUALIZER_PERFORMANCE] ?: "NORMAL",
                visualizerUseArtworkColors = preferences[PreferenceKeys.VISUALIZER_USE_ARTWORK_COLORS] ?: true,
                visualizerBatterySaverAdaptation = preferences[PreferenceKeys.VISUALIZER_BATTERY_SAVER_ADAPTATION] ?: true,
                lyricsAutoScroll = preferences[PreferenceKeys.LYRICS_AUTO_SCROLL] ?: true,
                lyricsTapToSeek = preferences[PreferenceKeys.LYRICS_TAP_TO_SEEK] ?: true,
                lyricsLargeText = preferences[PreferenceKeys.LYRICS_LARGE_TEXT] ?: false
            )
        }

    suspend fun setOnboardingCompleted(completed: Boolean) {
        context.dataStore.edit { preferences ->
            preferences[PreferenceKeys.ONBOARDING_COMPLETED] = completed
        }
    }

    suspend fun updateSelectedGenres(genres: Set<String>) {
        context.dataStore.edit { preferences ->
            preferences[PreferenceKeys.SELECTED_GENRES] = genres
        }
    }

    suspend fun updateSelectedArtists(artists: Set<String>) {
        context.dataStore.edit { preferences ->
            preferences[PreferenceKeys.SELECTED_ARTISTS] = artists
        }
    }

    suspend fun setTheme(theme: String) {
        context.dataStore.edit { preferences ->
            preferences[PreferenceKeys.THEME] = theme
        }
    }

    suspend fun setReduceAnimations(reduce: Boolean) {
        context.dataStore.edit { preferences ->
            preferences[PreferenceKeys.REDUCE_ANIMATIONS] = reduce
        }
    }

    suspend fun setDynamicBackgrounds(enabled: Boolean) {
        context.dataStore.edit { preferences ->
            preferences[PreferenceKeys.DYNAMIC_BACKGROUNDS] = enabled
        }
    }

    suspend fun setDataSaver(enabled: Boolean) {
        context.dataStore.edit { preferences ->
            preferences[PreferenceKeys.DATA_SAVER] = enabled
        }
    }

    suspend fun setRecommendationsEnabled(enabled: Boolean) {
        context.dataStore.edit { preferences ->
            preferences[PreferenceKeys.RECOMMENDATIONS_ENABLED] = enabled
        }
    }

    suspend fun setNotificationsEnabled(enabled: Boolean) {
        context.dataStore.edit { preferences ->
            preferences[PreferenceKeys.NOTIFICATIONS_ENABLED] = enabled
        }
    }

    suspend fun setAiPersonalizationEnabled(enabled: Boolean) {
        context.dataStore.edit { preferences ->
            preferences[PreferenceKeys.AI_PERSONALIZATION_ENABLED] = enabled
        }
    }

    suspend fun setListeningHistoryEnabled(enabled: Boolean) {
        context.dataStore.edit { preferences ->
            preferences[PreferenceKeys.LISTENING_HISTORY_ENABLED] = enabled
        }
    }

    suspend fun setAllowExplicitContent(allowed: Boolean) {
        context.dataStore.edit { preferences ->
            preferences[PreferenceKeys.ALLOW_EXPLICIT_CONTENT] = allowed
        }
    }

    suspend fun setPreferredLanguages(languages: Set<String>) {
        context.dataStore.edit { preferences ->
            preferences[PreferenceKeys.PREFERRED_LANGUAGES] = languages
        }
    }

    suspend fun clearRecommendationPreferences() {
        context.dataStore.edit { preferences ->
            preferences.remove(PreferenceKeys.SELECTED_GENRES)
            preferences.remove(PreferenceKeys.SELECTED_ARTISTS)
        }
    }

    suspend fun setVisualizerEnabled(enabled: Boolean) {
        context.dataStore.edit { preferences ->
            preferences[PreferenceKeys.VISUALIZER_ENABLED] = enabled
        }
    }

    suspend fun setVisualizerMode(mode: String) {
        context.dataStore.edit { preferences ->
            preferences[PreferenceKeys.VISUALIZER_MODE] = mode
        }
    }

    suspend fun setVisualizerPerformance(performance: String) {
        context.dataStore.edit { preferences ->
            preferences[PreferenceKeys.VISUALIZER_PERFORMANCE] = performance
        }
    }

    suspend fun setVisualizerUseArtworkColors(use: Boolean) {
        context.dataStore.edit { preferences ->
            preferences[PreferenceKeys.VISUALIZER_USE_ARTWORK_COLORS] = use
        }
    }

    suspend fun setVisualizerBatterySaverAdaptation(adapt: Boolean) {
        context.dataStore.edit { preferences ->
            preferences[PreferenceKeys.VISUALIZER_BATTERY_SAVER_ADAPTATION] = adapt
        }
    }

    suspend fun setLyricsAutoScroll(enabled: Boolean) {
        context.dataStore.edit { preferences ->
            preferences[PreferenceKeys.LYRICS_AUTO_SCROLL] = enabled
        }
    }

    suspend fun setLyricsTapToSeek(enabled: Boolean) {
        context.dataStore.edit { preferences ->
            preferences[PreferenceKeys.LYRICS_TAP_TO_SEEK] = enabled
        }
    }

    suspend fun setLyricsLargeText(large: Boolean) {
        context.dataStore.edit { preferences ->
            preferences[PreferenceKeys.LYRICS_LARGE_TEXT] = large
        }
    }
}
