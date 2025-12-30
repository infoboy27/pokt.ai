import { NextRequest, NextResponse } from 'next/server';
import { endpointQueries, usageQueries } from '@/lib/database';
import { emailService } from '@/lib/email-service';
import { calculateCost, getCurrentRate } from '@/lib/pricing';

// GET /api/billing - Get billing information
export async function GET(request: NextRequest) {
  try {
    // Get user ID from cookies
    const userId = request.cookies.get('user_id')?.value;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get user's organization
    const { query, organizationQueries } = await import('@/lib/database');
    const userOrgs = await organizationQueries.findByUserId(userId);
    
    if (!userOrgs || userOrgs.length === 0) {
      return NextResponse.json(
        { error: 'No organization found for user' },
        { status: 404 }
      );
    }
    
    const orgId = userOrgs[0].id; // User's organization
    console.log('[BILLING] Fetching billing for user:', userId, 'org:', orgId);

    // Get all endpoints INCLUDING DELETED ones (for billing purposes) - FILTERED by orgId
    const endpoints = await endpointQueries.findAllForBilling(orgId);
    
    console.log('[BILLING] Found', endpoints.length, 'endpoints for orgId:', orgId);
    
    // Fetch real usage/cost summary from backend
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    let currentMonthRequests = 0;
    let totalMonthlyCost = 0;
    let usageHistory: Array<{ month: string; requests: number; cost: number }> = [];
    let balanceDue = 0;
    let lastPaymentDate: string | null = null;
    let nextBillingDateIso = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString();

    let currentRate = 0;
    try {
      const summaryResp = await fetch(`${backendUrl}/billing/invoice/org/${orgId}/summary`, { cache: 'no-store' });
      if (summaryResp.ok) {
        const s = await summaryResp.json();
        currentMonthRequests = s.currentMonthRequests || 0;
        totalMonthlyCost = s.currentMonthCost || 0;
        usageHistory = s.usageHistory || [];
        balanceDue = s.balanceDue || 0;
        lastPaymentDate = s.lastPaymentDate ? new Date(s.lastPaymentDate).toISOString() : null;
        nextBillingDateIso = s.nextBillingDate ? new Date(s.nextBillingDate).toISOString() : nextBillingDateIso;
        currentRate = s.ratePerRequest || 0;
      }
    } catch (e) {
      console.warn('[BILLING] Failed to fetch org summary; falling back to zeros');
    }

    // Fetch real invoices from backend (fallback to empty if unavailable)
    let invoices: Array<{ id: string; date: string; amount: number; status: 'paid' | 'pending' | 'failed'; downloadUrl: string; }>= [];
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const resp = await fetch(`${backendUrl}/billing/invoice/org/${orgId}`, { cache: 'no-store' });
      if (resp.ok) {
        const data = await resp.json();
        invoices = (data || []).map((inv: any) => ({
          id: inv.id,
          date: new Date(inv.periodEnd || inv.createdAt).toISOString().split('T')[0],
          amount: Number((inv.amount / 100).toFixed(2)),
          status: (inv.status === 'paid' ? 'paid' : inv.status === 'open' ? 'pending' : 'failed') as 'paid' | 'pending' | 'failed',
          downloadUrl: `/api/billing/invoice/${inv.id}`,
        }));
      }
    } catch (e) {
      console.warn('[BILLING] Failed to fetch real invoices, falling back to none');
    }

    // Determine payment method based on user preferences
    const paymentMethods = [
      {
        type: 'card',
        last4: '4242',
        expiry: '12/26',
        brand: 'visa',
        isDefault: true
      },
      {
        type: 'crypto',
        currency: 'USDC',
        address: '0x742d35Cc6634C0532925a3b8D',
        isDefault: false
      }
    ];

    const billingData = {
      currentPlan: {
        name: 'Pay-as-you-go',
        price: totalMonthlyCost,
        features: [],
        usage: {
          requests: currentMonthRequests,
          limit: 0,
          percentage: 0
        }
      },
      paymentMethods,
      invoices,
      usageHistory,
      costBreakdown: {
        basePlan: 0,
        overage: 0,
        total: totalMonthlyCost
      },
      nextBillingDate: nextBillingDateIso.split('T')[0],
      totalEndpoints: endpoints.length,
      activeEndpoints: endpoints.filter(ep => ep.is_active).length,
      currentRate,
    };

    return NextResponse.json(billingData);

  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to fetch billing information',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}