import { IsNumber, IsPositive, IsString, IsOptional } from 'class-validator';

export class LogWeightDto {
  @IsNumber() @IsPositive()
  weightKg: number;

  @IsOptional() @IsString()
  date?: string;
}
