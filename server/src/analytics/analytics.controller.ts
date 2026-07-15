import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { AnalyticsService } from './analytics.service';
import { ImportMetricsDto } from './dto/import-metrics.dto';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Post('import')
  @Roles(Role.ADMIN, Role.MANAGER)
  importMetrics(@Body() dto: ImportMetricsDto) {
    return this.analytics.importMetrics(dto);
  }

  @Get('overview')
  getOverview(
    @Query('productLineId') productLineId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analytics.getOverview(productLineId, from, to);
  }

  @Get('timeline')
  getTimeline(
    @Query('productLineId') productLineId: string,
    @Query('period') period?: 'day' | 'week' | 'month',
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analytics.getTimeline(productLineId, period, from, to);
  }

  @Get('channels')
  getChannelBreakdown(
    @Query('productLineId') productLineId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analytics.getChannelBreakdown(productLineId, from, to);
  }

  @Get('content')
  getContentPerformance(
    @Query('productLineId') productLineId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analytics.getContentPerformance(productLineId, from, to);
  }

  @Get('ai-cost')
  getAiCostOverview(
    @Query('productLineId') productLineId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analytics.getAiCostOverview(productLineId, from, to);
  }
}
