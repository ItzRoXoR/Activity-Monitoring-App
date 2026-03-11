import { IsString, IsArray, IsOptional } from 'class-validator';

export class WorkoutFilterDto {
  @IsOptional() @IsArray() @IsString({ each: true })
  types?: string[];

  @IsOptional() @IsArray() @IsString({ each: true })
  muscleGroups?: string[];

  @IsOptional() @IsArray() @IsString({ each: true })
  difficulties?: string[];

  @IsOptional() @IsArray() @IsString({ each: true })
  durations?: string[];
}
