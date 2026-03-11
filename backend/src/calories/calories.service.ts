import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class CaloriesService {
  constructor(private db: DatabaseService) {}

  // calculate calories burned for a single exercise
  calculateExercise(met: number, weightKg: number, durationSeconds: number) {
    const durationHours = durationSeconds / 3600;
    const calories = met * weightKg * durationHours;
    const rounded = Math.round(calories * 100) / 100;
    return { calories: rounded };
  }

  // calculate total calories for all exercises in a workout
  async calculateWorkout(workoutId: string, weightKg: number) {
    const result = await this.db.query(
      `SELECT e.met, e.duration_seconds FROM exercises e
       JOIN workout_exercises we ON we.exercise_id = e.id
       WHERE we.workout_id = $1`,
      [workoutId],
    );

    const noExercises = result.rowCount === 0;
    if (noExercises) {
      throw new NotFoundException('workout not found or has no exercises');
    }

    let total = 0;
    for (const exercise of result.rows) {
      const durationHours = exercise.duration_seconds / 3600;
      total += exercise.met * weightKg * durationHours;
    }

    const rounded = Math.round(total * 100) / 100;
    return { calories: rounded };
  }

  // estimate calories and distance from step count
  calculateSteps(steps: number, weightKg: number, heightCm: number) {
    // rough calorie formula scaled by body weight
    const calories = steps * 0.04 * (weightKg / 70);
    const roundedCalories = Math.round(calories * 100) / 100;

    // stride is about 41.5% of height
    const strideMeters = (heightCm * 0.415) / 100;
    const distanceKm = (steps * strideMeters) / 1000;
    const roundedDistance = Math.round(distanceKm * 1000) / 1000;

    return { calories: roundedCalories, distanceKm: roundedDistance };
  }
}
