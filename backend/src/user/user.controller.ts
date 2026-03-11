import {
  Controller, Get, Patch, Put, Post, Delete,
  Body, Req, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { UserService } from './user.service';
import { UpdateProfileDto, UpdateGoalsDto, SetDndDto } from './user.dto';

@Controller('user')
@UseGuards(AuthGuard)
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  async getProfile(@Req() req: any) {
    return this.userService.getProfile(req.userId);
  }

  @Patch('profile')
  async updateProfile(@Req() req: any, @Body() dto: UpdateProfileDto) {
    return this.userService.updateProfile(req.userId, dto);
  }

  @Put('goals')
  async updateGoals(@Req() req: any, @Body() dto: UpdateGoalsDto) {
    return this.userService.updateGoals(req.userId, dto);
  }

  @Post('dnd')
  async setDnd(@Req() req: any, @Body() dto: SetDndDto) {
    return this.userService.setDnd(req.userId, dto.duration);
  }

  @Delete('dnd')
  async clearDnd(@Req() req: any) {
    return this.userService.clearDnd(req.userId);
  }
}
