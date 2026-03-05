package com.app.fitness.http.dto

import com.google.gson.annotations.SerializedName

// ── Auth ──────────────────────────────────────────────────────────────────────

data class LoginRequest(
    val username: String,
    val password: String
)

data class RegisterRequest(
    val name: String,
    val username: String,
    val password: String,
    val gender: String,
    val dateOfBirth: String,
    val weightKg: Float,
    val heightCm: Float,
    val dailyStepsGoal: Int,
    val dailyCaloriesGoal: Int
)

data class AuthResponse(
    val token: String,
    val user: UserDto
)

// ── User ──────────────────────────────────────────────────────────────────────

data class UserDto(
    val id: String,
    val name: String,
    val username: String,
    val gender: String,
    val dateOfBirth: String,
    val weightKg: Float,
    val heightCm: Float,
    val dailyStepsGoal: Int,
    val dailyCaloriesGoal: Int,
    val doNotDisturbUntil: String?,
    val doNotDisturbPermanently: Boolean
)

data class UpdateProfileRequest(
    val gender: String? = null,
    val dateOfBirth: String? = null,
    val weightKg: Float? = null,
    val heightCm: Float? = null,
    val username: String? = null,
    val password: String? = null
)

data class UpdateGoalsRequest(
    val stepsGoal: Int,
    val caloriesGoal: Int
)

data class SetDndRequest(val duration: String)

// ── Activity ──────────────────────────────────────────────────────────────────

data class DailyActivityDto(
    val date: String,
    val steps: Int,
    val burnedCalories: Double,
    val distanceKm: Double
)

data class SaveStepsRequest(
    val totalStepsSinceBoot: Int,
    val timestamp: String
)

data class AddCaloriesRequest(
    val calories: Double,
    val timestamp: String? = null
)

// ── Weight ────────────────────────────────────────────────────────────────────

data class WeightEntryDto(
    val date: String,
    val weightKg: Float
)

data class LogWeightRequest(
    val weightKg: Float,
    val date: String? = null
)

// ── Workout ───────────────────────────────────────────────────────────────────

data class ExerciseDto(
    val id: String,
    val title: String,
    val muscleGroup: String,
    val met: Double,
    val durationSeconds: Int,
    val restAfterSeconds: Int,
    val imageResId: Int?
)

data class WorkoutDto(
    val id: String,
    val title: String,
    val type: String,
    val difficulty: String,
    val durationMinutes: Int,
    val exercises: List<ExerciseDto>,
    val isFavorite: Boolean
)

data class WorkoutFilterRequest(
    val types: List<String> = emptyList(),
    val muscleGroups: List<String> = emptyList(),
    val difficulties: List<String> = emptyList(),
    val durations: List<String> = emptyList()
)

data class ToggleFavoriteResponse(val isFavorite: Boolean)

// ── Session ───────────────────────────────────────────────────────────────────

data class StartSessionRequest(val workoutId: String)

data class CompleteSessionRequest(
    val burnedCalories: Double,
    val finishedAt: String? = null
)

data class WorkoutSessionDto(
    val id: String,
    val workoutId: String,
    val startedAt: String,
    val finishedAt: String?,
    val burnedCalories: Double,
    val completedEarly: Boolean
)

// ── Statistics ────────────────────────────────────────────────────────────────

data class ChartDataPointDto(
    val label: String,
    val value: Double
)

data class StatsDataDto(
    val points: List<ChartDataPointDto>,
    val averagePerDay: Double?
)

data class BmiResultDto(
    val bmi: Double,
    val category: String
)

// ── Notifications ─────────────────────────────────────────────────────────────

data class NotificationDto(
    val id: String,
    val type: String,
    val message: String,
    val createdAt: String,
    val isRead: Boolean
)

data class NotificationActionResponse(
    val posted: Boolean,
    val message: String? = null,
    val reason: String? = null
)
