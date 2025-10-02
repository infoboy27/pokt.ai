import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

// Customer registration endpoint to generate API keys for your RPC provider
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customer_name, organization_id, rate_limit = 1000 } = body;


    // Generate a new API key for your RPC provider
    // Format: sk_<organization>_<random>
    const randomId = randomBytes(12).toString('hex');
    const apiKey = `sk_${organization_id}_${randomId}`;

    // TODO: Register this API key with your RPC provider
    // This would call your RPC provider's admin API to create the key
    const customerData = {
      customer_id: `cust_${randomBytes(8).toString('hex')}`,
      customer_name,
      organization_id,
      api_key: apiKey,
      rate_limit,
      created_at: new Date().toISOString(),
      status: 'active'
    };


    return NextResponse.json({
      success: true,
      customer: customerData,
      message: 'Customer registered successfully. API key ready for RPC provider.'
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to register customer' },
      { status: 500 }
    );
  }
}