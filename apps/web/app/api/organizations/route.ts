import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const createOrganizationSchema = z.object({
  name: z.string().min(1, 'Organization name is required'),
  description: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  industry: z.string().optional(),
  size: z.string().optional(),
  adminEmail: z.string().email('Valid email is required'),
  adminName: z.string().min(1, 'Admin name is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = createOrganizationSchema.parse(body);
    
    // In a real implementation, you would:
    // 1. Create organization in database
    // 2. Create admin user
    // 3. Set up default settings
    // 4. Send welcome email
    // 5. Set up billing account
    
    // For now, simulate the process
    const organization = {
      id: `org_${Date.now()}`,
      name: validatedData.name,
      description: validatedData.description,
      website: validatedData.website,
      industry: validatedData.industry,
      size: validatedData.size,
      createdAt: new Date().toISOString(),
      adminEmail: validatedData.adminEmail,
      adminName: validatedData.adminName,
      status: 'active',
      plan: 'enterprise',
      features: [
        'unlimited_endpoints',
        'team_management',
        'analytics',
        'billing',
        'priority_support'
      ]
    };

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));

    return NextResponse.json({
      success: true,
      organization,
      message: 'Organization created successfully'
    });

  } catch (error) {
    console.error('Error creating organization:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      message: 'Failed to create organization',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // In a real implementation, fetch organizations for the current user
    const organizations = [
      {
        id: 'org_1',
        name: 'Example Corp',
        description: 'A sample organization',
        website: 'https://example.com',
        industry: 'fintech',
        size: '11-50',
        createdAt: '2024-01-15T10:00:00Z',
        status: 'active',
        plan: 'enterprise'
      }
    ];

    return NextResponse.json({
      success: true,
      organizations
    });

  } catch (error) {
    console.error('Error fetching organizations:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch organizations'
    }, { status: 500 });
  }
}
