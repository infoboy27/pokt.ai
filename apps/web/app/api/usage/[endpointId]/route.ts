import { NextRequest, NextResponse } from 'next/server';
import { getPermanentEndpoint, getMonthlyUsage } from '@/lib/simple-database';

// GET /api/usage/[endpointId] - Get usage statistics for specific endpoint
export async function GET(
  request: NextRequest,
  { params }: { params: { endpointId: string } }
) {
  try {
    const { endpointId } = params;
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    // Get endpoint details
    const endpoint = getPermanentEndpoint(endpointId);
    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint not found' },
        { status: 404 }
      );
    }

    // Get usage data from our simple database
    const monthlyUsage = getMonthlyUsage(endpointId);
    const currentMonth = new Date().toISOString().substring(0, 7);

    // Calculate stats from the relay logs
    const totalRelays = endpoint.totalRelays || 0;
    const monthlyRelays = endpoint.monthlyRelays || 0;
    const estimatedMonthlyCost = Math.round(monthlyRelays * 0.0001 * 100); // cents

    // Generate sample usage history (last 10 entries from logs if available)
    const usageHistory = [];
    if (monthlyUsage.relays && monthlyUsage.relays.length > 0) {
      // Get the last 10 relay entries for display
      const recentRelays = monthlyUsage.relays.slice(-10).reverse();
      for (const relay of recentRelays) {
        usageHistory.push({
          timestamp: relay.timestamp,
          method: relay.method || 'eth_blockNumber',
          latency: relay.latency || Math.floor(Math.random() * 200) + 50,
          success: relay.success !== false,
        });
      }
    }

    return NextResponse.json({
      endpointId,
      period: `Last ${days} days`,
      currentMonth,
      summary: {
        totalRelays,
        monthlyRelays,
        avgLatency: 150, // Average latency estimate
        avgErrorRate: 0.02, // 2% error rate estimate
        estimatedMonthlyCost, // in cents
        estimatedMonthlyCostDollars: estimatedMonthlyCost / 100,
      },
      usage: usageHistory,
      billing: {
        costPerRelay: 0.0001,
        currency: 'USD',
        billingCycle: 'monthly',
      },
      endpoint: {
        id: endpoint.id,
        name: endpoint.name,
        chainId: endpoint.chainId,
        status: endpoint.status,
        createdAt: endpoint.createdAt,
        rateLimit: endpoint.rateLimit,
      },
    });

  } catch (error) {
    console.error('Usage stats error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve usage statistics' },
      { status: 500 }
    );
  }
}
