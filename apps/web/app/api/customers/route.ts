import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    
    // For now, return a simple response to test
    const customers = [
      {
        id: 'current_user',
        name: 'Your Organization',
        email: 'user@organization.com',
        organizationId: 'org_current_user',
        plan: 'enterprise',
        status: 'active',
        endpoints: [],
        totalRelays: 0,
        monthlyRelays: 0,
        createdAt: new Date().toISOString()
      }
    ];
    
    return NextResponse.json(customers);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}
