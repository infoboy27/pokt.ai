import { NextRequest, NextResponse } from 'next/server';
import { userQueries, organizationQueries } from '@/lib/database';

// GET /api/members - Get team members for the current organization
export async function GET(request: NextRequest) {
  try {
    // Get user ID from cookie
    const userId = request.cookies.get('user_id')?.value;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get user's organizations
    const organizations = await organizationQueries.findByUserId(userId);
    
    if (!organizations || organizations.length === 0) {
      return NextResponse.json({
        members: [],
        invitations: [],
        stats: {
          totalMembers: 0,
          activeMembers: 0,
          pendingInvites: 0,
          totalActivity: 0
        }
      });
    }

    // For now, we'll return the current user as the only member
    // In a real implementation, you'd have a members table with relationships
    const user = await userQueries.findById(userId);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get the primary organization
    const primaryOrg = organizations[0];
    
    // Create member data for the current user
    const members = [{
      id: user.id,
      name: user.name,
      email: user.email,
      role: 'owner' as const,
      status: 'active' as const,
      lastActive: new Date().toISOString(),
      joinedAt: user.created_at || new Date().toISOString(),
      permissions: ['read', 'write', 'admin'],
      endpointsCreated: 0, // This would come from endpoints table
      apiKeysGenerated: 0, // This would come from api_keys table
    }];

    // Mock invitations for now
    const invitations = [
      {
        id: 'inv_1',
        email: 'developer@company.com',
        role: 'developer',
        invitedBy: user.name,
        invitedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
        status: 'pending' as const
      },
      {
        id: 'inv_2',
        email: 'viewer@company.com',
        role: 'viewer',
        invitedBy: user.name,
        invitedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        expiresAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days from now
        status: 'pending' as const
      }
    ];

    const stats = {
      totalMembers: members.length,
      activeMembers: members.filter(m => m.status === 'active').length,
      pendingInvites: invitations.length,
      totalActivity: members.reduce((sum, member) => sum + member.endpointsCreated + member.apiKeysGenerated, 0)
    };

    return NextResponse.json({
      members,
      invitations,
      stats
    });

  } catch (error) {
    console.error('[MEMBERS] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch members' },
      { status: 500 }
    );
  }
}









