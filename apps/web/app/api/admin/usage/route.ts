import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { zUsageQuery } from '@/lib/validations';
import { requireAdmin } from '@/lib/admin-auth';

const prisma = new PrismaClient();

// GET /api/admin/usage - Get usage statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = {
      from: searchParams.get('from') || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      to: searchParams.get('to') || new Date().toISOString(),
      granularity: searchParams.get('granularity') || 'hour',
      keyId: searchParams.get('keyId') || undefined,
      networkId: searchParams.get('networkId') || undefined,
    };

    const validatedQuery = zUsageQuery.parse(query);

    // Build where clause
    const whereClause: any = {
      tsMinute: {
        gte: new Date(validatedQuery.from),
        lte: new Date(validatedQuery.to),
      },
    };

    if (validatedQuery.keyId) {
      whereClause.apiKeyId = validatedQuery.keyId;
    }

    if (validatedQuery.networkId) {
      whereClause.networkId = validatedQuery.networkId;
    }

    // Aggregate usage data based on granularity
    let groupBy: any;
    let dateFormat: string;

    switch (validatedQuery.granularity) {
      case 'minute':
        groupBy = {
          tsMinute: true,
        };
        dateFormat = 'YYYY-MM-DD HH24:MI';
        break;
      case 'hour':
        groupBy = {
          hour: true,
        };
        dateFormat = 'YYYY-MM-DD HH24';
        break;
      case 'day':
        groupBy = {
          day: true,
        };
        dateFormat = 'YYYY-MM-DD';
        break;
      default:
        groupBy = {
          hour: true,
        };
        dateFormat = 'YYYY-MM-DD HH24';
    }

    // Get aggregated usage data
    const usageData = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('${validatedQuery.granularity}', "ts_minute") as period,
        SUM("count") as total_requests,
        AVG("latency_p50") as avg_latency_p50,
        AVG("latency_p95") as avg_latency_p95,
        AVG("error_rate") as avg_error_rate
      FROM "usage"
      WHERE "ts_minute" >= ${new Date(validatedQuery.from)}
        AND "ts_minute" <= ${new Date(validatedQuery.to)}
        ${validatedQuery.keyId ? `AND "api_key_id" = ${validatedQuery.keyId}` : ''}
        ${validatedQuery.networkId ? `AND "network_id" = ${validatedQuery.networkId}` : ''}
      GROUP BY DATE_TRUNC('${validatedQuery.granularity}', "ts_minute")
      ORDER BY period ASC
    `;

    // Get summary statistics
    const summary = await prisma.usage.aggregate({
      where: whereClause,
      _sum: {
        count: true,
      },
      _avg: {
        latencyP50: true,
        latencyP95: true,
        errorRate: true,
      },
    });

    return NextResponse.json({
      data: {
        usage: usageData,
        summary: {
          totalRequests: summary._sum.count || 0,
          avgLatencyP50: summary._avg.latencyP50 || 0,
          avgLatencyP95: summary._avg.latencyP95 || 0,
          avgErrorRate: summary._avg.errorRate || 0,
        },
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

    console.error('Error fetching usage data:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch usage data' } },
      { status: 500 }
    );
  }
}


