import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { endpointQueries } from '@/lib/database';

// Production endpoint to create endpoints with Shannon Gateway integration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, chainId, rateLimit = 1000, organizationId = 'org-1' } = body;

    // Validate and set default name if empty, ensure uniqueness
    const baseName = name && name.trim() ? name.trim() : `Endpoint`;
    const endpointName = `${baseName}_${Date.now()}`;

    // Step 1: Generate unique customer ID and API key
    const customerId = `cust_${randomBytes(8).toString('hex')}`;
    // Generate API key using endpoint name for better identification
    const cleanName = baseName.replace(/\s+/g, '_').toLowerCase();
    const apiKey = `sk_${cleanName}_${Date.now()}_${Date.now() + Math.floor(Math.random() * 1000)}`;

    // Step 2: Register customer with Shannon Gateway
    // TODO: Update this URL to your actual Shannon Gateway webhook endpoint
    const customerWebhookUrl = 'http://135.125.163.236:3006/api/portal/webhook/customer-created';
    
    let customerWebhookSuccess = true;
    try {
      const customerWebhookResponse = await fetch(customerWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_id: customerId,
          company_name: `${endpointName} Customer`,
          contact_email: `${customerId}@pokt.ai`,
          plan_type: 'enterprise',
          rate_limit: rateLimit,
          created_at: new Date().toISOString()
        })
      });

      if (!customerWebhookResponse.ok) {
        const errorText = await customerWebhookResponse.text();
        customerWebhookSuccess = false;
        // Don't throw error, just log it - webhooks are optional
      }
    } catch (error) {
      customerWebhookSuccess = false;
      // Don't throw error, just log it - webhooks are optional
    }

    // Step 3: Register API key with Shannon Gateway
    const apiKeyWebhookUrl = 'http://135.125.163.236:3006/api/portal/webhook/api-key-created';
    
    let apiKeyWebhookSuccess = true;
    try {
      const apiKeyWebhookResponse = await fetch(apiKeyWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_id: customerId,
          api_key: apiKey,
          name: `API Key for ${endpointName}`,
          rate_limit: rateLimit,
          created_at: new Date().toISOString()
        })
      });

      if (!apiKeyWebhookResponse.ok) {
        const errorText = await apiKeyWebhookResponse.text();
        apiKeyWebhookSuccess = false;
        // Don't throw error, just log it - webhooks are optional
      }
    } catch (error) {
      apiKeyWebhookSuccess = false;
      // Don't throw error, just log it - webhooks are optional
    }

    // Step 4: Create endpoint in pokt.ai system using PostgreSQL
    const endpoint = await endpointQueries.create({
      name: endpointName,
      chainId,
      organizationId,
      customerId,
      rpcUrl: `https://pokt.ai/api/gateway?endpoint=${endpointName.replace(/\s+/g, '_').toLowerCase()}`,
      apiKey,
      rateLimit,
    });

    if (!endpoint) {
      throw new Error('Failed to create endpoint in pokt.ai system');
    }


    return NextResponse.json({
      success: true,
      endpoint: {
        id: endpoint.id,
        name: endpoint.name,
        chainId: chainId,
        endpointUrl: endpoint.base_url,
        rpcUrl: endpoint.health_url,
        token: apiKey,
        rateLimit: rateLimit,
        status: endpoint.is_active ? 'active' : 'inactive',
        customerId,
        organizationId,
        createdAt: endpoint.created_at,
        billing: {
          totalRelays: 0,
          monthlyRelays: 0,
          estimatedMonthlyCost: 0,
          costPerRelay: 0.0001,
          currency: 'USD',
        },
        features: [
          "Shannon Gateway integration",
          "Real blockchain RPC access",
          "Relay tracking and billing",
          "Production-ready"
        ]
      },
      webhook_status: {
        customer: {
          success: customerWebhookSuccess
        },
        api_key: {
          success: apiKeyWebhookSuccess
        }
      },
      message: 'Production endpoint created with Shannon Gateway integration'
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to create production endpoint: ${errorMessage}` },
      { status: 500 }
    );
  }
}


