import { Module } from '@nestjs/common';
import { CaloriesController } from './calories.controller';
import { CaloriesService } from './calories.service';

@Module({
  controllers: [CaloriesController],
  providers: [CaloriesService],
})
export class CaloriesModule {}
