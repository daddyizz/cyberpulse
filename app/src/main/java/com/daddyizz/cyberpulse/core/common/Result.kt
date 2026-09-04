package com.daddyizz.cyberpulse.core.common

/**
 * Standard generic Result sealed interface representing asynchronous UI operations.
 */
sealed interface AppResult<out T> {
    data class Success<T>(val data: T) : AppResult<T>
    data class Error(val exception: Throwable? = null, val message: String = "") : AppResult<Nothing>
    data object Loading : AppResult<Nothing>
}
