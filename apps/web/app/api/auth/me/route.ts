import { NextRequest, NextResponse } from 'next/server';
import { userQueries, organizationQueries } from '@/lib/database';

// GET /api/auth/me - Get current user
export async function GET(request: NextRequest) {
  console.log('[AUTH/ME] Endpoint called');
  try {
    // Get user ID from cookie
    const userId = request.cookies.get('user_id')?.value;
    
    console.log('[AUTH/ME] User ID from cookie:', userId);
    console.log('[AUTH/ME] All cookies:', request.cookies.getAll());
    
    if (!userId) {
      console.log('[AUTH/ME] No user ID, returning 401');
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Fetch user from database
    const user = await userQueries.findById(userId);
    
    console.log('[AUTH/ME] User from DB:', user);
    
    if (!user) {
      console.log('[AUTH/ME] User not found, returning 404');
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('[AUTH/ME] Fetching organizations for user:', user.id);
    // Fetch user's organizations
    const organizations = await organizationQueries.findByUserId(user.id);
    console.log('[AUTH/ME] Organizations:', organizations);
    
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      organizationId: user.organization_id,
      role: 'admin',
      permissions: ['read', 'write', 'admin'],
      organizations: (organizations || []).map(org => ({
        id: org.id,
        name: org.name,
      })),
    };
    
    return NextResponse.json(userData);

  } catch (error) {
    console.error('[AUTH/ME] Error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 401 }
    );
  }
}