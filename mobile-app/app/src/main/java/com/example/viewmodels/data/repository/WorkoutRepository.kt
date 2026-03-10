package com.example.viewmodels.data.repository

import com.example.viewmodels.data.model.Workout

interface WorkoutRepository {
    suspend fun startWorkout(type: String): Result<Workout>
    suspend fun stopWorkout(): Result<Workout>
}