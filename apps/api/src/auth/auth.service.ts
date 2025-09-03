import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(auth0Sub: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { auth0Sub },
      include: {
        orgMemberships: {
          include: {
            org: true,
          },
        },
        ownedOrgs: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  async login(user: any) {
    const payload = { 
      sub: user.id, 
      email: user.email, 
      auth0Sub: user.auth0Sub 
    };
    
    return {
      access_token: this.jwtService.sign(payload),
      user: {
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
      },
    };
  }
}
