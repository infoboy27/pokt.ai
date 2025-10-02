import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MockAuthGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    
    if (!authHeader) {
      return false;
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Accept mock token for testing
    if (token === 'mock-jwt-token-for-testing') {
      try {
        // Try to get the most recent user (for demo purposes)
        // In a real implementation, you'd decode the JWT token to get user info
        const user = await this.prisma.user.findFirst({
          orderBy: { createdAt: 'desc' },
          include: {
            orgMemberships: {
              include: {
                org: true,
              },
            },
          },
        });

        if (user) {
          // Get the user's primary organization
          const primaryOrg = user.orgMemberships?.find(m => m.role === 'owner');
          
          request.user = {
            id: user.id,
            email: user.email,
            name: user.name,
            auth0Sub: user.auth0Sub,
            orgId: primaryOrg?.orgId || 'org-1', // Fallback to default org
          };
          return true;
        }
      } catch (error) {
        console.error('Error getting user data:', error);
      }

      // Fallback to mock user if database query fails
      request.user = {
        id: 'user-1',
        email: 'demo@pokt.ai',
        auth0Sub: 'auth0|demo-user',
        orgId: 'org-1',
      };
      return true;
    }
    
    return false;
  }
}



