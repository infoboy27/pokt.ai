import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomBytes } from 'crypto';
import { endpointQueries, usageQueries } from '@/lib/database';
import { calculateCost, calculateCostInCents, getCurrentRate } from '@/lib/pricing';

// POST /api/endpoints - Create new permanent endpoint with billing
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, chainId, rateLimit = 1000, organizationId = 'org_current_user', customerId = 'current_user', pathAppAddress } = body;

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

    // Generate unique API key for this endpoint
    const token = `sk_pokt_${randomBytes(32).toString('hex')}`;
    const tokenHash = createHash('sha256').update(token).digest('hex');

    // Create endpoint in database
    const endpoint = await endpointQueries.create({
      name,
      chainId,
      organizationId,
      customerId,
      apiKey: token,
      rateLimit,
      pathAppAddress, // Optional: Per-network PATH gateway app address (for multi-tenant support)
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
        costPerRelay: getCurrentRate(),
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
    
    // Get user ID from cookie
    const userId = request.cookies.get('user_id')?.value;
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Get organization ID from query param or use first organization
    const { organizationQueries } = await import('@/lib/database');
    const organizations = await organizationQueries.findByUserId(userId);
    
    if (!organizations || organizations.length === 0) {
      return NextResponse.json({ error: 'No organization found for user' }, { status: 404 });
    }
    
    // Check if orgId is provided in query params, otherwise use first organization
    // This ensures consistency with dashboard which uses the first organization
    let orgId = searchParams.get('orgId') || searchParams.get('organizationId');
    
    if (!orgId) {
      // Use first organization if no orgId specified (same as dashboard)
      orgId = organizations[0].id;
    } else {
      // Verify user has access to the requested organization
      const hasAccess = organizations.some(org => org.id === orgId);
      if (!hasAccess) {
        return NextResponse.json({ error: 'Access denied to this organization' }, { status: 403 });
      }
    }
    
    console.log('[ENDPOINTS API] User:', userId, 'Organization:', orgId, 'Total orgs:', organizations.length);
    
    const customerIdParam = searchParams.get('customerId');
    const customerId: string | undefined = customerIdParam ? customerIdParam : undefined;
    
    // Get endpoints filtered by organization and optionally by customer
    const endpoints = await endpointQueries.findAll(orgId as string, customerId);
    
    const endpointsWithBilling = await Promise.all(endpoints.map(async endpoint => {
      // Fetch real usage data for this endpoint
      const usageData = await usageQueries.getUsageByEndpointId(endpoint.id);
      
      const totalRelays = usageData.totalRelays || 0;
      const estimatedMonthlyCost = calculateCostInCents(totalRelays);
      
      return {
        id: endpoint.id,
        name: endpoint.name,
        chainId: 1, // Default to Ethereum mainnet
        endpointUrl: `https://pokt.ai/api/gateway?endpoint=${endpoint.id}`,
        rpcUrl: `https://pokt.ai/api/gateway?endpoint=${endpoint.id}`,
        token: endpoint.api_key || `sk_${endpoint.id}`, // Return the stored API key or generate one
        rateLimit: endpoint.rate_limit || 1000,
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
    const totalMonthlyCost = calculateCostInCents(totalMonthlyRelays);

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
        costPerRelay: getCurrentRate(),
        currency: 'USD',
        billingCycle: 'monthly',
        nextBillingDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
      },
    });

  } catch (error) {
    console.error('[ENDPOINTS] Error retrieving endpoints:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve endpoints', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}