package com.app.fitness.workers

import android.content.Context
import androidx.work.*
import com.app.fitness.ActivityRepository
import com.app.fitness.StepUploadWorker
import java.time.LocalDate

/**
 * [WorkManager] [CoroutineWorker] implementation of [StepUploadWorker].
 *
 * Uploads the locally cached daily step count to the remote backend.
 * On network failure WorkManager retries automatically with exponential back-off.
 *
 * ## Registering with WorkManager
 * Register manually via [WorkManager.initialize] with a custom [WorkerFactory]
 * that injects [ActivityRepository].
 *
 * ## Scheduling
 * ```kotlin
 * // Periodic — every 15 min while the app is alive
 * val periodic = PeriodicWorkRequestBuilder<StepUploadWorkerImpl>(15, TimeUnit.MINUTES)
 *     .setConstraints(Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build())
 *     .build()
 * WorkManager.getInstance(context)
 *     .enqueueUniquePeriodicWork("step_upload", ExistingPeriodicWorkPolicy.KEEP, periodic)
 *
 * // One-shot on background
 * val oneTime = OneTimeWorkRequestBuilder<StepUploadWorkerImpl>().build()
 * WorkManager.getInstance(context).enqueue(oneTime)
 * ```
 */
class StepUploadWorkerImpl(
    context: Context,
    params: WorkerParameters,
    private val activityRepository: ActivityRepository
) : CoroutineWorker(context, params), StepUploadWorker {

    override suspend fun doWork(): Result {
        val today = LocalDate.now()
        return activityRepository.uploadStepsToBackend(today).fold(
            onSuccess = { Result.success() },
            onFailure = { Result.retry() }
        )
    }

    companion object {
        const val WORK_NAME_PERIODIC = "fitness_step_upload_periodic"
        const val WORK_NAME_ONE_TIME = "fitness_step_upload_one_time"
    }
}
