package com.daddyizz.cyberpulse.core.analytics

import android.content.ContentValues
import android.content.Context
import android.database.Cursor
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import com.daddyizz.cyberpulse.core.model.MusicSource
import java.text.SimpleDateFormat
import java.util.*

/**
 * High-performance, local SQLite database for listening events, daily aggregations, and replay records.
 * Uses WAL (Write-Ahead Logging) mode and structured indexes for fast analytical aggregations.
 */
class ListeningAnalyticsDatabase(context: Context) : SQLiteOpenHelper(
    context,
    DATABASE_NAME,
    null,
    DATABASE_VERSION
) {
    companion object {
        const val DATABASE_NAME = "cyberpulse_analytics.db"
        const val DATABASE_VERSION = 1

        // Table: listening_events
        const val TABLE_EVENTS = "listening_events"
        const val COL_EVENT_ID = "id"
        const val COL_TRACK_ID = "track_id"
        const val COL_SOURCE = "source"
        const val COL_SOURCE_ID = "source_id"
        const val COL_TITLE = "title"
        const val COL_ARTIST = "artist"
        const val COL_ALBUM = "album"
        const val COL_GENRE = "genre"
        const val COL_STARTED_AT = "started_at"
        const val COL_ENDED_AT = "ended_at"
        const val COL_LISTENED_MS = "listened_ms"
        const val COL_TRACK_DURATION_MS = "track_duration_ms"
        const val COL_COMPLETION_RATIO = "completion_ratio"
        const val COL_IS_QUALIFIED_PLAY = "is_qualified_play"
        const val COL_SKIP_TYPE = "skip_type"
        const val COL_SESSION_ID = "session_id"
        const val COL_PLAYBACK_CONTEXT = "playback_context"
        const val COL_EXTRA_METADATA = "extra_metadata"

        // Table: daily_listening_summary
        const val TABLE_DAILY_SUMMARY = "daily_listening_summary"
        const val COL_DATE_KEY = "date_key"
        const val COL_MINUTES_LISTENED = "minutes_listened"
        const val COL_TRACKS_PLAYED = "tracks_played"
        const val COL_QUALIFIED_PLAYS = "qualified_plays"
        const val COL_UNIQUE_TRACKS = "unique_tracks"
        const val COL_UNIQUE_ARTISTS = "unique_artists"
        const val COL_LONGEST_SESSION_MS = "longest_session_ms"
        const val COL_TOP_TRACK_TITLE = "top_track_title"
        const val COL_TOP_ARTIST_NAME = "top_artist_name"

        // Table: replay_snapshots
        const val TABLE_REPLAY_SNAPSHOTS = "replay_snapshots"
        const val COL_REPLAY_YEAR = "year"
        const val COL_SNAPSHOT_JSON = "snapshot_json"
        const val COL_UPDATED_AT = "updated_at"

        @Volatile
        private var INSTANCE: ListeningAnalyticsDatabase? = null

        fun getInstance(context: Context): ListeningAnalyticsDatabase {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: ListeningAnalyticsDatabase(context.applicationContext).also { INSTANCE = it }
            }
        }
    }

    override fun onConfigure(db: SQLiteDatabase) {
        super.onConfigure(db)
        db.enableWriteAheadLogging()
    }

    override fun onCreate(db: SQLiteDatabase) {
        db.execSQL(
            """
            CREATE TABLE $TABLE_EVENTS (
                $COL_EVENT_ID TEXT PRIMARY KEY,
                $COL_TRACK_ID TEXT NOT NULL,
                $COL_SOURCE TEXT NOT NULL,
                $COL_SOURCE_ID TEXT,
                $COL_TITLE TEXT NOT NULL,
                $COL_ARTIST TEXT,
                $COL_ALBUM TEXT,
                $COL_GENRE TEXT,
                $COL_STARTED_AT INTEGER NOT NULL,
                $COL_ENDED_AT INTEGER,
                $COL_LISTENED_MS INTEGER NOT NULL,
                $COL_TRACK_DURATION_MS INTEGER,
                $COL_COMPLETION_RATIO REAL,
                $COL_IS_QUALIFIED_PLAY INTEGER NOT NULL,
                $COL_SKIP_TYPE TEXT,
                $COL_SESSION_ID TEXT NOT NULL,
                $COL_PLAYBACK_CONTEXT TEXT NOT NULL,
                $COL_EXTRA_METADATA TEXT
            );
            """.trimIndent()
        )

        // Indexes for performance
        db.execSQL("CREATE INDEX idx_events_started ON $TABLE_EVENTS ($COL_STARTED_AT);")
        db.execSQL("CREATE INDEX idx_events_track ON $TABLE_EVENTS ($COL_TRACK_ID);")
        db.execSQL("CREATE INDEX idx_events_artist ON $TABLE_EVENTS ($COL_ARTIST);")
        db.execSQL("CREATE INDEX idx_events_source ON $TABLE_EVENTS ($COL_SOURCE);")
        db.execSQL("CREATE INDEX idx_events_session ON $TABLE_EVENTS ($COL_SESSION_ID);")
        db.execSQL("CREATE INDEX idx_events_context ON $TABLE_EVENTS ($COL_PLAYBACK_CONTEXT);")

        // Daily summary table
        db.execSQL(
            """
            CREATE TABLE $TABLE_DAILY_SUMMARY (
                $COL_DATE_KEY TEXT PRIMARY KEY,
                $COL_MINUTES_LISTENED INTEGER NOT NULL,
                $COL_TRACKS_PLAYED INTEGER NOT NULL,
                $COL_QUALIFIED_PLAYS INTEGER NOT NULL,
                $COL_UNIQUE_TRACKS INTEGER NOT NULL,
                $COL_UNIQUE_ARTISTS INTEGER NOT NULL,
                $COL_LONGEST_SESSION_MS INTEGER NOT NULL,
                $COL_TOP_TRACK_TITLE TEXT,
                $COL_TOP_ARTIST_NAME TEXT
            );
            """.trimIndent()
        )

        // Replay snapshots
        db.execSQL(
            """
            CREATE TABLE $TABLE_REPLAY_SNAPSHOTS (
                $COL_REPLAY_YEAR INTEGER PRIMARY KEY,
                $COL_SNAPSHOT_JSON TEXT NOT NULL,
                $COL_UPDATED_AT INTEGER NOT NULL
            );
            """.trimIndent()
        )
    }

    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
        // Block 10: Strict Non-Destructive Migration Strategy
        // Preserves all user listening events, daily summaries, and replay snapshots across schema upgrades.
        if (oldVersion < 2) {
            // Example v1 -> v2: Safely add optional columns without data loss
            try {
                db.execSQL("ALTER TABLE $TABLE_EVENTS ADD COLUMN device_type TEXT DEFAULT 'PHONE';")
            } catch (_: Exception) {
                // Column already exists or table current
            }
        }
    }

    /**
     * Inserts a single playback event and incrementally updates the daily summary.
     */
    fun insertEvent(event: ListeningEvent) {
        val db = writableDatabase
        db.beginTransaction()
        try {
            val values = ContentValues().apply {
                put(COL_EVENT_ID, event.id)
                put(COL_TRACK_ID, event.trackId)
                put(COL_SOURCE, event.source.name)
                put(COL_SOURCE_ID, event.sourceId)
                put(COL_TITLE, event.titleSnapshot)
                put(COL_ARTIST, event.artistSnapshot)
                put(COL_ALBUM, event.albumSnapshot)
                put(COL_GENRE, event.genreSnapshot)
                put(COL_STARTED_AT, event.startedAt)
                put(COL_ENDED_AT, event.endedAt)
                put(COL_LISTENED_MS, event.listenedMs)
                put(COL_TRACK_DURATION_MS, event.trackDurationMs)
                put(COL_COMPLETION_RATIO, event.completionRatio)
                put(COL_IS_QUALIFIED_PLAY, if (event.isQualifiedPlay) 1 else 0)
                put(COL_SKIP_TYPE, event.skipType?.name)
                put(COL_SESSION_ID, event.sessionId)
                put(COL_PLAYBACK_CONTEXT, event.playbackContext.name)
                put(COL_EXTRA_METADATA, event.extraMetadata)
            }
            db.insertWithOnConflict(TABLE_EVENTS, null, values, SQLiteDatabase.CONFLICT_REPLACE)

            // Update daily summary
            val dateKey = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date(event.startedAt))
            val eventMinutes = event.listenedMs / 60_000L
            val isQual = if (event.isQualifiedPlay) 1 else 0

            db.execSQL(
                """
                INSERT INTO $TABLE_DAILY_SUMMARY (
                    $COL_DATE_KEY, $COL_MINUTES_LISTENED, $COL_TRACKS_PLAYED,
                    $COL_QUALIFIED_PLAYS, $COL_UNIQUE_TRACKS, $COL_UNIQUE_ARTISTS,
                    $COL_LONGEST_SESSION_MS, $COL_TOP_TRACK_TITLE, $COL_TOP_ARTIST_NAME
                ) VALUES (?, ?, 1, ?, 1, 1, ?, ?, ?)
                ON CONFLICT($COL_DATE_KEY) DO UPDATE SET
                    $COL_MINUTES_LISTENED = $COL_MINUTES_LISTENED + excluded.$COL_MINUTES_LISTENED,
                    $COL_TRACKS_PLAYED = $COL_TRACKS_PLAYED + 1,
                    $COL_QUALIFIED_PLAYS = $COL_QUALIFIED_PLAYS + excluded.$COL_QUALIFIED_PLAYS
                """.trimIndent(),
                arrayOf(dateKey, eventMinutes, isQual, event.listenedMs, event.titleSnapshot, event.artistSnapshot ?: "")
            )

            db.setTransactionSuccessful()
        } finally {
            db.endTransaction()
        }
    }

    /**
     * Batch inserts playback events (e.g. for debug data or bulk sync).
     */
    fun insertEvents(events: List<ListeningEvent>) {
        val db = writableDatabase
        db.beginTransaction()
        try {
            for (event in events) {
                val values = ContentValues().apply {
                    put(COL_EVENT_ID, event.id)
                    put(COL_TRACK_ID, event.trackId)
                    put(COL_SOURCE, event.source.name)
                    put(COL_SOURCE_ID, event.sourceId)
                    put(COL_TITLE, event.titleSnapshot)
                    put(COL_ARTIST, event.artistSnapshot)
                    put(COL_ALBUM, event.albumSnapshot)
                    put(COL_GENRE, event.genreSnapshot)
                    put(COL_STARTED_AT, event.startedAt)
                    put(COL_ENDED_AT, event.endedAt)
                    put(COL_LISTENED_MS, event.listenedMs)
                    put(COL_TRACK_DURATION_MS, event.trackDurationMs)
                    put(COL_COMPLETION_RATIO, event.completionRatio)
                    put(COL_IS_QUALIFIED_PLAY, if (event.isQualifiedPlay) 1 else 0)
                    put(COL_SKIP_TYPE, event.skipType?.name)
                    put(COL_SESSION_ID, event.sessionId)
                    put(COL_PLAYBACK_CONTEXT, event.playbackContext.name)
                    put(COL_EXTRA_METADATA, event.extraMetadata)
                }
                db.insertWithOnConflict(TABLE_EVENTS, null, values, SQLiteDatabase.CONFLICT_REPLACE)
            }
            db.setTransactionSuccessful()
        } finally {
            db.endTransaction()
        }
    }

    /**
     * Retrieves all events in a given timestamp window [fromMs, toMs].
     */
    fun getEventsBetween(fromMs: Long, toMs: Long): List<ListeningEvent> {
        val db = readableDatabase
        val events = mutableListOf<ListeningEvent>()
        val cursor = db.query(
            TABLE_EVENTS,
            null,
            "$COL_STARTED_AT >= ? AND $COL_STARTED_AT <= ?",
            arrayOf(fromMs.toString(), toMs.toString()),
            null,
            null,
            "$COL_STARTED_AT ASC"
        )
        cursor.use {
            while (it.moveToNext()) {
                events.add(cursorToEvent(it))
            }
        }
        return events
    }

    /**
     * Total count of qualified plays ever recorded.
     */
    fun getTotalQualifiedPlaysCount(): Int {
        val db = readableDatabase
        val cursor = db.rawQuery(
            "SELECT COUNT(*) FROM $TABLE_EVENTS WHERE $COL_IS_QUALIFIED_PLAY = 1",
            null
        )
        cursor.use {
            if (it.moveToFirst()) return it.getInt(0)
        }
        return 0
    }

    /**
     * Total listening milliseconds ever recorded.
     */
    fun getTotalListenedMs(): Long {
        val db = readableDatabase
        val cursor = db.rawQuery(
            "SELECT SUM($COL_LISTENED_MS) FROM $TABLE_EVENTS",
            null
        )
        cursor.use {
            if (it.moveToFirst()) return it.getLong(0)
        }
        return 0L
    }

    /**
     * Timestamp of the earliest recorded event.
     */
    fun getEarliestEventTimestamp(): Long? {
        val db = readableDatabase
        val cursor = db.rawQuery(
            "SELECT MIN($COL_STARTED_AT) FROM $TABLE_EVENTS",
            null
        )
        cursor.use {
            if (it.moveToFirst() && !it.isNull(0)) {
                val value = it.getLong(0)
                if (value > 0L) return value
            }
        }
        return null
    }

    /**
     * All unique dates with activity, used for streak calculation.
     * Returns sorted list of date strings (yyyy-MM-dd) along with total minutes and qualified plays.
     */
    data class DayActivity(val dateKey: String, val minutes: Long, val qualifiedPlays: Int)

    fun getDailyActivitySummaries(): List<DayActivity> {
        val db = readableDatabase
        val list = mutableListOf<DayActivity>()
        val cursor = db.rawQuery(
            """
            SELECT 
                strftime('%Y-%m-%d', $COL_STARTED_AT / 1000, 'unixepoch', 'localtime') as date_str,
                SUM($COL_LISTENED_MS) / 60000 as total_min,
                SUM(CASE WHEN $COL_IS_QUALIFIED_PLAY = 1 THEN 1 ELSE 0 END) as qual_plays
            FROM $TABLE_EVENTS
            GROUP BY date_str
            ORDER BY date_str ASC
            """.trimIndent(),
            null
        )
        cursor.use {
            while (it.moveToNext()) {
                val dateStr = it.getString(0) ?: continue
                val totalMin = it.getLong(1)
                val qualPlays = it.getInt(2)
                list.add(DayActivity(dateStr, totalMin, qualPlays))
            }
        }
        return list
    }

    /**
     * Deletes ALL recorded listening events, daily aggregations, and replay data.
     * Privacy action requested by user.
     */
    fun clearAllListeningData() {
        val db = writableDatabase
        db.beginTransaction()
        try {
            db.delete(TABLE_EVENTS, null, null)
            db.delete(TABLE_DAILY_SUMMARY, null, null)
            db.delete(TABLE_REPLAY_SNAPSHOTS, null, null)
            db.setTransactionSuccessful()
        } finally {
            db.endTransaction()
        }
    }

    private fun cursorToEvent(cursor: Cursor): ListeningEvent {
        return ListeningEvent(
            id = cursor.getString(cursor.getColumnIndexOrThrow(COL_EVENT_ID)),
            trackId = cursor.getString(cursor.getColumnIndexOrThrow(COL_TRACK_ID)),
            source = try {
                MusicSource.valueOf(cursor.getString(cursor.getColumnIndexOrThrow(COL_SOURCE)))
            } catch (e: Exception) {
                MusicSource.DEMO
            },
            sourceId = cursor.getString(cursor.getColumnIndexOrThrow(COL_SOURCE_ID)),
            titleSnapshot = cursor.getString(cursor.getColumnIndexOrThrow(COL_TITLE)),
            artistSnapshot = cursor.getString(cursor.getColumnIndexOrThrow(COL_ARTIST)),
            albumSnapshot = cursor.getString(cursor.getColumnIndexOrThrow(COL_ALBUM)),
            genreSnapshot = cursor.getString(cursor.getColumnIndexOrThrow(COL_GENRE)),
            startedAt = cursor.getLong(cursor.getColumnIndexOrThrow(COL_STARTED_AT)),
            endedAt = if (cursor.isNull(cursor.getColumnIndexOrThrow(COL_ENDED_AT))) null else cursor.getLong(cursor.getColumnIndexOrThrow(COL_ENDED_AT)),
            listenedMs = cursor.getLong(cursor.getColumnIndexOrThrow(COL_LISTENED_MS)),
            trackDurationMs = if (cursor.isNull(cursor.getColumnIndexOrThrow(COL_TRACK_DURATION_MS))) null else cursor.getLong(cursor.getColumnIndexOrThrow(COL_TRACK_DURATION_MS)),
            completionRatio = if (cursor.isNull(cursor.getColumnIndexOrThrow(COL_COMPLETION_RATIO))) null else cursor.getDouble(cursor.getColumnIndexOrThrow(COL_COMPLETION_RATIO)),
            isQualifiedPlay = cursor.getInt(cursor.getColumnIndexOrThrow(COL_IS_QUALIFIED_PLAY)) == 1,
            skipType = cursor.getString(cursor.getColumnIndexOrThrow(COL_SKIP_TYPE))?.let {
                try { SkipType.valueOf(it) } catch (e: Exception) { SkipType.NONE }
            },
            sessionId = cursor.getString(cursor.getColumnIndexOrThrow(COL_SESSION_ID)),
            playbackContext = try {
                PlaybackContext.valueOf(cursor.getString(cursor.getColumnIndexOrThrow(COL_PLAYBACK_CONTEXT)))
            } catch (e: Exception) {
                PlaybackContext.HOME
            },
            extraMetadata = cursor.getString(cursor.getColumnIndexOrThrow(COL_EXTRA_METADATA))
        )
    }
}
