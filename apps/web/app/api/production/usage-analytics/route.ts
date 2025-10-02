import { NextRequest, NextResponse } from 'next/server';

// Production endpoint to fetch usage analytics from Shannon Gateway
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }


    // Fetch usage data from Shannon Gateway
    const usageUrl = `http://135.125.163.236:3006/api/external/customers/${customerId}/usage`;
    
    const usageResponse = await fetch(usageUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Add authentication headers if needed
      }
    });


    if (usageResponse.ok) {
      const usageData = await usageResponse.json();
      return NextResponse.json({
        success: true,
        customer_id: customerId,
        usage_data: usageData,
        source: 'shannon_gateway'
      });
    } else {
      // Fallback to local analytics if Shannon Gateway is not available
      return NextResponse.json({
        success: false,
        customer_id: customerId,
        message: 'Shannon Gateway not available, using local data',
        fallback_data: {
          total_relays: 0,
          monthly_relays: 0,
          estimated_cost: 0
        }
      });
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch usage analytics from Shannon Gateway' },
      { status: 500 }
    );
  }
}

