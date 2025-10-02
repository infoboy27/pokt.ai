import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  UseGuards, 
  Request 
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiBody 
} from '@nestjs/swagger';
import { EndpointsService } from './endpoints.service';
import { MockAuthGuard } from '../auth/mock-auth.guard';

class CreateEndpointDto {
  name: string;
  chainId: string;
  rateLimit: number;
}

@ApiTags('endpoints')
@Controller('endpoints')
@UseGuards(MockAuthGuard)
@ApiBearerAuth()
export class EndpointsController {
  constructor(private endpointsService: EndpointsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new RPC endpoint' })
  @ApiResponse({ status: 201, description: 'Endpoint created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createEndpoint(@Body() body: any, @Request() req) {
    // Get the orgId from the authenticated user's context or header
    const orgId = req.headers['x-organization-id'] || req.user?.orgId || 'org-1';
    
    return this.endpointsService.createEndpoint({
      orgId,
      name: body.name,
      chainId: body.chainId,
      rateLimit: body.rateLimit,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get all endpoints for the organization' })
  @ApiResponse({ status: 200, description: 'Endpoints retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getEndpoints(@Request() req) {
    // Get the orgId from the authenticated user's context or header
    const orgId = req.headers['x-organization-id'] || req.user?.orgId || 'org-1';
    console.log('Endpoints controller called with orgId:', orgId);
    
    return this.endpointsService.getEndpoints(orgId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific endpoint' })
  @ApiResponse({ status: 200, description: 'Endpoint retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Endpoint not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getEndpoint(@Param('id') id: string, @Request() req) {
    // Get the orgId from the authenticated user's context or header
    const orgId = req.headers['x-organization-id'] || req.user?.orgId || 'org-1';
    
    return this.endpointsService.getEndpoint(id, orgId);
  }

  @Put(':id/rotate-token')
  @ApiOperation({ summary: 'Rotate endpoint token' })
  @ApiResponse({ status: 200, description: 'Token rotated successfully' })
  @ApiResponse({ status: 404, description: 'Endpoint not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async rotateToken(@Param('id') id: string, @Request() req) {
    // Get the orgId from the authenticated user's context or header
    const orgId = req.headers['x-organization-id'] || req.user?.orgId || 'org-1';
    
    return this.endpointsService.rotateToken(id, orgId);
  }

  @Put(':id/revoke')
  @ApiOperation({ summary: 'Revoke an endpoint' })
  @ApiResponse({ status: 200, description: 'Endpoint revoked successfully' })
  @ApiResponse({ status: 404, description: 'Endpoint not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async revokeEndpoint(@Param('id') id: string, @Request() req) {
    // Get the orgId from the authenticated user's context or header
    const orgId = req.headers['x-organization-id'] || req.user?.orgId || 'org-1';
    
    return this.endpointsService.revokeEndpoint(id, orgId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an endpoint' })
  @ApiResponse({ status: 200, description: 'Endpoint deleted successfully' })
  @ApiResponse({ status: 404, description: 'Endpoint not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteEndpoint(@Param('id') id: string, @Request() req) {
    // Get the orgId from the authenticated user's context or header
    const orgId = req.headers['x-organization-id'] || req.user?.orgId || 'org-1';
    
    return this.endpointsService.deleteEndpoint(id, orgId);
  }
}
