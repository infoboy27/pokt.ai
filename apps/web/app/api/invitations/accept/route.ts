import { NextRequest, NextResponse } from 'next/server';
import { userQueries, organizationQueries } from '@/lib/database';
import { createHash } from 'crypto';

// POST /api/invitations/accept - Accept team invitation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, name, email, password } = body;

    if (!token || !name || !email || !password) {
      return NextResponse.json(
        { error: 'Token, name, email, and password are required' },
        { status: 400 }
      );
    }

    // In a real application, you would:
    // 1. Validate the invitation token
    // 2. Check if the invitation is still valid
    // 3. Check if the email matches the invited email
    // 4. Create the user account
    // 5. Add the user to the organization
    // 6. Mark the invitation as accepted
    // 7. Send welcome email

    // For now, we'll simulate the process
    const hashedPassword = createHash('sha256').update(password).digest('hex');
    
    // Create user account
    const user = await userQueries.create({
      email,
      name,
      password: hashedPassword,
      company: 'Invited User'
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      );
    }

    // In a real app, you would add the user to the organization here
    // await organizationQueries.addMember(organizationId, user.id, role);

    return NextResponse.json({
      success: true,
      message: 'Invitation accepted successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error: any) {
    console.error('Error accepting invitation:', error);
    
    // Handle specific database errors
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Email address already exists. Please use a different email or try logging in.' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to accept invitation' },
      { status: 500 }
    );
  }
}
