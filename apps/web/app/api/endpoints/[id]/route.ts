import { NextRequest, NextResponse } from 'next/server';
import { getPermanentEndpoint, deletePermanentEndpoint } from '@/lib/simple-database';

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
    const endpoint = getPermanentEndpoint(id);
    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint not found' },
        { status: 404 }
      );
    }

    // Delete endpoint (mark as inactive)
    const success = deletePermanentEndpoint(id);
    
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
    console.error('Delete endpoint error:', error);
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
    const endpoint = getPermanentEndpoint(id);
    
    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: endpoint.id,
      name: endpoint.name,
      chainId: endpoint.chainId,
      endpointUrl: `https://pokt.ai/api/gateway?endpoint=${endpoint.id}`,
      rateLimit: endpoint.rateLimit,
      status: endpoint.status,
      createdAt: endpoint.createdAt,
      billing: {
        totalRelays: endpoint.totalRelays,
        monthlyRelays: endpoint.monthlyRelays,
        estimatedMonthlyCost: Math.round(endpoint.monthlyRelays * 0.0001 * 100),
        estimatedMonthlyCostDollars: endpoint.monthlyRelays * 0.0001,
      },
      // Don't expose token in GET requests
    });

  } catch (error) {
    console.error('Get endpoint error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve endpoint' },
      { status: 500 }
    );
  }
}
