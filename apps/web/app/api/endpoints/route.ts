import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomBytes } from 'crypto';
import { endpointQueries, usageQueries } from '@/lib/database';

// POST /api/endpoints - Create new permanent endpoint with billing
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, chainId, rateLimit = 1000, organizationId = 'org_current_user', customerId = 'current_user' } = body;

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

    // Use static API key for all endpoints (no need for individual tokens)
    const token = process.env.STATIC_API_KEY || 'sk_pokt_ai_static_key';
    const tokenHash = createHash('sha256').update(token).digest('hex');

    // Create endpoint in database
    const endpoint = await endpointQueries.create({
      name,
      chainId,
      organizationId,
      customerId,
      apiKey: token,
      rateLimit,
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
      chainId: 1, // Default to Ethereum mainnet
      endpointUrl: endpoint.base_url,
      rpcUrl: endpoint.base_url, // For future use
      token, // Only returned on creation
      rateLimit: 1000, // Default rate limit
      status: endpoint.is_active ? 'active' : 'inactive',
      createdAt: endpoint.created_at,
      billing: {
        totalRelays: 0, // Will be calculated from usage table
        monthlyRelays: 0, // Will be calculated from usage table
        estimatedMonthlyCost: 0, // cents
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
    const customerId = searchParams.get('customerId') || undefined;
    
    // Get endpoints filtered by organization and optionally by customer
    const endpoints = await endpointQueries.findAll(orgId, customerId);
    
    const endpointsWithBilling = await Promise.all(endpoints.map(async endpoint => {
      // Fetch real usage data for this endpoint
      const usageData = await usageQueries.getUsageByEndpointId(endpoint.id);
      
      const totalRelays = usageData.totalRelays || 0;
      const estimatedMonthlyCost = Math.round(totalRelays * 0.0001 * 100); // cents
      
      return {
        id: endpoint.id,
        name: endpoint.name,
        chainId: 1, // Default to Ethereum mainnet
        endpointUrl: `https://pokt.ai/api/gateway?endpoint=${endpoint.id}`,
        rpcUrl: `https://pokt.ai/api/gateway?endpoint=${endpoint.id}`,
        token: process.env.STATIC_API_KEY || 'sk_pokt_ai_static_key', // Use static API key for all endpoints
        rateLimit: 1000, // Default rate limit
        status: endpoint.is_active ? 'active' : 'inactive',
        createdAt: endpoint.created_at,
        billing: {
          totalRelays: totalRelays, // Real usage data from database
          monthlyRelays: totalRelays, // Same as total for now
          estimatedMonthlyCost, // in cents
          estimatedMonthlyCostDollars: estimatedMonthlyCost / 100,
        },
      };
    }));

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
    return NextResponse.json(
      { error: 'Failed to retrieve endpoints' },
      { status: 500 }
    );
  }
}