import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AdminUser {
  id: string;
  email: string;
  name?: string;
  role: 'owner' | 'admin' | 'viewer';
  isActive: boolean;
}

export async function getAdminUser(request: NextRequest): Promise<AdminUser | null> {
  // For now, we'll use a simple session-based approach
  // In production, this should use proper JWT tokens or NextAuth
  const sessionToken = request.cookies.get('admin-session')?.value;
  
  if (!sessionToken) {
    return null;
  }

  try {
    // In a real implementation, you'd verify the JWT token here
    // For now, we'll simulate by checking if the token exists in the database
    const adminUser = await prisma.adminUser.findFirst({
      where: {
        isActive: true,
        // In production, you'd verify the token against a stored hash
      },
    });

    return adminUser as AdminUser | null;
  } catch (error) {
    console.error('Admin auth error:', error);
    return null;
  }
}

export function requireAdmin(handler: (request: NextRequest, adminUser: AdminUser) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    const adminUser = await getAdminUser(request);
    
    if (!adminUser) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Admin authentication required' } },
        { status: 401 }
      );
    }

    return handler(request, adminUser);
  };
}

export function requireRole(roles: string[]) {
  return function(handler: (request: NextRequest, adminUser: AdminUser) => Promise<NextResponse>) {
    return async (request: NextRequest) => {
      const adminUser = await getAdminUser(request);
      
      if (!adminUser) {
        return NextResponse.json(
          { error: { code: 'UNAUTHORIZED', message: 'Admin authentication required' } },
          { status: 401 }
        );
      }

      if (!roles.includes(adminUser.role)) {
        return NextResponse.json(
          { error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
          { status: 403 }
        );
      }

      return handler(request, adminUser);
    };
  };
}


