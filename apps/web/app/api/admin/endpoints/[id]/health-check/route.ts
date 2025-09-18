import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    
    // Find the endpoint
    const endpoint = await prisma.endpoint.findUnique({
      where: { id },
    });

    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
    }

    // Perform health check
    const startTime = Date.now();
    let isHealthy = false;
    let statusCode = 0;
    let responseTime = 0;
    let error = null;

    try {
      const response = await fetch(endpoint.healthUrl, {
        method: 'GET',
        timeout: 5000,
        headers: {
          'User-Agent': 'pokt.ai-health-check/1.0',
        },
      });
      
      responseTime = Date.now() - startTime;
      statusCode = response.status;
      isHealthy = response.ok;
      
      if (!response.ok) {
        error = `HTTP ${response.status}: ${response.statusText}`;
      }
    } catch (err: any) {
      responseTime = Date.now() - startTime;
      error = err.message;
      isHealthy = false;
    }

    // Store health check result
    const healthCheck = await prisma.healthCheck.create({
      data: {
        endpointId: endpoint.id,
        ok: isHealthy,
        httpStatus: statusCode,
        latencyMs: responseTime,
        meta: {
          error,
          checkedAt: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        endpoint: endpoint.name,
        healthy: isHealthy,
        statusCode,
        responseTime: `${responseTime}ms`,
        error,
        healthCheckId: healthCheck.id,
      },
    });

  } catch (error: any) {
    console.error('Health check error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}