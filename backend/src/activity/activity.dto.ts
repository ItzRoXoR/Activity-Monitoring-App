import { IsString, IsInt, IsNumber, IsPositive, IsOptional, Min } from 'class-validator';

// -- save steps from step counter --

export class SaveStepsDto {
  @IsInt() @Min(0)
  totalStepsSinceBoot: number;

  @IsString()
  timestamp: string;
}

// -- add burned calories --

export class AddCaloriesDto {
  @IsNumber() @IsPositive()
  calories: number;

  @IsOptional() @IsString()
  timestamp?: string;
}
