package com.example.viewmodels.data.model

data class User(
    val id: String,
    val name: String,
    val email: String,
    val height: Float,
    val weight: Float,
    val dailyStepsGoal: Int    = 10_000,
    val dailyCaloriesGoal: Int = 2_000
)