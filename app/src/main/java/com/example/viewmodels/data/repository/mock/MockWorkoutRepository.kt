package com.example.viewmodels.data.repository.mock

import com.example.viewmodels.data.model.Workout
import com.example.viewmodels.data.repository.WorkoutRepository
import kotlinx.coroutines.delay

class MockWorkoutRepository : WorkoutRepository {

    override suspend fun startWorkout(type: String): Result<Workout> {
        delay(500)
        return Result.success(
            Workout(
                id = "mock-workout-${System.currentTimeMillis()}",
                type = type,
                duration = 0L,
                calories = 0f
            )
        )
    }

    override suspend fun stopWorkout(): Result<Workout> {
        delay(500)
        return Result.success(
            Workout(
                id = "mock-workout-finished",
                type = "Running",
                duration = 1800L,   // 30 minutes
                calories = 320f
            )
        )
    }
}