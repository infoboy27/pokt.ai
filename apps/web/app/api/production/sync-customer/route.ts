import { NextRequest, NextResponse } from 'next/server';

// Production endpoint to sync customers with Shannon Gateway
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customer_id, customer_name, organization_id, rate_limit = 1000 } = body;

      customer_id,
      customer_name,
      organization_id,
      rate_limit
    });

    // Step 1: Register customer via webhook
    const customerWebhookUrl = 'http://135.125.163.236:3006/api/portal/webhook/customer-created';
    
    const customerWebhookResponse = await fetch(customerWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add authentication headers if needed
      },
      body: JSON.stringify({
        customer_id,
        company_name: customer_name,
        contact_email: `${customer_id}@organization.com`,
        plan_type: 'enterprise',
        rate_limit,
        created_at: new Date().toISOString()
      })
    });


    // Step 2: Generate API key and register it
    const apiKey = `sk_${organization_id}_${Date.now().toString(36)}`;
    
    const apiKeyWebhookUrl = 'http://135.125.163.236:3006/api/portal/webhook/api-key-created';
    
    const apiKeyWebhookResponse = await fetch(apiKeyWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add authentication headers if needed
      },
      body: JSON.stringify({
        customer_id,
        api_key: apiKey,
        name: `API Key for ${customer_name}`,
        rate_limit,
        created_at: new Date().toISOString()
      })
    });


    return NextResponse.json({
      success: true,
      customer_id,
      api_key: apiKey,
      webhook_status: {
        customer: customerWebhookResponse.status,
        api_key: apiKeyWebhookResponse.status
      },
      message: 'Customer synced with Shannon Gateway'
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to sync customer with Shannon Gateway' },
      { status: 500 }
    );
  }
}
