import { NextRequest, NextResponse } from 'next/server';

// GET /api/auth/me - Get current user (mock for demo)
export async function GET(request: NextRequest) {
  try {
    // For demo purposes, return a mock user
    // In production, validate JWT token and get real user data
    
    const mockUser = {
      id: 'user-1',
      email: 'demo@pokt.ai',
      name: 'Demo User',
      organizations: [
        {
          id: 'org-1',
          name: 'Demo Organization',
          role: 'owner',
        },
      ],
      ownedOrganizations: [
        {
          id: 'org-1', 
          name: 'Demo Organization',
        },
      ],
      subscription: {
        plan: 'pro',
        status: 'active',
        billingCycle: 'monthly',
      },
    };

    return NextResponse.json(mockUser);

  } catch (error) {
    console.error('Auth me error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 401 }
    );
  }
}


