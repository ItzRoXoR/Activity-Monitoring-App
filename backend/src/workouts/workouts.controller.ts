import {
  Controller, Get, Post, Body, Param, Req, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { WorkoutsService } from './workouts.service';
import { WorkoutFilterDto } from './workouts.dto';

@Controller('workouts')
export class WorkoutsController {
  constructor(private workoutsService: WorkoutsService) {}

  // public — no auth required for browsing workouts
  @Get()
  async getAll(@Req() req: any) {
    return this.workoutsService.getAll(req.userId);
  }

  @Get('recommended')
  async getRecommended() {
    return this.workoutsService.getRecommended();
  }

  @Get('favorites')
  @UseGuards(AuthGuard)
  async getFavorites(@Req() req: any) {
    return this.workoutsService.getFavorites(req.userId);
  }

  @Get('favorites/preview')
  @UseGuards(AuthGuard)
  async getFavoritesPreview(@Req() req: any) {
    return this.workoutsService.getFavoritesPreview(req.userId);
  }

  @Post('filter')
  async filter(@Body() dto: WorkoutFilterDto) {
    return this.workoutsService.filter(dto);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.workoutsService.getById(id);
  }

  @Post(':id/favorite')
  @UseGuards(AuthGuard)
  async toggleFavorite(@Req() req: any, @Param('id') id: string) {
    return this.workoutsService.toggleFavorite(req.userId, id);
  }
}
