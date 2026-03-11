package com.app.fitness

import androidx.work.ListenableWorker
import kotlinx.coroutines.flow.Flow
import java.time.LocalDate
import java.time.LocalDateTime

// -- enums --

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

// -- domain models --

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

// -- auth --

interface AuthRepository {
    suspend fun isAuthenticated(): Boolean
    suspend fun login(username: String, password: String): Result<User>
    suspend fun register(
        name: String, username: String, password: String,
        gender: Gender, dateOfBirth: LocalDate,
        weightKg: Float, heightCm: Float,
        dailyStepsGoal: Int, dailyCaloriesGoal: Int
    ): Result<User>
    suspend fun logout()
}

// -- user / profile --

interface UserRepository {
    suspend fun getCurrentUser(): User
    suspend fun updateProfile(
        gender: Gender? = null, dateOfBirth: LocalDate? = null,
        weightKg: Float? = null, heightCm: Float? = null,
        username: String? = null, password: String? = null
    ): Result<User>
    suspend fun updateDailyGoals(stepsGoal: Int, caloriesGoal: Int): Result<User>
    suspend fun setDoNotDisturb(duration: DoNotDisturbDuration): Result<Unit>
    suspend fun clearDoNotDisturb(): Result<Unit>
}

// -- activity --

interface ActivityRepository {
    suspend fun getTodayActivity(): DailyActivity
    suspend fun getActivityHistory(period: StatsPeriod): List<DailyActivity>
    suspend fun saveSteps(totalStepsSinceBoot: Int, timestamp: LocalDateTime)
    suspend fun uploadStepsToBackend(date: LocalDate): Result<Unit>
    suspend fun addBurnedCalories(calories: Double, timestamp: LocalDateTime)
}

// -- weight --

interface WeightRepository {
    suspend fun logWeight(weightKg: Float, date: LocalDate = LocalDate.now()): Result<WeightEntry>
    suspend fun getWeightHistory(period: StatsPeriod): List<WeightEntry>
    suspend fun getLatestWeight(): WeightEntry?
}

// -- workouts --

interface WorkoutRepository {
    suspend fun getAllWorkouts(): List<Workout>
    suspend fun getRecommendedWorkouts(): List<Workout>
    suspend fun getFavoriteWorkoutsPreview(): List<Workout>
    suspend fun getAllFavoriteWorkouts(): List<Workout>
    suspend fun applyFilter(filter: WorkoutFilter): List<Workout>
    suspend fun getWorkoutById(id: String): Workout?
    suspend fun toggleFavorite(workoutId: String): Result<Boolean>
}

// -- workout session --

interface WorkoutSessionRepository {
    suspend fun startSession(workoutId: String): WorkoutSession
    suspend fun completeSession(
        sessionId: String, burnedCalories: Double,
        finishedAt: LocalDateTime = LocalDateTime.now()
    ): Result<WorkoutSession>
    suspend fun abandonSession(
        sessionId: String,
        finishedAt: LocalDateTime = LocalDateTime.now()
    ): Result<WorkoutSession>
}

// -- calorie calculation (pure math, no network) --

interface CalorieCalculatorService {
    fun calculateExerciseCalories(met: Double, weightKg: Float, durationSeconds: Int): Double
    fun calculateWorkoutCalories(workout: Workout, weightKg: Float): Double
    fun calculateCaloriesFromSteps(steps: Int, weightKg: Float, heightCm: Float): Double
    fun calculateDistanceFromSteps(steps: Int, heightCm: Float): Double
}

// -- step counter service (foreground service) --

interface StepCounterService {
    fun startTracking()
    fun stopTracking()
    val stepFlow: Flow<Int>
}

// -- step upload worker --

interface StepUploadWorker {
    suspend fun doWork(): ListenableWorker.Result
}
