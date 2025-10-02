import { NextRequest, NextResponse } from 'next/server';
import { endpointQueries, usageQueries } from '@/lib/database';
import { gatewayRateLimit, withRateLimit } from '@/lib/rate-limit';

// Map chain IDs to your RPC provider server endpoints
const chainRpcMapping: Record<string, string> = {
  // Ethereum
  '1': 'http://135.125.163.236:4000/v1/rpc/eth',
  'eth': 'http://135.125.163.236:4000/v1/rpc/eth',
  'F003': 'http://135.125.163.236:4000/v1/rpc/eth',
  
  // Polygon
  '137': 'http://135.125.163.236:4000/v1/rpc/poly',
  'poly': 'http://135.125.163.236:4000/v1/rpc/poly',
  'F00C': 'http://135.125.163.236:4000/v1/rpc/poly',
  
  // BSC
  '56': 'http://135.125.163.236:4000/v1/rpc/bsc',
  'bsc': 'http://135.125.163.236:4000/v1/rpc/bsc',
  'F00B': 'http://135.125.163.236:4000/v1/rpc/bsc',
  
  // Arbitrum
  '42161': 'http://135.125.163.236:4000/v1/rpc/arb-one',
  'arb-one': 'http://135.125.163.236:4000/v1/rpc/arb-one',
  'F00A': 'http://135.125.163.236:4000/v1/rpc/arb-one',
  
  // Optimism
  '10': 'http://135.125.163.236:4000/v1/rpc/opt',
  'opt': 'http://135.125.163.236:4000/v1/rpc/opt',
  'F00E': 'http://135.125.163.236:4000/v1/rpc/opt',
  
  // Base
  '8453': 'http://135.125.163.236:4000/v1/rpc/base',
  'base': 'http://135.125.163.236:4000/v1/rpc/base',
  
  // Avalanche
  '43114': 'http://135.125.163.236:4000/v1/rpc/avax',
  'avax': 'http://135.125.163.236:4000/v1/rpc/avax',
  'AVAX': 'http://135.125.163.236:4000/v1/rpc/avax',
  
  // Solana
  'solana': 'http://135.125.163.236:4000/v1/rpc/solana',
};

// POST /api/gateway?endpoint=<endpointId> - RPC Gateway with Permanent Storage & Billing
export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await withRateLimit(request, gatewayRateLimit);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const startTime = Date.now();
  let endpointId: string | null = null;
  let endpoint: any = null;
  
  try {
    const { searchParams } = new URL(request.url);
    endpointId = searchParams.get('endpoint');
    
    // Also check for endpoint ID in header (from Traefik rewrite)
    if (!endpointId) {
      endpointId = request.headers.get('X-Endpoint-ID');
    }
    
    if (!endpointId) {
      return NextResponse.json(
        { 
          jsonrpc: '2.0',
          error: { 
            code: -32001, 
            message: 'Endpoint ID is required as query parameter: ?endpoint=<endpointId>' 
          },
          id: null 
        },
        { status: 400 }
      );
    }
    
    // Look up the endpoint in PostgreSQL database
    endpoint = await endpointQueries.findById(endpointId);

    if (!endpoint) {
      return NextResponse.json(
        { 
          jsonrpc: '2.0',
          error: { 
            code: -32001, 
            message: `Endpoint '${endpointId}' not found. Create endpoints at /api/endpoints` 
          },
          id: null 
        },
        { status: 404 }
      );
    }

    if (!endpoint.is_active) {
      return NextResponse.json(
        { 
          jsonrpc: '2.0',
          error: { 
            code: -32002, 
            message: 'Endpoint is not active' 
          },
          id: null 
        },
        { status: 403 }
      );
    }

    // Get the RPC URL for this chain (default to Ethereum if chain_id is null)
    const chainId = endpoint.chain_id || 'eth';
    const rpcUrl = chainRpcMapping[chainId];
    if (!rpcUrl) {
      return NextResponse.json(
        { 
          jsonrpc: '2.0',
          error: { 
            code: -32003, 
            message: `Chain '${chainId}' not supported` 
          },
          id: null 
        },
        { status: 400 }
      );
    }

    // Get the JSON-RPC request body
    const requestBody = await request.json();
    
    // Validate JSON-RPC format
    if (!requestBody.jsonrpc || !requestBody.method) {
      return NextResponse.json(
        { 
          jsonrpc: '2.0',
          error: { 
            code: -32600, 
            message: 'Invalid JSON-RPC request' 
          },
          id: requestBody.id || null 
        },
        { status: 400 }
      );
    }

    // Forward the request to your RPC provider server with static API key
        const response = await fetch(rpcUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': process.env.STATIC_API_KEY || 'sk_pokt_ai_static_key', // Use static API key for all requests
          },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(30000),
    });

    const responseText = await response.text();
    const latency = Date.now() - startTime;


    // Try to parse as JSON
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { 
        jsonrpc: '2.0',
        error: { 
          code: -32700, 
          message: 'Parse error from upstream RPC' 
        },
        id: requestBody.id || null 
      };
    }

    // Track relay for billing (async, don't wait)
    const isSuccess = response.ok && !responseData.error;
    
    // Log to console (existing)
    usageQueries.logUsage({
      apiKeyId: endpointId, // Use endpoint ID, not API key
      relayCount: 1,
      responseTime: latency,
      method: requestBody?.method || 'unknown',
      networkId: 'eth' // Default to ethereum
    });

    // Also log to real usage tracking system
    fetch('http://localhost:4000/api/usage/real', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpointId: endpointId,
        apiKey: endpoint.token,
        method: requestBody?.method || 'unknown',
        latency: latency
      })
    });

    // Add metadata headers with billing info
    const headers = new Headers({
      'Content-Type': 'application/json',
      'X-RPC-Latency': latency.toString(),
      'X-Powered-By': 'pokt.ai',
      'X-Endpoint-ID': endpointId,
      'X-Chain-ID': endpoint.chain_id,
      'X-Network': endpoint.name,
      'X-Relay-Tracked': 'true',
      'X-Total-Relays': '0', // TODO: Get from usage table
      'X-Monthly-Relays': '0', // TODO: Get from usage table
      'X-Billing-Enabled': 'true',
    });

    // Log for monitoring

    return new NextResponse(JSON.stringify(responseData), {
      status: response.ok ? 200 : response.status,
      headers,
    });

  } catch (error) {
    const latency = Date.now() - startTime;
    
    // Log failed request for billing
    if (endpointId) {
      usageQueries.logUsage({
        apiKeyId: endpointId,
        relayCount: 1,
        responseTime: 0
      });
    }
    
    return NextResponse.json(
      { 
        jsonrpc: '2.0',
        error: { 
          code: -32603, 
          message: 'Internal gateway error' 
        },
        id: null 
      },
      { status: 500 }
    );
  }
}