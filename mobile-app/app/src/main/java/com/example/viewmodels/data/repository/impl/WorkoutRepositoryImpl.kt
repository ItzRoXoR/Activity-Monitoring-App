package com.example.viewmodels.data.repository.impl

import com.example.viewmodels.data.model.Workout
import com.example.viewmodels.data.repository.WorkoutRepository

class WorkoutRepositoryImpl(
    private val sdk: FitnessSdk
) : WorkoutRepository {

    override suspend fun startWorkout(type: String): Result<Workout> {
        return runCatching {
            val sdkWorkout = sdk.workout.start(type)
            Workout(
                id = sdkWorkout.id,
                type = sdkWorkout.type,
                duration = sdkWorkout.durationSeconds,
                calories = sdkWorkout.caloriesBurned
            )
        }
    }

    override suspend fun stopWorkout(): Result<Workout> {
        return runCatching {
            val sdkWorkout = sdk.workout.stop()
            Workout(
                id = sdkWorkout.id,
                type = sdkWorkout.type,
                duration = sdkWorkout.durationSeconds,
                calories = sdkWorkout.caloriesBurned
            )
        }
    }
}