package com.app.fitness.http.dto

// -- auth --

data class LoginRequest(val username: String, val password: String)

data class RegisterRequest(
    val name: String, val username: String, val password: String,
    val gender: String, val dateOfBirth: String,
    val weightKg: Float, val heightCm: Float,
    val dailyStepsGoal: Int, val dailyCaloriesGoal: Int
)

data class AuthResponse(val token: String, val user: UserDto)

// -- user --

data class UserDto(
    val id: String, val name: String, val username: String,
    val gender: String, val dateOfBirth: String,
    val weightKg: Float, val heightCm: Float,
    val dailyStepsGoal: Int, val dailyCaloriesGoal: Int,
    val doNotDisturbUntil: String?, val doNotDisturbPermanently: Boolean
)

data class UpdateProfileRequest(
    val gender: String? = null, val dateOfBirth: String? = null,
    val weightKg: Float? = null, val heightCm: Float? = null,
    val username: String? = null, val password: String? = null
)

data class UpdateGoalsRequest(val stepsGoal: Int, val caloriesGoal: Int)

data class SetDndRequest(val duration: String)

// -- activity --

data class DailyActivityDto(
    val date: String, val steps: Int,
    val burnedCalories: Double, val distanceKm: Double
)

data class SaveStepsRequest(val totalStepsSinceBoot: Int, val timestamp: String)

data class AddCaloriesRequest(val calories: Double, val timestamp: String? = null)

// -- weight --

data class WeightEntryDto(val date: String, val weightKg: Float)

data class LogWeightRequest(val weightKg: Float, val date: String? = null)

// -- workout --

data class ExerciseDto(
    val id: String, val title: String, val muscleGroup: String,
    val met: Double, val durationSeconds: Int, val restAfterSeconds: Int,
    val imageResId: Int?
)

data class WorkoutDto(
    val id: String, val title: String, val type: String,
    val difficulty: String, val durationMinutes: Int,
    val exercises: List<ExerciseDto>, val isFavorite: Boolean
)

data class WorkoutFilterRequest(
    val types: List<String> = emptyList(),
    val muscleGroups: List<String> = emptyList(),
    val difficulties: List<String> = emptyList(),
    val durations: List<String> = emptyList()
)

data class ToggleFavoriteResponse(val isFavorite: Boolean)

// -- session --

data class StartSessionRequest(val workoutId: String)

data class CompleteSessionRequest(
    val burnedCalories: Double, val finishedAt: String? = null
)

data class WorkoutSessionDto(
    val id: String, val workoutId: String,
    val startedAt: String, val finishedAt: String?,
    val burnedCalories: Double, val completedEarly: Boolean
)
