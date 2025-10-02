import { NextRequest, NextResponse } from 'next/server';
import { endpointQueries } from '@/lib/database';

// DELETE /api/endpoints/[id] - Delete endpoint permanently
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // For demo purposes, allow deletion without authentication
    // In production, add proper authentication here
    
    // Check if endpoint exists
    const endpoint = await endpointQueries.findById(id);
    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint not found' },
        { status: 404 }
      );
    }

    // Delete endpoint (mark as inactive)
    const success = await endpointQueries.delete(id);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete endpoint' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Endpoint '${endpoint.name}' deleted successfully`,
      deletedEndpoint: {
        id: endpoint.id,
        name: endpoint.name,
        totalRelays: endpoint.totalRelays,
        finalBill: {
          relays: endpoint.totalRelays,
          cost: Math.round(endpoint.totalRelays * 0.0001 * 100), // cents
        },
      },
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete endpoint' },
      { status: 500 }
    );
  }
}

// GET /api/endpoints/[id] - Get specific endpoint details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const endpoint = await endpointQueries.findById(id);
    
    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: endpoint.id,
      name: endpoint.name,
      chainId: endpoint.chain_id,
      endpointUrl: `https://pokt.ai/api/gateway?endpoint=${endpoint.id}`,
      rateLimit: endpoint.rate_limit,
      status: endpoint.is_active ? 'active' : 'inactive',
      createdAt: endpoint.created_at,
      billing: {
        totalRelays: 0, // Will be calculated from usage table
        monthlyRelays: 0, // Will be calculated from usage table
        estimatedMonthlyCost: 0,
        estimatedMonthlyCostDollars: 0,
      },
      // Don't expose token in GET requests
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to retrieve endpoint' },
      { status: 500 }
    );
  }
}
