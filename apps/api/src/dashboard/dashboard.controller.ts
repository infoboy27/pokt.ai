import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { MockAuthGuard } from '../auth/mock-auth.guard';

@ApiTags('dashboard')
@Controller('dashboard')
// @UseGuards(MockAuthGuard) // Temporarily disabled for testing
// @ApiBearerAuth()
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard stats retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getDashboardStats(@Request() req) {
    // Get the orgId from the authenticated user's context or header
    const orgId = req.headers['x-organization-id'] || req.user?.orgId || 'org-1';
    
    return this.dashboardService.getDashboardStats(orgId);
  }

  @Get('usage-chart')
  @ApiOperation({ summary: 'Get usage chart data' })
  @ApiResponse({ status: 200, description: 'Usage chart data retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUsageChartData(
    @Request() req,
    @Query('days') days?: string,
  ) {
    // Get the orgId from the authenticated user's context or header
    const orgId = req.headers['x-organization-id'] || req.user?.orgId || 'org-1';
    const daysCount = days ? parseInt(days) : 30;
    
    return this.dashboardService.getUsageChartData(orgId, daysCount);
  }
}
