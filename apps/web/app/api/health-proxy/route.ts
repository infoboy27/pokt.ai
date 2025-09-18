import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Get health check data directly from database
    const healthChecks = await prisma.healthCheck.findMany({
      include: {
        endpoint: {
          select: {
            id: true,
            name: true,
            baseUrl: true,
          },
        },
      },
      orderBy: {
        checkedAt: 'desc',
      },
      take: 1000,
    });

    // Calculate health statistics
    const totalChecks = healthChecks.length;
    const successfulChecks = healthChecks.filter(check => check.ok).length;
    const successRate = totalChecks > 0 ? (successfulChecks / totalChecks) * 100 : 0;
    
    const avgLatency = healthChecks
      .filter(check => check.latencyMs !== null)
      .reduce((sum, check) => sum + (check.latencyMs || 0), 0) / 
      healthChecks.filter(check => check.latencyMs !== null).length || 0;

    // Group by endpoint for summary
    const endpointStats = healthChecks.reduce((acc, check) => {
      const endpointId = check.endpointId;
      if (!acc[endpointId]) {
        acc[endpointId] = {
          endpoint: check.endpoint,
          totalChecks: 0,
          successfulChecks: 0,
          avgLatency: 0,
          lastCheck: null,
        };
      }
      
      acc[endpointId].totalChecks++;
      if (check.ok) acc[endpointId].successfulChecks++;
      if (check.latencyMs) {
        acc[endpointId].avgLatency = (acc[endpointId].avgLatency + check.latencyMs) / 2;
      }
      if (!acc[endpointId].lastCheck || check.checkedAt > acc[endpointId].lastCheck) {
        acc[endpointId].lastCheck = check.checkedAt;
      }
      
      return acc;
    }, {} as any);

    const data = {
      data: {
        healthChecks,
        summary: {
          totalChecks,
          successfulChecks,
          successRate: Math.round(successRate * 100) / 100,
          avgLatency: Math.round(avgLatency * 100) / 100,
        },
        endpointStats: Object.values(endpointStats),
        query: {},
      },
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error('Health proxy error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch health data',
        data: {
          healthChecks: [],
          summary: { totalChecks: 0, successfulChecks: 0, successRate: 0, avgLatency: 0 }
        }
      },
      { status: 500 }
    );
  }
}
