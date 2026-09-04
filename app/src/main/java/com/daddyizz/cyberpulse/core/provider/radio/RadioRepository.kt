package com.daddyizz.cyberpulse.core.provider.radio

import android.content.Context
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import com.daddyizz.cyberpulse.core.model.RadioStation
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * RadioRepository
 *
 * Coordinates internet radio station catalogs, user favorite persistence,
 * category filtering, and network connectivity state.
 */
class RadioRepository(context: Context? = null) {

    private val prefs = context?.getSharedPreferences("cyberpulse_radio_prefs", Context.MODE_PRIVATE)

    private val _favoriteStationIds: MutableStateFlow<Set<String>>
    val favoriteStationIds: StateFlow<Set<String>>

    private val _isOffline = MutableStateFlow(false)
    val isOffline: StateFlow<Boolean> = _isOffline.asStateFlow()

    init {
        val saved = prefs?.getStringSet("favorite_station_ids", null)
        val initial = saved ?: setOf("radio_nightwave_plaza", "radio_my_bernama", "radio_soma_groove")
        _favoriteStationIds = MutableStateFlow(initial)
        favoriteStationIds = _favoriteStationIds.asStateFlow()

        // Monitor real network connectivity
        if (context != null) {
            val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager
            if (cm != null) {
                val activeNetwork = cm.activeNetwork
                val caps = cm.getNetworkCapabilities(activeNetwork)
                val connected = caps?.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) == true
                _isOffline.value = !connected

                val request = NetworkRequest.Builder()
                    .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
                    .build()

                cm.registerNetworkCallback(
                    request,
                    object : ConnectivityManager.NetworkCallback() {
                        override fun onAvailable(network: Network) {
                            _isOffline.value = false
                        }

                        override fun onLost(network: Network) {
                            _isOffline.value = true
                        }
                    }
                )
            }
        }
    }

    fun getAllStations(): List<RadioStation> {
        val favs = _favoriteStationIds.value
        return RadioProvider.STATIONS.map { station ->
            station.copy(isFavorite = favs.contains(station.id))
        }
    }

    fun getFavorites(): List<RadioStation> {
        val favs = _favoriteStationIds.value
        return RadioProvider.STATIONS
            .filter { favs.contains(it.id) }
            .map { it.copy(isFavorite = true) }
    }

    fun getMalaysianStations(): List<RadioStation> {
        val favs = _favoriteStationIds.value
        return RadioProvider.STATIONS
            .filter { it.country.equals("Malaysia", ignoreCase = true) }
            .map { it.copy(isFavorite = favs.contains(it.id)) }
    }

    fun getStationsByCategory(category: String): List<RadioStation> {
        val favs = _favoriteStationIds.value
        val list = when (category.lowercase()) {
            "all" -> RadioProvider.STATIONS
            "favorites" -> RadioProvider.STATIONS.filter { favs.contains(it.id) }
            "malaysia" -> RadioProvider.STATIONS.filter { it.country.equals("Malaysia", ignoreCase = true) }
            "electronic" -> RadioProvider.STATIONS.filter { it.genre.equals("Electronic", ignoreCase = true) }
            "chill" -> RadioProvider.STATIONS.filter { it.genre.equals("Chill", ignoreCase = true) }
            "news", "news & talk" -> RadioProvider.STATIONS.filter { it.genre?.contains("News", ignoreCase = true) == true }
            "jazz" -> RadioProvider.STATIONS.filter { it.genre.equals("Jazz", ignoreCase = true) }
            "classical" -> RadioProvider.STATIONS.filter { it.genre.equals("Classical", ignoreCase = true) }
            else -> RadioProvider.STATIONS.filter { it.genre.equals(category, ignoreCase = true) }
        }
        return list.map { it.copy(isFavorite = favs.contains(it.id)) }
    }

    fun searchStations(query: String): List<RadioStation> {
        val q = query.trim().lowercase()
        if (q.isBlank()) return emptyList()
        val favs = _favoriteStationIds.value
        return RadioProvider.STATIONS.filter { station ->
            station.name.lowercase().contains(q) ||
                (station.genre?.lowercase()?.contains(q) == true) ||
                (station.country?.lowercase()?.contains(q) == true)
        }.map { it.copy(isFavorite = favs.contains(it.id)) }
    }

    fun toggleFavorite(stationId: String) {
        val current = _favoriteStationIds.value.toMutableSet()
        if (current.contains(stationId)) {
            current.remove(stationId)
        } else {
            current.add(stationId)
        }
        _favoriteStationIds.value = current
        prefs?.edit()?.putStringSet("favorite_station_ids", current)?.apply()
    }

    fun isFavorite(stationId: String): Boolean = _favoriteStationIds.value.contains(stationId)
}
