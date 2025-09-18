import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomBytes } from 'crypto';
import { createPermanentEndpoint, getAllPermanentEndpoints, getEndpointToken } from '@/lib/simple-database';

// POST /api/endpoints - Create new permanent endpoint with billing
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, chainId, rateLimit = 1000, orgId = 'org-1' } = body;

    if (!name || !chainId) {
      return NextResponse.json(
        { error: 'Name and chainId are required' },
        { status: 400 }
      );
    }

    // Generate unique endpoint ID with timestamp and random components
    const timestamp = Date.now().toString(36);
    const randomId = randomBytes(6).toString('hex');
    const endpointId = `pokt_${timestamp}_${randomId}`;

    // Generate secure token
    const tokenSecret = randomBytes(20).toString('hex');
    const tokenId = randomBytes(6).toString('hex');
    const token = `pokt_${tokenId}_${tokenSecret}`;
    const tokenHash = createHash('sha256').update(token).digest('hex');

    // Create endpoint with permanent storage and billing support
    const endpoint = createPermanentEndpoint({
      id: endpointId,
      name,
      chainId,
      token,
      tokenHash,
      rateLimit,
      status: 'active',
      orgId,
    });

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Failed to create permanent endpoint' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: endpoint.id,
      name: endpoint.name,
      chainId: endpoint.chainId,
      endpointUrl: `https://pokt.ai/api/gateway?endpoint=${endpoint.id}`,
      rpcUrl: `https://pokt.ai/api/rpc/${endpoint.id}`, // For future use
      token, // Only returned on creation
      rateLimit: endpoint.rateLimit,
      status: endpoint.status,
      createdAt: endpoint.createdAt,
      billing: {
        totalRelays: endpoint.totalRelays,
        monthlyRelays: endpoint.monthlyRelays,
        estimatedMonthlyCost: Math.round(endpoint.monthlyRelays * 0.0001 * 100), // cents
        costPerRelay: 0.0001,
        currency: 'USD',
      },
      features: [
        'Permanent storage',
        'Relay tracking', 
        'Monthly billing',
        'Usage analytics',
      ],
    });

  } catch (error) {
    console.error('Create endpoint error:', error);
    return NextResponse.json(
      { error: 'Failed to create endpoint' },
      { status: 500 }
    );
  }
}

// GET /api/endpoints - List permanent endpoints with billing info
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId') || 'org-1';
    
    const endpoints = getAllPermanentEndpoints(orgId);
    
    const endpointsWithBilling = endpoints.map(endpoint => {
      const estimatedMonthlyCost = Math.round(endpoint.monthlyRelays * 0.0001 * 100); // cents
      
      return {
        id: endpoint.id,
        name: endpoint.name,
        chainId: endpoint.chainId,
        endpointUrl: `https://pokt.ai/api/gateway?endpoint=${endpoint.id}`,
        rpcUrl: `https://pokt.ai/api/rpc/${endpoint.id}`,
        token: endpoint.token, // Include token for frontend display
        rateLimit: endpoint.rateLimit,
        status: endpoint.status,
        createdAt: endpoint.createdAt,
        billing: {
          totalRelays: endpoint.totalRelays,
          monthlyRelays: endpoint.monthlyRelays,
          estimatedMonthlyCost, // in cents
          estimatedMonthlyCostDollars: estimatedMonthlyCost / 100,
        },
      };
    });

    // Calculate total usage for organization
    const totalRelays = endpoints.reduce((sum, e) => sum + e.totalRelays, 0);
    const totalMonthlyRelays = endpoints.reduce((sum, e) => sum + e.monthlyRelays, 0);
    const totalMonthlyCost = Math.round(totalMonthlyRelays * 0.0001 * 100);

    return NextResponse.json({
      endpoints: endpointsWithBilling,
      summary: {
        totalEndpoints: endpoints.length,
        totalRelays,
        monthlyRelays: totalMonthlyRelays,
        estimatedMonthlyCost: totalMonthlyCost,
        estimatedMonthlyCostDollars: totalMonthlyCost / 100,
      },
      billing: {
        currentMonth: new Date().toISOString().substring(0, 7),
        costPerRelay: 0.0001, // $0.0001 per relay
        currency: 'USD',
        billingCycle: 'monthly',
        nextBillingDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
      },
    });

  } catch (error) {
    console.error('List endpoints error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve endpoints' },
      { status: 500 }
    );
  }
}