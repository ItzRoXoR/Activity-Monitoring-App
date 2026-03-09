package com.example.viewmodels.data.network.dto

import com.google.gson.annotations.SerializedName

data class UserDto(
    val id: String,
    val name: String,
    val username: String,
    val weight: Float,
    val height: Float,
    @SerializedName("dailyStepsGoal")    val dailyStepsGoal: Int,
    @SerializedName("dailyCaloriesGoal") val dailyCaloriesGoal: Int
)

data class DailyActivityDto(
    val steps: Int,
    val dailyStepsGoal: Int,
    val burnedCalories: Float,
    val distance: Float
)

data class WorkoutSessionDto(
    val id: String,
    val workoutID: String,
    val startedAt: String,
    val finishedAt: String,
    val burnedCalories: Float,
    val completedEarly: Boolean
)

data class CompleteSessionRequest(
    val burnedCalories: Float,
    val finishedAt: String
)

data class LoginRequest(
    val username: String,
    val password: String
)

data class RegisterRequest(
    val name: String,
    val username: String,
    val password: String,
    val weight: Float,
    val height: Float,
    val dailyStepsGoal: Int,
    val dailyCaloriesGoal: Int
)