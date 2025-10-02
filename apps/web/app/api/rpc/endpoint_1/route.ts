import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get the JSON-RPC request body
    const requestBody = await request.json();

    // Forward to Ethereum RPC
    const rpcUrl = 'https://ethereum-rpc.publicnode.com';
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
      responseData = { error: 'Invalid JSON response', raw: responseText };
    }

    // Add metadata headers
    const headers = new Headers({
      'Content-Type': 'application/json',
      'X-RPC-Latency': latency.toString(),
      'X-Powered-By': 'pokt.ai',
      'X-Network': 'ethereum-mainnet',
    });

    return new NextResponse(JSON.stringify(responseData), {
      status: response.status,
      headers,
    });

  } catch (error) {
    return NextResponse.json(
      { 
        error: 'RPC request failed', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: 'endpoint_1',
    network: 'ethereum-mainnet',
    status: 'active',
    description: 'Ethereum Mainnet RPC endpoint proxied through pokt.ai',
  });
}









