import {
  Controller, Get, Post, Body, Query, Req, UseGuards, HttpCode,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { WeightService } from './weight.service';
import { LogWeightDto } from './weight.dto';

@Controller('weight')
@UseGuards(AuthGuard)
export class WeightController {
  constructor(private weightService: WeightService) {}

  @Post()
  @HttpCode(201)
  async logWeight(@Req() req: any, @Body() dto: LogWeightDto) {
    return this.weightService.logWeight(req.userId, dto.weightKg, dto.date);
  }

  @Get('history')
  async getHistory(@Req() req: any, @Query('period') period: string) {
    const periodValue = period || 'WEEK';
    return this.weightService.getHistory(req.userId, periodValue);
  }

  @Get('latest')
  async getLatest(@Req() req: any) {
    return this.weightService.getLatest(req.userId);
  }
}
