package com.daddyizz.cyberpulse.core.network

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass
import java.util.regex.Pattern

@JsonClass(generateAdapter = true)
data class YouTubeSearchResponseDto(
    @Json(name = "nextPageToken") val nextPageToken: String? = null,
    @Json(name = "prevPageToken") val prevPageToken: String? = null,
    @Json(name = "pageInfo") val pageInfo: PageInfoDto? = null,
    @Json(name = "items") val items: List<YouTubeSearchResultItemDto> = emptyList()
)

@JsonClass(generateAdapter = true)
data class PageInfoDto(
    @Json(name = "totalResults") val totalResults: Int = 0,
    @Json(name = "resultsPerPage") val resultsPerPage: Int = 0
)

@JsonClass(generateAdapter = true)
data class YouTubeSearchResultItemDto(
    @Json(name = "id") val id: ResourceIdDto? = null,
    @Json(name = "snippet") val snippet: SnippetDto? = null
)

@JsonClass(generateAdapter = true)
data class ResourceIdDto(
    @Json(name = "kind") val kind: String? = null,
    @Json(name = "videoId") val videoId: String? = null,
    @Json(name = "channelId") val channelId: String? = null,
    @Json(name = "playlistId") val playlistId: String? = null
)

@JsonClass(generateAdapter = true)
data class SnippetDto(
    @Json(name = "publishedAt") val publishedAt: String? = null,
    @Json(name = "channelId") val channelId: String? = null,
    @Json(name = "title") val title: String? = null,
    @Json(name = "description") val description: String? = null,
    @Json(name = "thumbnails") val thumbnails: ThumbnailsDto? = null,
    @Json(name = "channelTitle") val channelTitle: String? = null
)

@JsonClass(generateAdapter = true)
data class ThumbnailsDto(
    @Json(name = "default") val default: ThumbnailDto? = null,
    @Json(name = "medium") val medium: ThumbnailDto? = null,
    @Json(name = "high") val high: ThumbnailDto? = null
)

@JsonClass(generateAdapter = true)
data class ThumbnailDto(
    @Json(name = "url") val url: String? = null,
    @Json(name = "width") val width: Int = 0,
    @Json(name = "height") val height: Int = 0
)

@JsonClass(generateAdapter = true)
data class YouTubeVideoListResponseDto(
    @Json(name = "items") val items: List<YouTubeVideoItemDto> = emptyList()
)

@JsonClass(generateAdapter = true)
data class YouTubeVideoItemDto(
    @Json(name = "id") val id: String,
    @Json(name = "snippet") val snippet: SnippetDto? = null,
    @Json(name = "contentDetails") val contentDetails: ContentDetailsDto? = null,
    @Json(name = "statistics") val statistics: VideoStatisticsDto? = null
)

@JsonClass(generateAdapter = true)
data class ContentDetailsDto(
    @Json(name = "duration") val duration: String? = null
)

@JsonClass(generateAdapter = true)
data class VideoStatisticsDto(
    @Json(name = "viewCount") val viewCount: String? = null,
    @Json(name = "likeCount") val likeCount: String? = null
)

@JsonClass(generateAdapter = true)
data class YouTubeChannelListResponseDto(
    @Json(name = "items") val items: List<YouTubeChannelItemDto> = emptyList()
)

@JsonClass(generateAdapter = true)
data class YouTubeChannelItemDto(
    @Json(name = "id") val id: String,
    @Json(name = "snippet") val snippet: SnippetDto? = null,
    @Json(name = "statistics") val statistics: ChannelStatisticsDto? = null
)

@JsonClass(generateAdapter = true)
data class ChannelStatisticsDto(
    @Json(name = "subscriberCount") val subscriberCount: String? = null,
    @Json(name = "hiddenSubscriberCount") val hiddenSubscriberCount: Boolean? = null
)

@JsonClass(generateAdapter = true)
data class YouTubePlaylistListResponseDto(
    @Json(name = "items") val items: List<YouTubePlaylistItemDto> = emptyList()
)

@JsonClass(generateAdapter = true)
data class YouTubePlaylistItemDto(
    @Json(name = "id") val id: String,
    @Json(name = "snippet") val snippet: SnippetDto? = null,
    @Json(name = "contentDetails") val contentDetails: PlaylistContentDetailsDto? = null
)

@JsonClass(generateAdapter = true)
data class PlaylistContentDetailsDto(
    @Json(name = "itemCount") val itemCount: Int = 0
)

object YouTubeDurationParser {
    // Standard ISO-8601 pattern supporting optional Days, Hours, Minutes, and Seconds (e.g. P1DT2H30M15S, PT4M20S, PT45S, PT1H, P0D)
    private val pattern = Pattern.compile("^P(?:(\\d+)D)?(?:T(?:(\\d+)H)?(?:(\\d+)M)?(?:(\\d+)S)?)?$", Pattern.CASE_INSENSITIVE)

    fun parseIsoDurationToSeconds(isoDuration: String?): Long {
        if (isoDuration.isNullOrBlank()) return 0L
        val trimmed = isoDuration.trim()
        val matcher = pattern.matcher(trimmed)
        if (!matcher.matches()) return 0L

        val days = matcher.group(1)?.toLongOrNull() ?: 0L
        val hours = matcher.group(2)?.toLongOrNull() ?: 0L
        val minutes = matcher.group(3)?.toLongOrNull() ?: 0L
        val seconds = matcher.group(4)?.toLongOrNull() ?: 0L

        return (days * 86400L) + (hours * 3600L) + (minutes * 60L) + seconds
    }
}
