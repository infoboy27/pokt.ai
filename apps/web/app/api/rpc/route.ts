import { NextRequest, NextResponse } from 'next/server';
import { getEndpointById } from '@/lib/endpoint-storage';

// Map chain IDs to actual RPC URLs
const chainRpcMapping: Record<string, string> = {
  'F003': 'https://ethereum-rpc.publicnode.com',     // Ethereum Mainnet
  'F00C': 'https://polygon-rpc.com',                 // Polygon
  'F00B': 'https://bsc-dataseed.binance.org',        // BSC
  'F00A': 'https://arb1.arbitrum.io/rpc',           // Arbitrum
  'F00E': 'https://mainnet.optimism.io',             // Optimism
};

// Handle all RPC requests through URL path parsing
export async function POST(request: NextRequest) {
  try {
    // Debug: Log the incoming request
    const url = new URL(request.url);
    
    // Extract endpoint ID from the URL path
    const pathParts = url.pathname.split('/');
    
    // The URL should be /api/rpc/endpointId, so endpointId is at index 3
    const endpointId = pathParts[3]; // /api/rpc/endpointId -> index 3

    if (!endpointId || endpointId === 'rpc') {
      return NextResponse.json(
        { 
          jsonrpc: '2.0',
          error: { 
            code: -32001, 
            message: `No endpoint ID found in path. URL: ${url.pathname}, Expected: /api/rpc/<endpointId>` 
          },
          id: null 
        },
        { status: 400 }
      );
    }
    
    // Look up the endpoint
    const endpoint = getEndpointById(endpointId);

    if (!endpoint) {
      return NextResponse.json(
        { 
          jsonrpc: '2.0',
          error: { 
            code: -32001, 
            message: `Endpoint '${endpointId}' not found. Available endpoints: endpoint_1, endpoint_2, endpoint_3, or create new ones at /api/endpoints` 
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
    const startTime = Date.now();
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

    // Add metadata headers
    const headers = new Headers({
      'Content-Type': 'application/json',
      'X-RPC-Latency': latency.toString(),
      'X-Powered-By': 'pokt.ai',
      'X-Endpoint-ID': endpointId,
      'X-Chain-ID': endpoint.chainId,
      'X-Network': endpoint.name,
    });

    // Log usage for monitoring

    return new NextResponse(JSON.stringify(responseData), {
      status: response.ok ? 200 : response.status,
      headers,
    });

  } catch (error) {
    return NextResponse.json(
      { 
        jsonrpc: '2.0',
        error: { 
          code: -32603, 
          message: 'Internal error' 
        },
        id: null 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    service: 'pokt.ai RPC Proxy',
    usage: 'POST /api/rpc/<endpointId>',
    endpoints: {
      create: 'POST /api/endpoints',
      list: 'GET /api/endpoints', 
    },
    documentation: 'https://pokt.ai/docs',
  });
}