import {
  Controller, Get, Post, Body, Query, Req, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { ActivityService } from './activity.service';
import { SaveStepsDto, AddCaloriesDto } from './activity.dto';

@Controller('activity')
@UseGuards(AuthGuard)
export class ActivityController {
  constructor(private activityService: ActivityService) {}

  @Get('today')
  async getToday(@Req() req: any) {
    return this.activityService.getTodayActivity(req.userId);
  }

  @Get('history')
  async getHistory(@Req() req: any, @Query('period') period: string) {
    const periodValue = period || 'WEEK';
    return this.activityService.getHistory(req.userId, periodValue);
  }

  // called by the step counter worker to sync steps to backend
  @Post('steps')
  async saveSteps(@Req() req: any, @Body() dto: SaveStepsDto) {
    return this.activityService.saveSteps(
      req.userId,
      dto.totalStepsSinceBoot,
      dto.timestamp,
    );
  }

  // add burned calories from a finished workout
  @Post('calories')
  async addCalories(@Req() req: any, @Body() dto: AddCaloriesDto) {
    return this.activityService.addCalories(
      req.userId,
      dto.calories,
      dto.timestamp,
    );
  }

  // simulate the step upload worker endpoint
  @Post('upload')
  async upload(@Req() req: any) {
    return this.activityService.upload(req.userId);
  }
}
