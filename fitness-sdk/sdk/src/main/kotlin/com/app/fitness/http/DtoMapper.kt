package com.app.fitness.http

import com.app.fitness.*
import com.app.fitness.http.dto.*
import java.time.LocalDate
import java.time.LocalDateTime

// maps backend dtos to domain model objects
internal object DtoMapper {

    fun UserDto.toDomain() = User(
        id = id,
        name = name,
        username = username,
        gender = Gender.valueOf(gender),
        dateOfBirth = LocalDate.parse(dateOfBirth.take(10)),
        weightKg = weightKg,
        heightCm = heightCm,
        dailyStepsGoal = dailyStepsGoal,
        dailyCaloriesGoal = dailyCaloriesGoal,
        doNotDisturbUntil = doNotDisturbUntil?.let {
            runCatching { LocalDateTime.parse(it.replace("Z", "").take(19)) }.getOrNull()
        },
        doNotDisturbPermanently = doNotDisturbPermanently
    )

    fun ExerciseDto.toDomain() = Exercise(
        id = id,
        title = title,
        muscleGroup = MuscleGroup.valueOf(muscleGroup),
        met = met,
        durationSeconds = durationSeconds,
        restAfterSeconds = restAfterSeconds,
        imageResId = imageResId
    )

    fun WorkoutDto.toDomain() = Workout(
        id = id,
        title = title,
        type = WorkoutType.valueOf(type),
        difficulty = DifficultyLevel.valueOf(difficulty),
        durationMinutes = durationMinutes,
        exercises = exercises.map { it.toDomain() },
        isFavorite = isFavorite
    )

    fun DailyActivityDto.toDomain() = DailyActivity(
        date = LocalDate.parse(date.take(10)),
        steps = steps,
        burnedCalories = burnedCalories,
        distanceKm = distanceKm
    )

    fun WeightEntryDto.toDomain() = WeightEntry(
        date = LocalDate.parse(date.take(10)),
        weightKg = weightKg
    )

    fun WorkoutSessionDto.toDomain() = WorkoutSession(
        id = id,
        workoutId = workoutId,
        startedAt = LocalDateTime.parse(startedAt.replace("Z", "").take(19)),
        finishedAt = finishedAt?.let {
            runCatching { LocalDateTime.parse(it.replace("Z", "").take(19)) }.getOrNull()
        },
        burnedCalories = burnedCalories,
        completedEarly = completedEarly
    )
}
