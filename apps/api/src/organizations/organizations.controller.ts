import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import { MockAuthGuard } from '../auth/mock-auth.guard';

class CreateOrganizationDto {
  name: string;
}

@ApiTags('organizations')
@Controller('api/organizations')
@UseGuards(MockAuthGuard)
@ApiBearerAuth()
export class OrganizationsController {
  constructor(private organizationsService: OrganizationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new organization' })
  @ApiResponse({ status: 201, description: 'Organization created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createOrganization(@Body() createOrgDto: CreateOrganizationDto, @Request() req) {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return {
          success: false,
          message: 'User not authenticated',
        };
      }

      const organization = await this.organizationsService.createOrganization(
        createOrgDto.name,
        userId
      );

      return {
        success: true,
        organization: {
          id: organization.id,
          name: organization.name,
          createdAt: organization.createdAt,
        },
      };
    } catch (error) {
      console.error('Error creating organization:', error);
      return {
        success: false,
        message: 'Failed to create organization',
      };
    }
  }
}
