import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { MockAuthGuard } from './mock-auth.guard';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcryptjs';

class RegisterUserDto {
  name: string;
  email: string;
  password: string;
  company?: string;
  plan?: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async register(@Body() registerUserDto: RegisterUserDto) {
    try {
      // Generate a random 6-digit verification code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Set expiration time (15 minutes from now)
      const verificationCodeExpiresAt = new Date();
      verificationCodeExpiresAt.setMinutes(verificationCodeExpiresAt.getMinutes() + 15);
      
      // Hash the password
      const hashedPassword = await bcrypt.hash(registerUserDto.password, 10);
      
      // Create user with verification status
      const user = await this.prisma.user.create({
        data: {
          email: registerUserDto.email,
          name: registerUserDto.name,
          password: hashedPassword,
          auth0Sub: `auth0|${Date.now()}`, // Mock Auth0 sub
          verificationCode: verificationCode,
          verificationCodeExpiresAt: verificationCodeExpiresAt,
          isEmailVerified: false,
        },
      });

      // Create organization for the user
      const organization = await this.prisma.organization.create({
        data: {
          name: registerUserDto.company || `${registerUserDto.name}'s Organization`,
          ownerId: user.id,
        },
      });

      // Add user as member of the organization
      await this.prisma.orgMember.create({
        data: {
          userId: user.id,
          orgId: organization.id,
          role: 'owner',
          joinedAt: new Date(),
        },
      });

      // Send verification email
      const emailSent = await this.emailService.sendVerificationEmail(user.email, verificationCode);
      
      if (!emailSent) {
        console.warn(`Failed to send verification email to ${user.email}, but user was created`);
      }

      return {
        message: 'User registered successfully. Please check your email for verification code.',
        email: user.email,
      };
    } catch (error) {
      console.error('Error registering user:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      throw new Error(`Failed to register user: ${error.message}`);
    }
  }

  @Post('verify-email')
  @ApiOperation({ summary: 'Verify email with code' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid verification code' })
  async verifyEmail(@Body() body: { email: string; code: string }) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: body.email },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Check if user already verified
      if (user.isEmailVerified) {
        return {
          message: 'Email already verified. You can login.',
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
          },
        };
      }

      // Check if verification code exists
      if (!user.verificationCode) {
        throw new Error('No verification code found. Please register again.');
      }

      // Check if verification code matches
      if (user.verificationCode !== body.code) {
        console.log(`Invalid code: expected '${user.verificationCode}', got '${body.code}'`);
        throw new Error('Invalid verification code.');
      }

      // Check if verification code is expired
      const now = new Date();
      if (user.verificationCodeExpiresAt && now > user.verificationCodeExpiresAt) {
        throw new Error('Verification code has expired. Please register again.');
      }

      console.log('Verification code is valid, updating user status...');

      // Update user verification status and clear verification code
      const updatedUser = await this.prisma.user.update({
        where: { email: body.email },
        data: {
          isEmailVerified: true,
          verificationCode: null,
          verificationCodeExpiresAt: null,
        },
      });

      return {
        message: 'Email verified successfully. You can now login.',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
        },
      };
    } catch (error) {
      console.error('Error verifying email:', error);
      throw new Error(`Email verification failed: ${error.message}`);
    }
  }

  @Post('resend-verification')
  @ApiOperation({ summary: 'Resend verification code' })
  @ApiResponse({ status: 200, description: 'Verification code sent successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async resendVerification(@Body() body: { email: string }) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: body.email },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Check if user is already verified
      if (user.isEmailVerified) {
        return {
          message: 'Email already verified. You can login.',
        };
      }

      // Generate a new random 6-digit verification code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Set new expiration time (15 minutes from now)
      const verificationCodeExpiresAt = new Date();
      verificationCodeExpiresAt.setMinutes(verificationCodeExpiresAt.getMinutes() + 15);

      // Update user with new verification code
      await this.prisma.user.update({
        where: { email: body.email },
        data: {
          verificationCode: verificationCode,
          verificationCodeExpiresAt: verificationCodeExpiresAt,
        },
      });

      // Send verification email with new code
      const emailSent = await this.emailService.sendVerificationEmail(user.email, verificationCode);
      
      if (!emailSent) {
        console.warn(`Failed to send verification email to ${user.email}, but code was generated`);
      }

      return {
        message: 'New verification code sent. Please check your email.',
        email: user.email,
      };
    } catch (error) {
      console.error('Error resending verification code:', error);
      throw new Error(`Failed to resend verification code: ${error.message}`);
    }
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout() {
    // In a real implementation, you would invalidate the JWT token
    // For now, we just return a success message
    return {
      message: 'Logout successful',
    };
  }

  @Get('logout')
  @ApiOperation({ summary: 'Logout user (GET)' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logoutGet() {
    // In a real implementation, you would invalidate the JWT token
    // For now, we just return a success message
    return {
      message: 'Logout successful',
    };
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user info' })
  @ApiResponse({ status: 200, description: 'User info retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCurrentUser(@Request() req) {
    try {
      // Get the auth token from the request (header or cookie)
      const authHeader = req.headers.authorization;
      const token = authHeader?.replace('Bearer ', '');
      const cookieUserId = req.cookies?.user_id;
      
      console.log('[API AUTH/ME] Headers:', req.headers);
      console.log('[API AUTH/ME] Cookies:', req.cookies);
      console.log('[API AUTH/ME] User ID from cookie:', cookieUserId);
      
      // Check for valid authentication (either token or cookie)
      const hasValidToken = token && token === 'mock-jwt-token-for-testing';
      const hasValidCookie = cookieUserId;
      
      if (!hasValidToken && !hasValidCookie) {
        return {
          error: 'Authentication failed',
        };
      }
      
      // If we have a cookie user_id, use that to fetch the user
      if (cookieUserId) {
        const user = await this.prisma.user.findUnique({
          where: { id: cookieUserId },
          include: {
            orgMemberships: {
              include: {
                org: true,
              },
            },
          },
        });

        if (!user) {
          return {
            error: 'User not found',
          };
        }

        // Get the user's primary organization
        const primaryOrg = user.orgMemberships?.find(m => m.role === 'owner');
        
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          organizationId: primaryOrg?.orgId,
          role: primaryOrg?.role || 'member',
          permissions: ['read', 'write', 'admin'],
          organizations: user.orgMemberships.map(membership => ({
            id: membership.orgId,
            name: membership.org.name,
          })),
        };
      }

      // Get the most recent user (for demo purposes)
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

      if (!user) {
        return {
          error: 'User not found',
        };
      }

      // Get the user's primary organization
      const primaryOrg = user.orgMemberships?.find(m => m.role === 'owner');
      
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        organizations: user.orgMemberships.map(membership => ({
          id: membership.orgId,
          name: membership.org.name,
          role: membership.role,
        })),
        ownedOrganizations: user.orgMemberships
          .filter(m => m.role === 'owner')
          .map(membership => ({
            id: membership.orgId,
            name: membership.org.name,
          })),
        subscription: {
          plan: 'pro',
          status: 'active',
          billingCycle: 'monthly',
        },
      };
    } catch (error) {
      console.error('Error getting current user:', error);
      return {
        error: 'Failed to get user data',
      };
    }
  }

  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: { email: string; password: string }) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: loginDto.email },
        include: {
          orgMemberships: {
            include: {
              org: true,
            },
          },
        },
      });

      if (!user) {
        return {
          success: false,
          message: 'Invalid email or password',
        };
      }

      // Check if user has a password (for local auth)
      if (!user.password) {
        return {
          success: false,
          message: 'No password set for this user. Please use Auth0 login.',
        };
      }

      // Compare the provided password with the stored hash
      console.log('Comparing password:', loginDto.password, 'with hash:', user.password);
      const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
      console.log('Password valid:', isPasswordValid);
      if (!isPasswordValid) {
        return {
          success: false,
          message: 'Invalid email or password',
        };
      }

      // Check if email is verified
      if (!user.isEmailVerified) {
        return {
          success: false,
          message: 'Please verify your email before logging in. Check your inbox for the verification code.',
          requiresVerification: true,
        };
      }

      // Get the user's primary organization
      const primaryOrg = user.orgMemberships?.find(m => m.role === 'owner');
    
      if (!primaryOrg) {
        return {
          success: false,
          message: 'No organization found for user',
        };
      }

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          orgId: primaryOrg.orgId,
        },
        token: 'mock-jwt-token-for-testing',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Login failed. Please try again.',
      };
    }
  }
}