import { NextRequest, NextResponse } from 'next/server';
import { endpointQueries, usageQueries } from '@/lib/database';

// GET /api/usage/endpoints - Get usage breakdown by endpoint
export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('X-Organization-ID') || 'org-1';

    // Get all endpoints for this organization
    const endpoints = await endpointQueries.findAll(orgId);
    
    if (endpoints.length === 0) {
      return NextResponse.json({
        endpoints: [],
        totalRequests: 0,
        totalLatency: 0,
        totalErrorRate: 0
      });
    }

    // Get usage data for each endpoint
    const endpointUsage = [];
    let totalRequests = 0;
    let totalLatency = 0;
    let totalErrorRate = 0;

    for (const endpoint of endpoints) {
      try {
        const usageData = await usageQueries.getUsageByEndpointId(endpoint.id);
        if (usageData) {
          endpointUsage.push({
            id: endpoint.id,
            name: endpoint.name,
            chainId: endpoint.chain_id,
            totalRequests: usageData.totalRelays || 0,
            avgLatency: usageData.avgResponseTime || 0,
            errorRate: usageData.errorRate || 0,
            status: endpoint.is_active ? 'active' : 'inactive',
            createdAt: endpoint.created_at
          });
          
          totalRequests += usageData.totalRelays || 0;
          totalLatency += usageData.avgResponseTime || 0;
          totalErrorRate += usageData.errorRate || 0;
        }
      } catch (error) {
        console.error(`Error fetching usage for endpoint ${endpoint.id}:`, error);
      }
    }

    return NextResponse.json({
      endpoints: endpointUsage,
      totalRequests,
      totalLatency: totalLatency / endpointUsage.length,
      totalErrorRate: totalErrorRate / endpointUsage.length
    });

  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to fetch endpoint usage',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}










