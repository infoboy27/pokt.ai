import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { zJsonRpcRequest } from '@/lib/validations';
import { requireAdmin } from '@/lib/admin-auth';

const prisma = new PrismaClient();

// POST /api/admin/test-rpc - Test JSON-RPC request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { networkId, request: rpcRequest, apiKey } = body;

    // Validate JSON-RPC request
    const validatedRequest = zJsonRpcRequest.parse(rpcRequest);

    // Mock networks mapping with public RPC endpoints
    const mockNetworks: Record<string, { id: string; code: string; chainId: number; rpcUrl: string }> = {
      '1': { id: '1', code: 'eth', chainId: 1, rpcUrl: 'https://ethereum-rpc.publicnode.com' },
      '2': { id: '2', code: 'avax', chainId: 43114, rpcUrl: 'https://api.avax.network/ext/bc/C/rpc' },
      '3': { id: '3', code: 'bsc', chainId: 56, rpcUrl: 'https://bsc-dataseed.binance.org/' },
      '4': { id: '4', code: 'opt', chainId: 10, rpcUrl: 'https://mainnet.optimism.io' },
      '5': { id: '5', code: 'arb-one', chainId: 42161, rpcUrl: 'https://arb1.arbitrum.io/rpc' },
      '6': { id: '6', code: 'base', chainId: 8453, rpcUrl: 'https://mainnet.base.org' },
      '7': { id: '7', code: 'poly', chainId: 137, rpcUrl: 'https://polygon-rpc.com' },
    };

    const network = mockNetworks[networkId];

    if (!network) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Network not found' } },
        { status: 404 }
      );
    }

    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add API key if provided
    if (apiKey) {
      headers['X-API-Key'] = apiKey;
    }

    // Make the JSON-RPC request
    const startTime = Date.now();
    let response;
    let error;

    try {
      response = await fetch(network.rpcUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(validatedRequest),
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      const responseText = await response.text();
      const latency = Date.now() - startTime;

      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = { raw: responseText };
      }

      return NextResponse.json({
        data: {
          success: response.ok,
          status: response.status,
          latency,
          request: validatedRequest,
          response: responseData,
          network: {
            id: network.id,
            code: network.code,
            chainId: network.chainId,
            rpcUrl: network.rpcUrl,
          },
        },
      });
    } catch (fetchError) {
      const latency = Date.now() - startTime;
      error = fetchError instanceof Error ? fetchError.message : 'Unknown error';

      return NextResponse.json({
        data: {
          success: false,
          status: 0,
          latency,
          request: validatedRequest,
          error,
          network: {
            id: network.id,
            code: network.code,
            chainId: network.chainId,
            rpcUrl: network.rpcUrl,
          },
        },
      });
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid JSON-RPC request' } },
        { status: 400 }
      );
    }

    console.error('Error testing RPC request:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to test RPC request' } },
      { status: 500 }
    );
  }
}


