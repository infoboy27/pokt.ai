import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { emailService } from '@/lib/email-service';

const inviteMemberSchema = z.object({
  email: z.string().email('Valid email is required'),
  role: z.enum(['viewer', 'developer', 'admin']),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, role } = inviteMemberSchema.parse(body);

    // Generate invitation token
    const invitationToken = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://pokt.ai'}/accept-invitation?token=${invitationToken}`;

    // Send invitation email
    const emailSent = await emailService.sendTeamInvitation(
      email,
      'Team Administrator', // In real implementation, get from current user
      role,
      inviteLink
    );

    if (!emailSent) {
      return NextResponse.json({
        success: false,
        message: 'Failed to send invitation email'
      }, { status: 500 });
    }

    // In real implementation, save invitation to database
    const invitation = {
      id: `inv_${Date.now()}`,
      email,
      role,
      token: invitationToken,
      status: 'pending',
      invitedBy: 'current_user_id', // In real implementation, get from auth
      invitedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };

    return NextResponse.json({
      success: true,
      invitation,
      message: 'Invitation sent successfully'
    });

  } catch (error) {
    console.error('Error sending invitation:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      message: 'Failed to send invitation',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}










