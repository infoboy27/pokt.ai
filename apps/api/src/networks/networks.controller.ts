import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { NetworksService } from './networks.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('networks')
@Controller('networks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NetworksController {
  constructor(private networksService: NetworksService) {}

  @Get('available')
  @ApiOperation({ summary: 'Get available networks' })
  @ApiResponse({ status: 200, description: 'Networks retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAvailableNetworks(@Request() req) {
    return this.networksService.getAvailableNetworks();
  }
}







