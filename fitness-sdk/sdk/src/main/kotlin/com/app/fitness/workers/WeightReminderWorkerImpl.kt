package com.app.fitness.workers

import android.app.NotificationManager
import android.content.Context
import androidx.core.app.NotificationCompat
import androidx.core.content.getSystemService
import androidx.work.*
import com.app.fitness.*
import java.time.LocalDateTime

/**
 * [CoroutineWorker] implementation of [WeightReminderWorker].
 *
 * Posts a daily morning reminder to log the user's weight.
 * Obeys DnD settings.
 *
 * See [LocalNotificationServiceImpl.scheduleDailyWeightReminderWorker].
 */
class WeightReminderWorkerImpl(
    context: Context,
    params: WorkerParameters,
    private val userRepository: UserRepository
) : CoroutineWorker(context, params), WeightReminderWorker {

    override suspend fun doWork(): Result {
        // 1. DnD check
        val user = runCatching { userRepository.getCurrentUser() }.getOrNull()
            ?: return Result.retry()

        val now = LocalDateTime.now()
        val dndActive = user.doNotDisturbPermanently ||
                (user.doNotDisturbUntil != null && user.doNotDisturbUntil > now)
        if (dndActive) return Result.success()

        // 2. Post notification
        postSystemNotification()
        return Result.success()
    }

    private fun postSystemNotification() {
        val nm = applicationContext.getSystemService<NotificationManager>() ?: return
        val message = "Good morning! Don't forget to log your weight today."
        val notification = NotificationCompat.Builder(applicationContext, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle("Weight Reminder")
            .setContentText(message)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setAutoCancel(true)
            .build()
        nm.notify(NOTIFICATION_ID, notification)
    }

    companion object {
        const val WORK_NAME       = "fitness_weight_reminder"
        const val CHANNEL_ID      = "fitness_weight_channel"
        const val NOTIFICATION_ID = 1002
    }
}
