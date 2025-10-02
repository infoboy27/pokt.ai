import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { HealthCheckService } from './health-check.service';
import { MockAuthGuard } from '../auth/mock-auth.guard';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private healthCheckService: HealthCheckService) {}
  @Get()
  @ApiOperation({ summary: 'Health check' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness check' })
  @ApiResponse({ status: 200, description: 'Service is ready' })
  ready() {
    return {
      status: 'ready',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('endpoints')
  @UseGuards(MockAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check health of all endpoints' })
  @ApiResponse({ status: 200, description: 'Health check completed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async checkAllEndpoints(@Request() req) {
    const orgId = req.headers['x-organization-id'] || req.user?.orgId || 'org-1';
    return this.healthCheckService.checkAllEndpointsHealth(orgId);
  }

  @Get('endpoints/:id')
  @UseGuards(MockAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check health of specific endpoint' })
  @ApiResponse({ status: 200, description: 'Health check completed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async checkEndpointHealth(@Param('id') id: string) {
    return this.healthCheckService.checkEndpointHealth(id);
  }
}
