import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // In a real application, this would fetch from your database
    // For now, we'll return a realistic organization structure
    const organization = {
      id: 'org_current_user',
      name: 'Your Organization',
      plan: 'enterprise' as const,
      totalCustomers: 1, // Current user
      totalEndpoints: 0, // Will be updated dynamically
      monthlyUsage: 0, // Will be updated dynamically
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(organization);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch organization data' },
      { status: 500 }
    );
  }
}

