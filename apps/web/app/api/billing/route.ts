import { NextRequest, NextResponse } from 'next/server';
import { getMonthlyUsage, generateBill } from '@/lib/simple-database';

// GET /api/billing?month=YYYY-MM&orgId=org-1 - Get billing information
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month') || new Date().toISOString().substring(0, 7);
    const orgId = searchParams.get('orgId') || 'org-1';

    // Validate month format
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json(
        { error: 'Month must be in YYYY-MM format' },
        { status: 400 }
      );
    }

    const usage = getMonthlyUsage(orgId, month);
    const bill = generateBill(orgId, month);

    return NextResponse.json({
      success: true,
      billing: {
        month,
        orgId,
        summary: {
          totalRelays: usage.totalRelays,
          totalCostCents: usage.totalCost,
          totalCostDollars: usage.totalCost / 100,
          costPerRelay: 0.0001,
          currency: 'USD',
        },
        endpoints: usage.endpoints,
        bill: {
          status: bill.status,
          createdAt: bill.createdAt,
          dueDate: bill.dueDate,
          description: bill.description,
        },
        nextBillingDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
      },
    });

  } catch (error) {
    console.error('Billing API error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve billing information' },
      { status: 500 }
    );
  }
}

// POST /api/billing - Generate bill for specific month
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { month, orgId = 'org-1', action = 'generate' } = body;

    if (!month) {
      return NextResponse.json(
        { error: 'Month is required in YYYY-MM format' },
        { status: 400 }
      );
    }

    if (action === 'generate') {
      const bill = generateBill(orgId, month);
      
      return NextResponse.json({
        success: true,
        message: `Bill generated for ${month}`,
        bill: {
          month: bill.month,
          totalRelays: bill.totalRelays,
          totalCostCents: bill.totalCostCents,
          totalCostDollars: bill.totalCostDollars,
          status: bill.status,
          createdAt: bill.createdAt,
          dueDate: bill.dueDate,
          breakdown: bill.breakdown,
          description: bill.description,
        },
        paymentInfo: {
          amount: bill.totalCostDollars,
          currency: 'USD',
          description: `pokt.ai RPC Gateway - ${month}`,
          dueDate: bill.dueDate,
        },
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Generate bill error:', error);
    return NextResponse.json(
      { error: 'Failed to generate bill' },
      { status: 500 }
    );
  }
}


