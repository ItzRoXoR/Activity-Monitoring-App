package com.app.fitness.http

import com.app.fitness.CalorieCalculatorService
import com.app.fitness.Exercise
import com.app.fitness.Workout

/**
 * Pure-computation implementation of [CalorieCalculatorService].
 * No network calls — all calculations are performed locally.
 *
 * Formulas:
 *  - Exercise calories: MET × weightKg × (durationSeconds / 3600.0)
 *  - Workout calories:  sum of all exercise calories
 *  - Step calories:     steps × 0.04 × (weightKg / 70)
 *  - Step distance:     steps × strideLength (m) / 1000  where stride = heightCm × 0.415 / 100
 */
class CalorieCalculatorServiceImpl : CalorieCalculatorService {

    override fun calculateExerciseCalories(
        met: Double,
        weightKg: Float,
        durationSeconds: Int
    ): Double = met * weightKg * (durationSeconds / 3600.0)

    override fun calculateWorkoutCalories(workout: Workout, weightKg: Float): Double =
        workout.exercises.sumOf { ex ->
            calculateExerciseCalories(ex.met, weightKg, ex.durationSeconds)
        }

    override fun calculateCaloriesFromSteps(steps: Int, weightKg: Float, heightCm: Float): Double =
        steps * 0.04 * (weightKg / 70.0)

    override fun calculateDistanceFromSteps(steps: Int, heightCm: Float): Double {
        val strideLengthM = (heightCm * 0.415) / 100.0
        return (steps * strideLengthM) / 1000.0
    }
}
