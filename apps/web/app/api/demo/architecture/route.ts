import { NextRequest, NextResponse } from 'next/server';

// Demo endpoint to show the complete architecture
export async function GET(request: NextRequest) {
  return NextResponse.json({
    architecture: {
      title: "Multi-Tenant RPC Gateway Architecture",
      description: "Complete system for customer-specific blockchain endpoints",
      
      flow: [
        "1. Customer registers via /api/customers/register",
        "2. System generates unique API keys for each blockchain",
        "3. API keys are synced with RPC provider via /api/admin/sync-customer",
        "4. Customer creates endpoints via /api/endpoints",
        "5. Requests are proxied to RPC provider with customer's API key",
        "6. All relays are tracked for billing purposes"
      ],
      
      endpoints: {
        customer_registration: "POST /api/customers/register",
        endpoint_creation: "POST /api/endpoints", 
        rpc_gateway: "POST /api/gateway?endpoint=<endpointId>",
        admin_sync: "POST /api/admin/sync-customer"
      },
      
      rpc_provider: {
        server: "http://135.125.163.236:4000",
        endpoints: {
          ethereum: "/v1/rpc/eth",
          polygon: "/v1/rpc/poly", 
          bsc: "/v1/rpc/bsc",
          avalanche: "/v1/rpc/avax"
        },
        authentication: "X-API-Key header"
      },
      
      features: [
        "✅ Customer-specific API keys",
        "✅ Multi-blockchain support", 
        "✅ Relay tracking and billing",
        "✅ Rate limiting per customer",
        "✅ Permanent endpoint storage",
        "✅ Real-time usage analytics"
      ],
      
      example_workflow: {
        step1: "Customer registers: POST /api/customers/register",
        step2: "Gets API keys: { eth: 'sk_xxx', poly: 'sk_yyy', bsc: 'sk_zzz' }",
        step3: "Creates endpoint: POST /api/endpoints { name: 'My ETH', chainId: 'F003' }",
        step4: "Gets endpoint URL: https://pokt.ai/api/gateway?endpoint=pokt_xxx",
        step5: "Uses endpoint: POST endpoint_url with JSON-RPC request",
        step6: "System proxies to: http://135.125.163.236:4000/v1/rpc/eth with customer's API key"
      }
    }
  });
}

