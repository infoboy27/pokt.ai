import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsageService } from './usage.service';
import { MockAuthGuard } from '../auth/mock-auth.guard';

@ApiTags('usage')
@Controller('usage')
@UseGuards(MockAuthGuard)
@ApiBearerAuth()
export class UsageController {
  constructor(private usageService: UsageService) {}

  @Get('analytics')
  @ApiOperation({ summary: 'Get comprehensive usage analytics' })
  @ApiResponse({ status: 200, description: 'Usage analytics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUsageAnalytics(
    @Request() req,
    @Query('days') days?: string,
    @Query('endpointId') endpointId?: string,
  ) {
    const orgId = req.headers['x-organization-id'] || req.user?.orgId || 'org-1';
    const daysCount = days ? parseInt(days) : 7;
    
    return this.usageService.getUsageAnalytics(orgId, daysCount, endpointId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get usage statistics summary' })
  @ApiResponse({ status: 200, description: 'Usage stats retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUsageStats(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const orgId = req.headers['x-organization-id'] || req.user?.orgId || 'org-1';
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    
    return this.usageService.getUsageStats(orgId, start, end);
  }

  @Get('endpoint-breakdown')
  @ApiOperation({ summary: 'Get usage breakdown by endpoint' })
  @ApiResponse({ status: 200, description: 'Endpoint breakdown retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getEndpointBreakdown(
    @Request() req,
    @Query('days') days?: string,
  ) {
    const orgId = req.headers['x-organization-id'] || req.user?.orgId || 'org-1';
    const daysCount = days ? parseInt(days) : 30;
    
    return this.usageService.getEndpointBreakdown(orgId, daysCount);
  }

  @Get('trends')
  @ApiOperation({ summary: 'Get usage trends over time' })
  @ApiResponse({ status: 200, description: 'Usage trends retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUsageTrends(
    @Request() req,
    @Query('days') days?: string,
    @Query('granularity') granularity?: 'hourly' | 'daily',
  ) {
    const orgId = req.headers['x-organization-id'] || req.user?.orgId || 'org-1';
    const daysCount = days ? parseInt(days) : 7;
    const granularityType = granularity || 'daily';
    
    return this.usageService.getUsageTrends(orgId, daysCount, granularityType);
  }
}


