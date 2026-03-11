import {
  Controller, Get, Query, Param, BadRequestException,
} from '@nestjs/common';
import { CaloriesService } from './calories.service';

@Controller('calories')
export class CaloriesController {
  constructor(private caloriesService: CaloriesService) {}

  // calculate calories for a generic exercise by met value
  @Get('exercise')
  calculateExercise(
    @Query('met') metStr: string,
    @Query('weightKg') weightStr: string,
    @Query('durationSeconds') durationStr: string,
  ) {
    const met = parseFloat(metStr);
    const weightKg = parseFloat(weightStr);
    const durationSeconds = parseInt(durationStr, 10);

    const anyInvalid = isNaN(met) || isNaN(weightKg) || isNaN(durationSeconds);
    if (anyInvalid) {
      throw new BadRequestException('met, weightKg, durationSeconds are required numbers');
    }

    return this.caloriesService.calculateExercise(met, weightKg, durationSeconds);
  }

  // calculate total calories for all exercises in a specific workout
  @Get('workout/:id')
  async calculateWorkout(
    @Param('id') id: string,
    @Query('weightKg') weightStr: string,
  ) {
    const weightKg = parseFloat(weightStr);

    const isInvalid = isNaN(weightKg);
    if (isInvalid) {
      throw new BadRequestException('weightKg query parameter is required');
    }

    return this.caloriesService.calculateWorkout(id, weightKg);
  }

  // estimate calories and distance from a step count
  @Get('steps')
  calculateSteps(
    @Query('steps') stepsStr: string,
    @Query('weightKg') weightStr: string,
    @Query('heightCm') heightStr: string,
  ) {
    const steps = parseInt(stepsStr, 10);
    const weightKg = parseFloat(weightStr);
    const heightCm = parseFloat(heightStr);

    const anyInvalid = isNaN(steps) || isNaN(weightKg) || isNaN(heightCm);
    if (anyInvalid) {
      throw new BadRequestException('steps, weightKg, heightCm are required numbers');
    }

    return this.caloriesService.calculateSteps(steps, weightKg, heightCm);
  }
}
