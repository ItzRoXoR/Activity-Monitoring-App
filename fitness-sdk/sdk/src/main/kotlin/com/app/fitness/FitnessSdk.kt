package com.app.fitness

import android.content.Context
import com.app.fitness.http.*
import com.app.fitness.service.LocalNotificationServiceImpl
import com.app.fitness.service.StepCounterServiceImpl

/**
 * # FitnessSdk
 *
 * Central entry point for the Fitness backend SDK.
 * Create a single instance (e.g. in your `Application` class or a Hilt module)
 * and inject it wherever repositories are needed.
 *
 * ## Quick start
 *
 * ```kotlin
 * // Application.onCreate or Hilt @Provides
 * val sdk = FitnessSdk(
 *     context    = applicationContext,
 *     baseUrl    = "http://10.0.2.2:3000",  // emulator → localhost
 *     enableLogging = BuildConfig.DEBUG
 * )
 *
 * // Login
 * sdk.auth.login("alex2026", "pass1234")
 *     .onSuccess { user -> /* navigate to home */ }
 *     .onFailure { e -> /* show error */ }
 *
 * // Start step tracking
 * sdk.startStepCounting()
 *
 * // Observe steps in a ViewModel
 * sdk.stepCounterService.stepFlow
 *     .onEach { steps -> _uiState.update { it.copy(steps = steps) } }
 *     .launchIn(viewModelScope)
 *
 * // Schedule daily notifications (call once at app start)
 * sdk.scheduleNotifications()
 * ```
 *
 * @param context     Application context (used for SharedPreferences, WorkManager, sensors).
 * @param baseUrl     Base URL of the Fitness backend, e.g. `"http://10.0.2.2:3000"`.
 * @param enableLogging  Set to `true` in debug builds to log all HTTP traffic to Logcat.
 */
class FitnessSdk(
    private val context: Context,
    baseUrl: String,
    enableLogging: Boolean = false
) {

    // ── Internal API client (shared by all repositories) ─────────────────────

    private val apiClient = FitnessApiClient(
        context = context.applicationContext,
        baseUrl = baseUrl,
        enableLogging = enableLogging
    )

    // ── Public repositories / services ───────────────────────────────────────

    /** Authentication: register, login, logout. */
    val auth: AuthRepository = AuthRepositoryImpl(apiClient)

    /** User profile, daily goals, Do Not Disturb. */
    val user: UserRepository = UserRepositoryImpl(apiClient)

    /**
     * Step tracking, calorie additions, activity history, and backend upload.
     * Used internally by workers; also usable from ViewModels for today's data.
     */
    val activity: ActivityRepository = ActivityRepositoryImpl(apiClient, context.applicationContext)

    /** Weight logging and history. */
    val weight: WeightRepository = WeightRepositoryImpl(apiClient)

    /** Workout browsing, filtering, and favorites. */
    val workouts: WorkoutRepository = WorkoutRepositoryImpl(apiClient)

    /** Workout session lifecycle (start, complete, abandon). */
    val sessions: WorkoutSessionRepository = WorkoutSessionRepositoryImpl(apiClient)

    /** Chart data and BMI calculation. */
    val statistics: StatisticsService = StatisticsServiceImpl(apiClient)

    /**
     * Pure-computation calorie and distance calculator.
     * No network required — all methods are synchronous.
     */
    val calorieCalculator: CalorieCalculatorService = CalorieCalculatorServiceImpl()

    /**
     * Local notification scheduling and retrieval.
     * Call [com.app.fitness.service.LocalNotificationServiceImpl.createNotificationChannels]
     * once in `Application.onCreate` before posting any notifications.
     */
    val notifications: LocalNotificationServiceImpl =
        LocalNotificationServiceImpl(context.applicationContext, apiClient)

    /**
     * Step counter service handle.
     * The underlying [StepCounterServiceImpl] runs as a foreground [android.app.Service].
     * Use [startStepCounting] / [stopStepCounting] to control it.
     * Observe [com.app.fitness.StepCounterService.stepFlow] for live step counts.
     *
     * Note: this object is the service interface — the actual Android Service
     * instance is managed by the OS. If you need the Flow, bind to the service
     * or get a reference via [getStepCounterServiceInstance] after binding.
     */
    val stepCounterService: StepCounterService get() = _stepServiceRef
        ?: throw IllegalStateException(
            "StepCounterServiceImpl not yet bound. Call startStepCounting() first " +
            "and wait for the service to connect, or observe using FitnessSdk.stepFlow."
        )

    // ── Service binding (optional convenience) ────────────────────────────────

    @Volatile private var _stepServiceRef: StepCounterServiceImpl? = null

    /**
     * Starts the [StepCounterServiceImpl] foreground service.
     * Requires `ACTIVITY_RECOGNITION` permission on API 29+.
     */
    fun startStepCounting() {
        StepCounterServiceImpl.start(context.applicationContext)
    }

    /** Stops the [StepCounterServiceImpl] foreground service. */
    fun stopStepCounting() {
        StepCounterServiceImpl.stop(context.applicationContext)
    }

    /**
     * Called by your app's [android.content.ServiceConnection.onServiceConnected]
     * to hand the live service instance to the SDK so [stepCounterService] resolves correctly.
     */
    fun onStepServiceConnected(service: StepCounterServiceImpl) {
        service.activityRepository = activity
        _stepServiceRef = service
    }

    fun onStepServiceDisconnected() {
        _stepServiceRef = null
    }

    // ── Convenience helpers ───────────────────────────────────────────────────

    /**
     * Call once in `Application.onCreate` to:
     * 1. Create notification channels.
     * 2. Schedule the daily weight reminder.
     * 3. Schedule the nightly goal reminder.
     */
    fun scheduleNotifications() {
        notifications.createNotificationChannels()
        notifications.scheduleDailyWeightReminderWorker()
        notifications.scheduleGoalReminderWorker()
    }

    /**
     * Returns `true` if a JWT token is stored locally (does NOT make a network call).
     * For a server-verified check use `auth.isAuthenticated()`.
     */
    val hasStoredToken: Boolean get() = apiClient.tokenStore.token != null
}
