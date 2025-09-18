import { NextRequest, NextResponse } from 'next/server';
import { getPermanentEndpoint, logRelay } from '@/lib/simple-database';

// Map chain IDs to actual RPC URLs
const chainRpcMapping: Record<string, string> = {
  'F003': 'https://ethereum-rpc.publicnode.com',     // Ethereum Mainnet
  'F00C': 'https://polygon-rpc.com',                 // Polygon
  'F00B': 'https://bsc-dataseed.binance.org',        // BSC
  'F00A': 'https://arb1.arbitrum.io/rpc',           // Arbitrum
  'F00E': 'https://mainnet.optimism.io',             // Optimism
};

// POST /api/gateway?endpoint=<endpointId> - RPC Gateway with Permanent Storage & Billing
export async function POST(request: NextRequest) {
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
    
    // Look up the endpoint in permanent storage
    endpoint = getPermanentEndpoint(endpointId);

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

    if (endpoint.status !== 'active') {
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

    // Get the RPC URL for this chain
    const rpcUrl = chainRpcMapping[endpoint.chainId];
    if (!rpcUrl) {
      return NextResponse.json(
        { 
          jsonrpc: '2.0',
          error: { 
            code: -32003, 
            message: `Chain '${endpoint.chainId}' not supported` 
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

    // Forward the request to the actual RPC endpoint
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
    logRelay(endpointId, requestBody.method, latency, isSuccess);

    // Add metadata headers with billing info
    const headers = new Headers({
      'Content-Type': 'application/json',
      'X-RPC-Latency': latency.toString(),
      'X-Powered-By': 'pokt.ai',
      'X-Endpoint-ID': endpointId,
      'X-Chain-ID': endpoint.chainId,
      'X-Network': endpoint.name,
      'X-Relay-Tracked': 'true',
      'X-Total-Relays': endpoint.totalRelays.toString(),
      'X-Monthly-Relays': endpoint.monthlyRelays.toString(),
      'X-Billing-Enabled': 'true',
    });

    // Log for monitoring
    console.log(`[pokt.ai] RELAY TRACKED: ${endpointId} -> ${requestBody.method} (${latency}ms) [${isSuccess ? 'SUCCESS' : 'ERROR'}] [Total: ${endpoint.totalRelays + 1}]`);

    return new NextResponse(JSON.stringify(responseData), {
      status: response.ok ? 200 : response.status,
      headers,
    });

  } catch (error) {
    const latency = Date.now() - startTime;
    console.error('Gateway Error:', error);
    
    // Log failed request for billing
    if (endpointId) {
      logRelay(endpointId, 'unknown', latency, false);
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