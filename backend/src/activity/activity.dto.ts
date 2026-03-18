import { IsString, IsInt, Min } from 'class-validator';

// -- save steps from step counter --

export class SaveStepsDto {
  @IsInt() @Min(0)
  totalStepsSinceBoot: number;

  @IsString()
  timestamp: string;
}
