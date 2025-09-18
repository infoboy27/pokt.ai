import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { zHealthQuery } from '@/lib/validations';
import { requireAdmin } from '@/lib/admin-auth';

const prisma = new PrismaClient();

// GET /api/admin/health - Get health check data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = {
      endpointId: searchParams.get('endpointId') || undefined,
      from: searchParams.get('from') || undefined,
      to: searchParams.get('to') || undefined,
    };

    const validatedQuery = zHealthQuery.parse(query);

    // Build where clause
    const whereClause: any = {};

    if (validatedQuery.endpointId) {
      whereClause.endpointId = validatedQuery.endpointId;
    }

    if (validatedQuery.from && validatedQuery.to) {
      whereClause.checkedAt = {
        gte: new Date(validatedQuery.from),
        lte: new Date(validatedQuery.to),
      };
    } else {
      // Default to last 24 hours if no date range specified
      whereClause.checkedAt = {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
      };
    }

    // Get health check data
    const healthChecks = await prisma.healthCheck.findMany({
      where: whereClause,
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
      take: 1000, // Limit to prevent large responses
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

    return NextResponse.json({
      data: {
        healthChecks,
        summary: {
          totalChecks,
          successfulChecks,
          successRate: Math.round(successRate * 100) / 100,
          avgLatency: Math.round(avgLatency * 100) / 100,
        },
        endpointStats: Object.values(endpointStats),
        query: validatedQuery,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid query parameters' } },
        { status: 400 }
      );
    }

    console.error('Error fetching health data:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch health data' } },
      { status: 500 }
    );
  }
}


