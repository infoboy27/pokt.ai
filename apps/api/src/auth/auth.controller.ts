import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login with Auth0 token' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async login(@Body() body: { auth0Token: string }) {
    // In a real implementation, you would validate the Auth0 token here
    // For now, we'll use a mock user
    const mockUser = {
      id: 'user-1',
      email: 'demo@pokt.ai',
      name: 'Demo User',
      auth0Sub: 'auth0|demo-user',
      orgMemberships: [
        {
          org: { id: 'org-1', name: 'Demo Organization' },
          role: 'ORG_OWNER',
        },
      ],
      ownedOrgs: [
        { id: 'org-1', name: 'Demo Organization' },
      ],
    };

    return this.authService.login(mockUser);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user information' })
  @ApiResponse({ status: 200, description: 'User information retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@Request() req) {
    const user = await this.authService.validateUser(req.user.auth0Sub);
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      organizations: user.orgMemberships.map((membership: any) => ({
        id: membership.org.id,
        name: membership.org.name,
        role: membership.role,
      })),
      ownedOrganizations: user.ownedOrgs.map((org: any) => ({
        id: org.id,
        name: org.name,
      })),
    };
  }
}
