import { IsString, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

// -- start a workout session --

export class StartSessionDto {
  @IsUUID()
  workoutId: string;
}

// -- complete a session --

export class CompleteSessionDto {
  @IsNumber() @Min(0)
  burnedCalories: number;

  @IsOptional() @IsString()
  finishedAt?: string;
}
