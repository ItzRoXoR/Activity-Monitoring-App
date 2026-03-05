package com.app.fitness.workers

import android.app.NotificationManager
import android.content.Context
import androidx.core.app.NotificationCompat
import androidx.core.content.getSystemService
import androidx.work.*
import com.app.fitness.*
import java.time.LocalDateTime

/**
 * [CoroutineWorker] implementation of [GoalReminderWorker].
 *
 * Checks today's activity at execution time and posts a local notification
 * only if one or both daily goals are unmet and DnD is inactive.
 *
 * See [LocalNotificationServiceImpl.scheduleGoalReminderWorker] for scheduling.
 */
class GoalReminderWorkerImpl(
    context: Context,
    params: WorkerParameters,
    private val activityRepository: ActivityRepository,
    private val userRepository: UserRepository,
    private val notificationRepository: LocalNotificationService
) : CoroutineWorker(context, params), GoalReminderWorker {

    override suspend fun doWork(): Result {
        // 1. Fetch current user to check goals and DnD
        val user = runCatching { userRepository.getCurrentUser() }.getOrNull()
            ?: return Result.retry()

        // 2. DnD check
        val now = LocalDateTime.now()
        val dndActive = user.doNotDisturbPermanently ||
                (user.doNotDisturbUntil != null && user.doNotDisturbUntil > now)
        if (dndActive) return Result.success()

        // 3. Fetch today's activity
        val activity = runCatching { activityRepository.getTodayActivity() }.getOrNull()
            ?: return Result.retry()

        // 4. Check goals
        val stepsUnmet    = activity.steps < user.dailyStepsGoal
        val caloriesUnmet = activity.burnedCalories < user.dailyCaloriesGoal
        if (!stepsUnmet && !caloriesUnmet) return Result.success()

        // 5. Build message
        val parts = buildList {
            if (stepsUnmet) add("steps (${activity.steps}/${user.dailyStepsGoal})")
            if (caloriesUnmet) add("calories (${activity.burnedCalories.toInt()}/${user.dailyCaloriesGoal})")
        }
        val message = "You haven't achieved your daily ${parts.joinToString(" and ")} goal yet. Keep going!"

        // 6. Post Android system notification
        postSystemNotification(message)

        return Result.success()
    }

    private fun postSystemNotification(message: String) {
        val nm = applicationContext.getSystemService<NotificationManager>() ?: return
        val notification = NotificationCompat.Builder(applicationContext, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle("Daily Goal Reminder")
            .setContentText(message)
            .setStyle(NotificationCompat.BigTextStyle().bigText(message))
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setAutoCancel(true)
            .build()
        nm.notify(NOTIFICATION_ID, notification)
    }

    companion object {
        const val WORK_NAME    = "fitness_goal_reminder"
        const val CHANNEL_ID   = "fitness_goal_channel"
        const val NOTIFICATION_ID = 1001
    }
}
