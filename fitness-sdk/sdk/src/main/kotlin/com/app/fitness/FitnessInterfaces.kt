package com.app.fitness

import android.app.NotificationManager
import android.content.Context
import androidx.work.ListenableWorker
import kotlinx.coroutines.flow.Flow
import java.time.LocalDate
import java.time.LocalDateTime

// ─────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────

enum class Gender { MALE, FEMALE }

enum class WorkoutType { STRENGTH, CARDIO, STRETCHING, YOGA, HIIT }

enum class MuscleGroup { CHEST, BACK, ARMS, ABS, GLUTES, LEGS, FULL_BODY }

enum class DifficultyLevel { EASY, MEDIUM, HARD }

enum class DurationRange(val minMinutes: Int, val maxMinutes: Int) {
    SHORT(5, 10),
    MEDIUM(10, 15),
    LONG(15, 20),
    EXTENDED(20, Int.MAX_VALUE)
}

enum class DoNotDisturbDuration { ONE_DAY, ONE_WEEK, ONE_MONTH, PERMANENTLY }

enum class StatsPeriod { DAY, WEEK, MONTH }

enum class BmiCategory { UNDERWEIGHT, NORMAL, OVERWEIGHT, OBESE }

enum class NotificationType {
    GOAL_NOT_ACHIEVED,
    GOAL_ACHIEVED,
    WEIGHT_REMINDER
}

// ─────────────────────────────────────────────
// DOMAIN MODELS
// ─────────────────────────────────────────────

data class User(
    val id: String,
    val name: String,
    val username: String,
    val gender: Gender,
    val dateOfBirth: LocalDate,
    val weightKg: Float,
    val heightCm: Float,
    val dailyStepsGoal: Int,
    val dailyCaloriesGoal: Int,
    val doNotDisturbUntil: LocalDateTime? = null,
    val doNotDisturbPermanently: Boolean = false
)

data class Exercise(
    val id: String,
    val title: String,
    val muscleGroup: MuscleGroup,
    val met: Double,
    val durationSeconds: Int,
    val restAfterSeconds: Int = 0,
    val imageResId: Int? = null
)

data class Workout(
    val id: String,
    val title: String,
    val type: WorkoutType,
    val difficulty: DifficultyLevel,
    val durationMinutes: Int,
    val exercises: List<Exercise>,
    val isFavorite: Boolean = false
)

data class DailyActivity(
    val date: LocalDate,
    val steps: Int,
    val burnedCalories: Double,
    val distanceKm: Double
)

data class WeightEntry(
    val date: LocalDate,
    val weightKg: Float
)

data class WorkoutSession(
    val id: String,
    val workoutId: String,
    val startedAt: LocalDateTime,
    val finishedAt: LocalDateTime?,
    val burnedCalories: Double,
    val completedEarly: Boolean
)

data class WorkoutFilter(
    val types: Set<WorkoutType> = emptySet(),
    val muscleGroups: Set<MuscleGroup> = emptySet(),
    val difficulties: Set<DifficultyLevel> = emptySet(),
    val durations: Set<DurationRange> = emptySet()
) {
    val isEmpty: Boolean
        get() = types.isEmpty() && muscleGroups.isEmpty() &&
                difficulties.isEmpty() && durations.isEmpty()
}

data class ChartDataPoint(
    val label: String,
    val value: Double
)

data class StatsData(
    val points: List<ChartDataPoint>,
    val averagePerDay: Double?
)

data class BmiResult(
    val bmi: Double,
    val category: BmiCategory
)

data class AppNotification(
    val id: String,
    val type: NotificationType,
    val message: String,
    val createdAt: LocalDateTime,
    val isRead: Boolean = false
)

// ─────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────

interface AuthRepository {
    suspend fun isAuthenticated(): Boolean
    suspend fun login(username: String, password: String): Result<User>
    suspend fun register(
        name: String,
        username: String,
        password: String,
        gender: Gender,
        dateOfBirth: LocalDate,
        weightKg: Float,
        heightCm: Float,
        dailyStepsGoal: Int,
        dailyCaloriesGoal: Int
    ): Result<User>
    suspend fun logout()
}

// ─────────────────────────────────────────────
// USER / PROFILE
// ─────────────────────────────────────────────

interface UserRepository {
    suspend fun getCurrentUser(): User
    suspend fun updateProfile(
        gender: Gender? = null,
        dateOfBirth: LocalDate? = null,
        weightKg: Float? = null,
        heightCm: Float? = null,
        username: String? = null,
        password: String? = null
    ): Result<User>
    suspend fun updateDailyGoals(stepsGoal: Int, caloriesGoal: Int): Result<User>
    suspend fun setDoNotDisturb(duration: DoNotDisturbDuration): Result<Unit>
    suspend fun clearDoNotDisturb(): Result<Unit>
}

// ─────────────────────────────────────────────
// ACTIVITY
// ─────────────────────────────────────────────

interface ActivityRepository {
    /** Returns today's accumulated activity from local Room database. */
    suspend fun getTodayActivity(): DailyActivity

    /** Returns activity records for the given period from local Room database. */
    suspend fun getActivityHistory(period: StatsPeriod): List<DailyActivity>

    /**
     * Persists the current step total to the local Room database.
     * Called exclusively by [StepCounterService] on every sensor event.
     * [totalStepsSinceBoot] is the raw value from Sensor.TYPE_STEP_COUNTER;
     * the implementation stores the boot-time baseline on first call each day
     * and computes the daily delta on every subsequent call.
     */
    suspend fun saveSteps(totalStepsSinceBoot: Int, timestamp: LocalDateTime)

    /**
     * Uploads today's accumulated step count to the remote backend.
     * Called by [StepUploadWorker]; not called directly by the UI.
     */
    suspend fun uploadStepsToBackend(date: LocalDate): Result<Unit>

    /** Adds calories from a completed workout session to today's local record. */
    suspend fun addBurnedCalories(calories: Double, timestamp: LocalDateTime)
}

// ─────────────────────────────────────────────
// WEIGHT
// ─────────────────────────────────────────────

interface WeightRepository {
    suspend fun logWeight(weightKg: Float, date: LocalDate = LocalDate.now()): Result<WeightEntry>
    suspend fun getWeightHistory(period: StatsPeriod): List<WeightEntry>
    suspend fun getLatestWeight(): WeightEntry?
}

// ─────────────────────────────────────────────
// WORKOUTS
// ─────────────────────────────────────────────

interface WorkoutRepository {
    suspend fun getAllWorkouts(): List<Workout>
    suspend fun getRecommendedWorkouts(): List<Workout>
    suspend fun getFavoriteWorkoutsPreview(): List<Workout>
    suspend fun getAllFavoriteWorkouts(): List<Workout>
    suspend fun applyFilter(filter: WorkoutFilter): List<Workout>
    suspend fun getWorkoutById(id: String): Workout?
    suspend fun toggleFavorite(workoutId: String): Result<Boolean>
}

// ─────────────────────────────────────────────
// WORKOUT SESSION
// ─────────────────────────────────────────────

interface WorkoutSessionRepository {
    suspend fun startSession(workoutId: String): WorkoutSession
    suspend fun completeSession(
        sessionId: String,
        burnedCalories: Double,
        finishedAt: LocalDateTime = LocalDateTime.now()
    ): Result<WorkoutSession>
    suspend fun abandonSession(
        sessionId: String,
        finishedAt: LocalDateTime = LocalDateTime.now()
    ): Result<WorkoutSession>
}

// ─────────────────────────────────────────────
// STATISTICS
// ─────────────────────────────────────────────

interface StatisticsService {
    suspend fun getStepsStats(period: StatsPeriod): StatsData
    suspend fun getCaloriesStats(period: StatsPeriod): StatsData
    suspend fun getWeightStats(period: StatsPeriod): StatsData
    suspend fun getDistanceStats(period: StatsPeriod): StatsData
    suspend fun calculateBmi(): BmiResult
}

// ─────────────────────────────────────────────
// CALORIE CALCULATION
// ─────────────────────────────────────────────

interface CalorieCalculatorService {
    /** calories = MET × weightKg × (durationSeconds / 3600.0) */
    fun calculateExerciseCalories(met: Double, weightKg: Float, durationSeconds: Int): Double
    fun calculateWorkoutCalories(workout: Workout, weightKg: Float): Double
    fun calculateCaloriesFromSteps(steps: Int, weightKg: Float, heightCm: Float): Double
    fun calculateDistanceFromSteps(steps: Int, heightCm: Float): Double
}

// ─────────────────────────────────────────────
// STEP COUNTER SERVICE  (Android Foreground Service)
// ─────────────────────────────────────────────

/**
 * Implemented as an Android foreground Service.
 *
 * On [startTracking], registers a SensorEventListener for
 * Sensor.TYPE_STEP_COUNTER via SensorManager. This sensor is hardware-based,
 * low-power, and returns a single integer that increments monotonically since
 * the last device reboot — it never resets at midnight on its own.
 *
 * The implementation must:
 *  - Call startForeground() immediately with a persistent notification so the
 *    OS does not kill the process while the screen is off (required API 26+).
 *  - On the first sensor event of each calendar day, record the current sensor
 *    value as the day's baseline in the local Room database.
 *  - On every subsequent event, compute delta = currentValue - baseline and
 *    call [ActivityRepository.saveSteps] with the raw sensor value so the
 *    repository can maintain the baseline and emit the daily delta.
 *  - Expose [stepFlow] so the home screen can observe today's step count
 *    reactively without polling.
 *
 * Step upload to the backend is NOT done here — it is delegated to
 * [StepUploadWorker] so upload survives process death independently.
 */
interface StepCounterService {
    fun startTracking()
    fun stopTracking()

    /**
     * Emits today's running step total each time the sensor fires.
     * Cold Flow — only active while collected.
     */
    val stepFlow: Flow<Int>
}

// ─────────────────────────────────────────────
// STEP UPLOAD WORKER  (WorkManager CoroutineWorker)
// ─────────────────────────────────────────────

/**
 * Uploads the locally stored daily step count to the remote backend.
 *
 * Enqueued by the app in two ways:
 *  1. As a PeriodicWorkRequest every 15 minutes (WorkManager minimum interval)
 *     to keep the backend roughly in sync while the app is alive.
 *  2. As a one-time WorkRequest whenever the app moves to the background,
 *     ensuring a final upload before the process may be suspended.
 *
 * WorkManager handles retries automatically via exponential back-off on
 * network failure, and re-enqueues the work after device reboot.
 *
 * doWork() calls [ActivityRepository.uploadStepsToBackend] for today's date
 * and returns Result.success() or Result.retry() accordingly.
 */
interface StepUploadWorker {
    suspend fun doWork(): ListenableWorker.Result
}

// ─────────────────────────────────────────────
// LOCAL NOTIFICATION SERVICE
// ─────────────────────────────────────────────

/**
 * All notifications in this app are LOCAL — generated entirely on-device
 * with no server involvement and no FCM dependency.
 *
 * Notification posting uses NotificationCompat.Builder + NotificationManager.
 * A notification channel must be created once on app startup (required API 26+).
 *
 * Scheduling uses WorkManager rather than AlarmManager because WorkManager:
 *  - Survives process death and device reboot automatically.
 *  - Respects Doze mode and battery optimisation.
 *  - Supports constraints (e.g. network availability for the upload worker).
 *
 * The Do Not Disturb check is performed inside each worker at execution time
 * by reading the current User from [UserRepository] before posting.
 */
interface LocalNotificationService {

    /**
     * Enqueues a one-time WorkManager worker with a delay calculated so it
     * fires approximately 4 hours before midnight (i.e. at 20:00).
     * The worker reads today's activity at execution time and posts a
     * notification only if the goal is still unmet.
     * Should be re-enqueued once per day (e.g. just after midnight).
     * Uses a unique work name so duplicate calls are safely ignored by WorkManager.
     */
    fun scheduleGoalReminderWorker()

    /**
     * Posts a "goal achieved" notification immediately via NotificationManager.
     * Called from the home screen ViewModel as soon as the step/calorie
     * threshold is crossed, so no scheduling is needed.
     */
    fun postGoalAchievedNotification()

    /**
     * Enqueues a PeriodicWorkRequest that fires daily at approximately 08:00.
     * The initial delay is computed from the current time to the next 08:00.
     * Safe to call on every app start — WorkManager deduplicates by unique
     * work name (KEEP existing policy).
     */
    fun scheduleDailyWeightReminderWorker()

    /** Returns all unread notification records from local Room database. */
    suspend fun getPendingNotifications(): List<AppNotification>

    /** Marks a notification record as read in the local Room database. */
    suspend fun markNotificationRead(notificationId: String)
}

// ─────────────────────────────────────────────
// GOAL REMINDER WORKER  (WorkManager CoroutineWorker)
// ─────────────────────────────────────────────

/**
 * Executed by WorkManager ~4 hours before midnight each day.
 *
 * doWork() steps:
 *  1. Fetch today's [DailyActivity] from [ActivityRepository].
 *  2. Fetch the current [User] from [UserRepository] to read goal values
 *     and check Do Not Disturb state.
 *  3. If DnD is active → return Result.success() without posting.
 *  4. If both goals are already met → return Result.success() without posting.
 *  5. Build a Notification with NotificationCompat.Builder describing which
 *     goal(s) are unmet and post via NotificationManager.
 *  6. Persist an [AppNotification] record to the local Room database so the
 *     in-app notification modal can display it.
 */
interface GoalReminderWorker {
    suspend fun doWork(): ListenableWorker.Result
}

// ─────────────────────────────────────────────
// WEIGHT REMINDER WORKER  (WorkManager CoroutineWorker)
// ─────────────────────────────────────────────

/**
 * Executed by WorkManager once daily at approximately 08:00.
 *
 * doWork() steps:
 *  1. Fetch the current [User] from [UserRepository] to check DnD state.
 *  2. If DnD is active → return Result.success() without posting.
 *  3. Build and post an "enter today's weight" Notification via
 *     NotificationManager.
 *  4. Persist an [AppNotification] record to the local Room database.
 */
interface WeightReminderWorker {
    suspend fun doWork(): ListenableWorker.Result
}
