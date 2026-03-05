package com.app.fitness.workers

import android.content.Context
import androidx.work.ListenableWorker
import androidx.work.WorkerFactory
import androidx.work.WorkerParameters
import com.app.fitness.ActivityRepository
import com.app.fitness.LocalNotificationService
import com.app.fitness.UserRepository

/**
 * Custom [WorkerFactory] that injects repository dependencies into
 * [StepUploadWorkerImpl], [GoalReminderWorkerImpl], and [WeightReminderWorkerImpl].
 *
 * ## Setup (required)
 *
 * 1. Disable WorkManager's default initialiser in `AndroidManifest.xml`:
 *    ```xml
 *    <provider
 *        android:name="androidx.startup.InitializationProvider"
 *        android:authorities="${applicationId}.androidx-startup"
 *        tools:node="merge">
 *        <meta-data
 *            android:name="androidx.work.WorkManagerInitializer"
 *            android:value="@null" />
 *    </provider>
 *    ```
 *
 * 2. Initialize WorkManager manually (e.g. in `Application.onCreate`):
 *    ```kotlin
 *    val config = Configuration.Builder()
 *        .setWorkerFactory(FitnessWorkerFactory(sdk))
 *        .build()
 *    WorkManager.initialize(this, config)
 *    ```
 *
 * If you already use a WorkerFactory in your app, delegate to
 * [FitnessWorkerFactory] from your existing factory:
 * ```kotlin
 * override fun createWorker(...) =
 *     fitnessWorkerFactory.createWorker(ctx, workerClassName, params)
 *         ?: super.createWorker(ctx, workerClassName, params)
 * ```
 */
class FitnessWorkerFactory(
    private val activityRepository: ActivityRepository,
    private val userRepository: UserRepository,
    private val notificationService: LocalNotificationService
) : WorkerFactory() {

    constructor(sdk: com.app.fitness.FitnessSdk) : this(
        activityRepository  = sdk.activity,
        userRepository      = sdk.user,
        notificationService = sdk.notifications
    )

    override fun createWorker(
        appContext: Context,
        workerClassName: String,
        workerParameters: WorkerParameters
    ): ListenableWorker? = when (workerClassName) {
        StepUploadWorkerImpl::class.java.name ->
            StepUploadWorkerImpl(appContext, workerParameters, activityRepository)

        GoalReminderWorkerImpl::class.java.name ->
            GoalReminderWorkerImpl(
                appContext,
                workerParameters,
                activityRepository,
                userRepository,
                notificationService
            )

        WeightReminderWorkerImpl::class.java.name ->
            WeightReminderWorkerImpl(appContext, workerParameters, userRepository)

        else -> null // let WorkManager try the next factory in the chain
    }
}
