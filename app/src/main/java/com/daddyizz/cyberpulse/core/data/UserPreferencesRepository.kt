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
    val notificationsEnabled: Boolean = false
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
                notificationsEnabled = preferences[PreferenceKeys.NOTIFICATIONS_ENABLED] ?: false
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
}
