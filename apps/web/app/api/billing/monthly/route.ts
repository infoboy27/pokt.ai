import { NextRequest, NextResponse } from 'next/server';

// Mock billing functions for demo purposes
async function getMonthlyUsage(orgId: string, month: string) {
  // Mock usage data
  return {
    totalRelays: Math.floor(Math.random() * 10000) + 1000,
    totalCost: Math.floor(Math.random() * 1000) + 100,
  };
}

async function generateMonthlyBill(orgId: string, month: string) {
  // Mock bill generation
  const usage = await getMonthlyUsage(orgId, month);
  return {
    month,
    totalRelays: usage.totalRelays,
    totalCost: usage.totalCost,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
}

// GET /api/billing/monthly?month=YYYY-MM&orgId=org-1 - Get monthly usage and billing
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month') || new Date().toISOString().substring(0, 7); // Default to current month
    const orgId = searchParams.get('orgId') || 'org-1';

    // Validate month format
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json(
        { error: 'Month must be in YYYY-MM format' },
        { status: 400 }
      );
    }

    // Get monthly usage
    const usage = await getMonthlyUsage(orgId, month);
    
    // Generate bill
    const bill = await generateMonthlyBill(orgId, month);

    return NextResponse.json({
      month,
      orgId,
      usage: {
        totalRelays: usage.totalRelays,
        costPerRelay: 0.000001, // $1 per 1,000,000 relays
        totalCostCents: usage.totalCost,
        totalCostDollars: usage.totalCost / 100,
      },
      bill: bill ? {
        status: bill.status,
        totalCost: bill.totalCost,
        createdAt: bill.createdAt,
        dueDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString(),
      } : null,
      breakdown: {
        description: `${usage.totalRelays.toLocaleString()} relays × $0.0001 each`,
        period: `${month}-01 to ${month}-${new Date(new Date().getFullYear(), parseInt(month.split('-')[1]), 0).getDate()}`,
      },
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate monthly billing' },
      { status: 500 }
    );
  }
}

// POST /api/billing/monthly - Generate bill for specific month
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { month, orgId = 'org-1' } = body;

    if (!month) {
      return NextResponse.json(
        { error: 'Month is required in YYYY-MM format' },
        { status: 400 }
      );
    }

    const bill = await generateMonthlyBill(orgId, month);
    
    if (!bill) {
      return NextResponse.json(
        { error: 'Failed to generate bill' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      bill: {
        month: bill.month,
        totalRelays: bill.totalRelays,
        totalCostCents: bill.totalCost,
        totalCostDollars: bill.totalCost / 100,
        status: bill.status,
        createdAt: bill.createdAt,
        dueDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString(),
      },
      message: `Bill generated for ${bill.totalRelays.toLocaleString()} relays`,
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate bill' },
      { status: 500 }
    );
  }
}








