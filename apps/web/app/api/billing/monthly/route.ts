import { NextRequest, NextResponse } from 'next/server';
import { generateMonthlyBill, getMonthlyUsage } from '@/lib/billing-storage';

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
        costPerRelay: 0.0001, // $0.0001 per relay
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
    console.error('Monthly billing error:', error);
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
    console.error('Generate bill error:', error);
    return NextResponse.json(
      { error: 'Failed to generate bill' },
      { status: 500 }
    );
  }
}


