import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/database';

const createOrganizationSchema = z.object({
  name: z.string().min(1, 'Organization name is required'),
  description: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  industry: z.string().optional(),
  size: z.string().optional(),
  adminEmail: z.string().email().optional(),
  adminName: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Get the current logged-in user from cookie
    const userId = request.cookies.get('user_id')?.value;
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        message: 'You must be logged in to create an organization'
      }, { status: 401 });
    }
    
    // Validate input
    const validatedData = createOrganizationSchema.parse(body);
    
    // Generate organization ID
    const orgId = `org_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create organization in database
    const orgResult = await query(
      `INSERT INTO organizations (id, name, owner_id, created_at, updated_at, payment_status)
       VALUES ($1, $2, $3, NOW(), NOW(), 'active')
       RETURNING *`,
      [orgId, validatedData.name, userId]
    );
    
    const organization = orgResult.rows[0];
    
    // Add the user as a member of the organization with 'owner' role
    await query(
      `INSERT INTO org_members (id, org_id, user_id, role, joined_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [`member_${Date.now()}`, orgId, userId, 'owner']
    );
    
    console.log(`[ORGANIZATIONS] Created organization ${orgId} for user ${userId}`);
    
    // Optionally send welcome email (don't fail if this fails)
    try {
      // Email sending is optional - we could implement this later
      // const emailService = await import('@/lib/email-service');
      // await emailService.sendWelcomeEmail(validatedData.adminEmail, validatedData.adminName);
    } catch (emailError) {
      console.warn('[ORGANIZATIONS] Failed to send welcome email:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      organization: {
        id: organization.id,
        name: organization.name,
        ownerId: organization.owner_id,
        createdAt: organization.created_at,
        status: 'active',
        plan: 'free',
        features: [
          'endpoints',
          'team_management',
          'analytics',
          'billing'
        ]
      },
      message: 'Organization created successfully! You can now create endpoints for this organization.'
    });

  } catch (error) {
    console.error('[ORGANIZATIONS] Error creating organization:', error);
    
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
