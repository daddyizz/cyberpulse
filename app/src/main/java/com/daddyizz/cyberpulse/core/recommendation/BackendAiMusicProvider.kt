package com.daddyizz.cyberpulse.core.recommendation

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL

/**
 * Backend-mediated AI Music Provider.
 *
 * Directs AI generation requests to the secure CyberPulse backend proxy.
 * Prevents embedding sensitive API keys (Gemini, OpenAI, etc.) in client APK.
 * Enforces prompt sanitization, JSON schema validation, and structured error mapping.
 */
class BackendAiMusicProvider(
    private val backendBaseUrl: String = DEFAULT_BACKEND_URL
) : AiMusicProvider {

    companion object {
        // Points to the server-side proxy route on port 3000
        const val DEFAULT_BACKEND_URL = "http://localhost:3000/api/ai"
        private const val MAX_PROMPT_LENGTH = 300
        private const val CONNECT_TIMEOUT_MS = 6000
        private const val READ_TIMEOUT_MS = 10000
    }

    override suspend fun generatePlaylistIntent(
        prompt: String,
        context: ListenerContext,
        targetDurationMinutes: Int?,
        targetTrackCount: Int?
    ): Result<PlaylistIntent> = withContext(Dispatchers.IO) {
        val sanitizedPrompt = sanitizePrompt(prompt)
        if (sanitizedPrompt.isBlank()) {
            return@withContext Result.failure(
                IllegalArgumentException("Prompt cannot be empty")
            )
        }

        try {
            val endpoint = URL("$backendBaseUrl/playlist-intent")
            val connection = (endpoint.openConnection() as HttpURLConnection).apply {
                requestMethod = "POST"
                connectTimeout = CONNECT_TIMEOUT_MS
                readTimeout = READ_TIMEOUT_MS
                doOutput = true
                setRequestProperty("Content-Type", "application/json")
                setRequestProperty("Accept", "application/json")
            }

            // Build strictly sanitized JSON request payload
            val requestBody = JSONObject().apply {
                put("prompt", sanitizedPrompt)
                put("targetDurationMinutes", targetDurationMinutes ?: 45)
                put("targetTrackCount", targetTrackCount ?: 15)
                put("context", JSONObject().apply {
                    put("timeOfDay", context.timeOfDay)
                    put("isPersonalizationEnabled", context.isPersonalizationEnabled)
                    put("preferredLanguages", JSONArray(context.preferredLanguages))
                    if (context.isPersonalizationEnabled) {
                        put("favoriteGenres", JSONArray(context.favoriteGenres))
                        put("favoriteArtists", JSONArray(context.favoriteArtists))
                        put("likedSamples", JSONArray(context.likedTrackTitles.take(5)))
                    }
                })
            }

            OutputStreamWriter(connection.outputStream).use { writer ->
                writer.write(requestBody.toString())
                writer.flush()
            }

            val responseCode = connection.responseCode
            when (responseCode) {
                HttpURLConnection.HTTP_OK -> {
                    val responseText = connection.inputStream.bufferedReader().use(BufferedReader::readText)
                    val parsedIntent = parseAndValidatePlaylistIntent(responseText)
                    Result.success(parsedIntent)
                }
                429 -> {
                    Result.failure(Exception(AiGenerationError.RateLimited.message))
                }
                HttpURLConnection.HTTP_UNAVAILABLE, HttpURLConnection.HTTP_BAD_GATEWAY -> {
                    Result.failure(Exception(AiGenerationError.ProviderUnavailable.message))
                }
                else -> {
                    val errBody = try {
                        connection.errorStream?.bufferedReader()?.use(BufferedReader::readText)
                    } catch (_: Exception) { null }
                    Result.failure(Exception(errBody ?: "AI service returned HTTP $responseCode"))
                }
            }
        } catch (e: java.net.ConnectException) {
            // Local dev server or backend not running
            Result.failure(Exception(AiGenerationError.ProviderUnavailable.message))
        } catch (e: java.net.SocketTimeoutException) {
            Result.failure(Exception(AiGenerationError.NoNetwork.message))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun generateDjSession(
        mode: CyberDjMode,
        context: ListenerContext,
        customEnergy: Int?,
        customDiscoveryRatio: Float?
    ): Result<DjSessionPlan> = withContext(Dispatchers.IO) {
        try {
            val endpoint = URL("$backendBaseUrl/dj-session")
            val connection = (endpoint.openConnection() as HttpURLConnection).apply {
                requestMethod = "POST"
                connectTimeout = CONNECT_TIMEOUT_MS
                readTimeout = READ_TIMEOUT_MS
                doOutput = true
                setRequestProperty("Content-Type", "application/json")
                setRequestProperty("Accept", "application/json")
            }

            val requestBody = JSONObject().apply {
                put("mode", mode.name)
                put("targetEnergy", customEnergy ?: mode.defaultEnergy)
                put("discoveryRatio", (customDiscoveryRatio ?: mode.defaultDiscovery).toDouble())
                put("context", JSONObject().apply {
                    put("timeOfDay", context.timeOfDay)
                    put("isPersonalizationEnabled", context.isPersonalizationEnabled)
                    put("preferredLanguages", JSONArray(context.preferredLanguages))
                    if (context.isPersonalizationEnabled) {
                        put("favoriteGenres", JSONArray(context.favoriteGenres))
                        put("favoriteArtists", JSONArray(context.favoriteArtists))
                    }
                })
            }

            OutputStreamWriter(connection.outputStream).use { writer ->
                writer.write(requestBody.toString())
                writer.flush()
            }

            val responseCode = connection.responseCode
            if (responseCode == HttpURLConnection.HTTP_OK) {
                val responseText = connection.inputStream.bufferedReader().use(BufferedReader::readText)
                val parsedPlan = parseAndValidateDjSessionPlan(responseText, mode)
                Result.success(parsedPlan)
            } else {
                Result.failure(Exception("Backend DJ endpoint returned HTTP $responseCode"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * Sanitizes user input to prevent prompt injection and oversized payloads.
     */
    fun sanitizePrompt(rawPrompt: String): String {
        return rawPrompt.trim()
            .take(MAX_PROMPT_LENGTH)
            .replace("\r", " ")
            .replace("\n", " ")
            .replace("\\", "")
            .trim()
    }

    /**
     * Strict JSON schema validator for PlaylistIntent responses.
     */
    fun parseAndValidatePlaylistIntent(jsonString: String): PlaylistIntent {
        val root = JSONObject(jsonString)
        val data = if (root.has("intent")) root.getJSONObject("intent") else root

        val title = data.optString("title", "CyberPulse Dynamic Mix").take(60)
        val description = data.optString("description", "Curated intelligent pulse mix.").take(200)

        val genres = jsonArrayToStringList(data.optJSONArray("genres"))
        val moods = jsonArrayToStringList(data.optJSONArray("moods"))
        val eras = jsonArrayToStringList(data.optJSONArray("eras"))
        val artists = jsonArrayToStringList(data.optJSONArray("artists"))
        val excludedArtists = jsonArrayToStringList(data.optJSONArray("excludedArtists"))
        val languages = jsonArrayToStringList(data.optJSONArray("languagePreferences"))

        val rawEnergy = data.optInt("energy", 50)
        val clampedEnergy = rawEnergy.coerceIn(1, 100)

        val rawTrackCount = data.optInt("targetTrackCount", 15)
        val clampedTrackCount = rawTrackCount.coerceIn(5, 50)

        val tempo = data.optString("tempoPreference", null)
        val activity = data.optString("activity", null)

        return PlaylistIntent(
            title = title,
            description = description,
            genres = genres,
            moods = moods,
            eras = eras,
            artists = artists,
            excludedArtists = excludedArtists,
            energy = clampedEnergy,
            tempoPreference = tempo,
            languagePreferences = languages,
            targetTrackCount = clampedTrackCount,
            activity = activity
        )
    }

    /**
     * Strict JSON schema validator for DjSessionPlan.
     */
    fun parseAndValidateDjSessionPlan(jsonString: String, requestedMode: CyberDjMode): DjSessionPlan {
        val root = JSONObject(jsonString)
        val data = if (root.has("plan")) root.getJSONObject("plan") else root

        val rawEnergy = data.optInt("targetEnergy", requestedMode.defaultEnergy)
        val clampedEnergy = rawEnergy.coerceIn(1, 100)

        val rawDiscovery = data.optDouble("discoveryRatio", requestedMode.defaultDiscovery.toDouble()).toFloat()
        val clampedDiscovery = rawDiscovery.coerceIn(0.0f, 1.0f)

        val primaryGenres = jsonArrayToStringList(data.optJSONArray("primaryGenres"))
        val targetMoods = jsonArrayToStringList(data.optJSONArray("targetMoods"))
        val seedArtists = jsonArrayToStringList(data.optJSONArray("seedArtists"))
        val seedKeywords = jsonArrayToStringList(data.optJSONArray("seedKeywords"))
        val tempo = data.optString("tempoPreference", null)

        return DjSessionPlan(
            mode = requestedMode,
            targetEnergy = clampedEnergy,
            discoveryRatio = clampedDiscovery,
            primaryGenres = primaryGenres,
            targetMoods = targetMoods,
            seedArtists = seedArtists,
            seedKeywords = seedKeywords,
            tempoPreference = tempo
        )
    }

    private fun jsonArrayToStringList(array: JSONArray?): List<String> {
        if (array == null) return emptyList()
        val list = mutableListOf<String>()
        for (i in 0 until array.length()) {
            val item = array.optString(i, "").trim()
            if (item.isNotBlank()) list.add(item)
        }
        return list
    }
}
