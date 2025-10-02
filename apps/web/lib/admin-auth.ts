import { NextRequest, NextResponse } from 'next/server';

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
    // In production, validate session token and fetch admin user from database
    if (process.env.NODE_ENV === 'development') {
      // Mock admin user for development only
      const mockAdminUser: AdminUser = {
        id: 'admin-1',
        email: 'admin@pokt.ai',
        name: 'Admin User',
        role: 'owner',
        isActive: true,
      };
      return mockAdminUser;
    }
    
    // Production: Validate session and fetch from database
    // TODO: Implement proper admin authentication
    return null;
  } catch (error) {
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


