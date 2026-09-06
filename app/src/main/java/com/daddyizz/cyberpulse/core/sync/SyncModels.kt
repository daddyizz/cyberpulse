package com.daddyizz.cyberpulse.core.sync

/**
 * Block 10: Status indicator for Cloud Synchronization.
 */
enum class SyncStatus {
    SYNCED,
    SYNCING,
    OFFLINE,
    SYNC_ERROR
}

/**
 * An individual queued offline mutation waiting to be committed to the cloud backend.
 */
data class SyncOperation(
    val id: String,
    val type: SyncOperationType,
    val entityId: String,
    val payloadJson: String,
    val timestamp: Long = System.currentTimeMillis(),
    val retryCount: Int = 0
)

enum class SyncOperationType {
    ADD_LIKE,
    REMOVE_LIKE,
    CREATE_PLAYLIST,
    UPDATE_PLAYLIST,
    DELETE_PLAYLIST,
    ADD_PLAYLIST_ITEM,
    REMOVE_PLAYLIST_ITEM,
    UPDATE_PREFERENCES,
    SYNC_HISTORY_SNAPSHOT
}

/**
 * Detailed report returned upon migrating guest data into an authenticated cloud account.
 */
data class GuestMigrationResult(
    val likesMigrated: Int = 0,
    val playlistsMigrated: Int = 0,
    val preferencesMigrated: Boolean = false,
    val historyRecordsMigrated: Int = 0,
    val isSuccess: Boolean = true,
    val message: String = "All local data successfully synchronized to your CyberPulse account"
)
