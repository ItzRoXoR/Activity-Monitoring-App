package com.app.fitness.service

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import androidx.core.app.NotificationCompat
import androidx.core.content.getSystemService
import androidx.work.*
import com.app.fitness.*
import com.app.fitness.http.DtoMapper.toDomain
import com.app.fitness.http.FitnessApiClient
import com.app.fitness.workers.GoalReminderWorkerImpl
import com.app.fitness.workers.WeightReminderWorkerImpl
import java.time.Duration
import java.time.LocalDateTime
import java.time.LocalTime
import java.util.concurrent.TimeUnit

/**
 * Implementation of [LocalNotificationService].
 *
 * Scheduling uses WorkManager; notification posting uses
 * [NotificationCompat] + [NotificationManager].
 *
 * Call [createNotificationChannels] once at app startup (e.g. in
 * `Application.onCreate`) before any notifications are posted.
 */
class LocalNotificationServiceImpl internal constructor(
    private val context: Context,
    private val client: FitnessApiClient
) : LocalNotificationService {

    private val api get() = client.service

    // ── Channel setup ─────────────────────────────────────────────────────────

    fun createNotificationChannels() {
        val nm = context.getSystemService<NotificationManager>() ?: return
        nm.createNotificationChannel(
            NotificationChannel(
                GoalReminderWorkerImpl.CHANNEL_ID,
                "Goal Reminders",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply { description = "Reminds you when daily fitness goals are not yet met" }
        )
        nm.createNotificationChannel(
            NotificationChannel(
                WeightReminderWorkerImpl.CHANNEL_ID,
                "Weight Reminders",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply { description = "Daily morning reminder to log your weight" }
        )
        nm.createNotificationChannel(
            NotificationChannel(
                GOAL_ACHIEVED_CHANNEL_ID,
                "Achievements",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply { description = "Notifications for completed daily goals" }
        )
    }

    // ── LocalNotificationService ──────────────────────────────────────────────

    override fun scheduleGoalReminderWorker() {
        // Fire at 20:00 (4 h before midnight)
        val delay = delayUntilTime(targetHour = 20, targetMinute = 0)
        val request = OneTimeWorkRequestBuilder<GoalReminderWorkerImpl>()
            .setInitialDelay(delay, TimeUnit.MILLISECONDS)
            .setConstraints(networkConstraints())
            .build()
        WorkManager.getInstance(context)
            .enqueueUniqueWork(
                GoalReminderWorkerImpl.WORK_NAME,
                ExistingWorkPolicy.REPLACE,
                request
            )
    }

    override fun postGoalAchievedNotification() {
        val nm = context.getSystemService<NotificationManager>() ?: return
        val message = "Congratulations! You've achieved your daily fitness goal! 🎉"
        val notification = NotificationCompat.Builder(context, GOAL_ACHIEVED_CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle("Goal Achieved!")
            .setContentText(message)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setAutoCancel(true)
            .build()
        nm.notify(GOAL_ACHIEVED_NOTIFICATION_ID, notification)
    }

    override fun scheduleDailyWeightReminderWorker() {
        // Fire at 08:00 daily
        val initialDelay = delayUntilTime(targetHour = 8, targetMinute = 0)
        val request = PeriodicWorkRequestBuilder<WeightReminderWorkerImpl>(
            repeatInterval = 24,
            repeatIntervalTimeUnit = TimeUnit.HOURS
        )
            .setInitialDelay(initialDelay, TimeUnit.MILLISECONDS)
            .build()
        WorkManager.getInstance(context)
            .enqueueUniquePeriodicWork(
                WeightReminderWorkerImpl.WORK_NAME,
                ExistingPeriodicWorkPolicy.KEEP,
                request
            )
    }

    override suspend fun getPendingNotifications(): List<AppNotification> {
        val resp = api.getNotifications()
        if (!resp.isSuccessful) return emptyList()
        return (resp.body() ?: emptyList()).map { it.toDomain() }
    }

    override suspend fun markNotificationRead(notificationId: String) {
        try {
            api.markNotificationRead(notificationId)
        } catch (_: Exception) {}
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private fun delayUntilTime(targetHour: Int, targetMinute: Int): Long {
        val now    = LocalDateTime.now()
        var target = now.toLocalDate().atTime(LocalTime.of(targetHour, targetMinute))
        if (!now.isBefore(target)) target = target.plusDays(1)
        return Duration.between(now, target).toMillis().coerceAtLeast(0)
    }

    private fun networkConstraints() = Constraints.Builder()
        .setRequiredNetworkType(NetworkType.CONNECTED)
        .build()

    companion object {
        const val GOAL_ACHIEVED_CHANNEL_ID      = "fitness_achievement_channel"
        const val GOAL_ACHIEVED_NOTIFICATION_ID = 1003
    }
}
