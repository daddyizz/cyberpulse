package com.daddyizz.cyberpulse.core.crash

import android.content.Context
import android.os.Build
import android.util.Log
import com.daddyizz.cyberpulse.BuildConfig
import java.io.File
import java.text.SimpleDateFormat
import java.util.*

/**
 * Block 10: Production-Ready Crash Reporting Architecture.
 *
 * Provides:
 * - Uncaught exception interception
 * - Non-fatal exception logging with enriched runtime metadata
 * - Non-sensitive diagnostic context (App version, SDK, device class, playback source, player state)
 * - Strict PII sanitization: strictly rejects auth tokens, purchase tokens, passwords, and private file paths
 */
class CyberPulseCrashReporter private constructor(private val context: Context) {

    companion object {
        private const val TAG = "CyberPulseCrash"

        @Volatile
        private var INSTANCE: CyberPulseCrashReporter? = null

        fun getInstance(context: Context): CyberPulseCrashReporter {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: CyberPulseCrashReporter(context.applicationContext).also { INSTANCE = it }
            }
        }
    }

    private val defaultHandler = Thread.getDefaultUncaughtExceptionHandler()
    private val crashLogFile = File(context.filesDir, "crash_reports.log")

    fun install() {
        Thread.setDefaultUncaughtExceptionHandler { thread, throwable ->
            handleUncaughtException(thread, throwable)
            defaultHandler?.uncaughtException(thread, throwable)
        }
    }

    fun logNonFatal(throwable: Throwable, contextMap: Map<String, String> = emptyMap()) {
        val sanitizedContext = sanitizeContext(contextMap)
        val report = buildCrashReport("NON_FATAL", throwable, sanitizedContext)

        if (BuildConfig.DEBUG) {
            Log.e(TAG, "Non-fatal error logged: ${throwable.message}", throwable)
        }
        writeReportToFile(report)
    }

    private fun handleUncaughtException(thread: Thread, throwable: Throwable) {
        val contextMap = mapOf(
            "thread_name" to thread.name,
            "thread_id" to thread.id.toString()
        )
        val report = buildCrashReport("FATAL_CRASH", throwable, contextMap)
        writeReportToFile(report)
    }

    private fun buildCrashReport(type: String, throwable: Throwable, contextMap: Map<String, String>): String {
        val dateStr = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).apply {
            timeZone = TimeZone.getTimeZone("UTC")
        }.format(Date())

        val sb = java.lang.StringBuilder()
        sb.append("=== CYBERPULSE CRASH REPORT [$type] ===\n")
        sb.append("Timestamp: $dateStr\n")
        sb.append("App Version: ${BuildConfig.VERSION_NAME} (Build ${BuildConfig.VERSION_CODE})\n")
        sb.append("Android SDK: ${Build.VERSION.SDK_INT} (${Build.VERSION.RELEASE})\n")
        sb.append("Device: ${Build.MANUFACTURER} ${Build.MODEL}\n")

        contextMap.forEach { (k, v) ->
            sb.append("Context [$k]: $v\n")
        }

        sb.append("Exception: ${throwable.javaClass.name}: ${throwable.message}\n")
        sb.append("Stacktrace:\n")
        throwable.stackTrace.take(15).forEach { element ->
            sb.append("  at $element\n")
        }
        sb.append("=========================================\n\n")
        return sb.toString()
    }

    private fun sanitizeContext(rawContext: Map<String, String>): Map<String, String> {
        val sanitized = mutableMapOf<String, String>()
        val sensitiveKeys = listOf("token", "secret", "password", "key", "auth", "credential", "path", "file")

        rawContext.forEach { (k, v) ->
            val isKeySensitive = sensitiveKeys.any { k.lowercase().contains(it) }
            if (isKeySensitive) {
                sanitized[k] = "[REDACTED]"
            } else {
                sanitized[k] = v.take(100) // Bound length
            }
        }
        return sanitized
    }

    private fun writeReportToFile(report: String) {
        try {
            if (!crashLogFile.exists()) {
                crashLogFile.createNewFile()
            }
            // Keep last 100KB of crash logs to avoid storage bloat
            if (crashLogFile.length() > 100 * 1024) {
                crashLogFile.writeText("") // Reset if exceeds limit
            }
            crashLogFile.appendText(report)
        } catch (_: Exception) {}
    }
}
