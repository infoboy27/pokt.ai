import { NextRequest, NextResponse } from 'next/server';
import { endpointQueries, usageQueries } from '@/lib/database';
import { calculateCost, calculateCostInCents, formatCost } from '@/lib/pricing';

// DELETE /api/endpoints/[id] - Delete endpoint (soft delete)
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

    // Check if already deleted
    if (endpoint.deleted_at) {
      return NextResponse.json(
        { error: 'Endpoint already deleted' },
        { status: 400 }
      );
    }

    // Calculate final bill for unpaid usage
    const usageData = await usageQueries.getUsageByEndpointId(id);
    const totalRelays = usageData?.totalRelays || 0;
    const finalBillAmount = calculateCost(totalRelays);
    const finalBillCents = calculateCostInCents(totalRelays);

    // Soft delete endpoint (mark as inactive, preserve for billing)
    const deletedEndpoint = await endpointQueries.delete(id);
    
    if (!deletedEndpoint) {
      return NextResponse.json(
        { error: 'Failed to delete endpoint' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Endpoint '${endpoint.name}' deleted successfully`,
      warning: finalBillAmount > 0 
        ? `This endpoint has unpaid usage of ${formatCost(finalBillAmount)} (${totalRelays.toLocaleString()} requests). You will be billed on the next billing cycle.`
        : null,
      deletedEndpoint: {
        id: endpoint.id,
        name: endpoint.name,
        deletedAt: new Date().toISOString(),
        finalBill: {
          relays: totalRelays,
          costCents: finalBillCents,
          costDollars: finalBillAmount,
          formattedCost: formatCost(finalBillAmount),
          willBeBilled: finalBillAmount > 0,
          billingDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString().split('T')[0],
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
