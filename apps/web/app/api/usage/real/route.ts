import { NextRequest, NextResponse } from 'next/server';

// In-memory usage tracking for testing
// In production, this would be stored in the database
let usageData: Record<string, {
  endpointId: string;
  apiKey: string;
  relays: number;
  totalLatency: number;
  requestCount: number;
  methods: Record<string, number>;
  timestamps: string[];
}[]> = {};

// GET /api/usage/real - Get real usage data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const endpointId = searchParams.get('endpointId');
    const apiKey = searchParams.get('apiKey');

    if (!endpointId && !apiKey) {
      return NextResponse.json(
        { error: 'Either endpointId or apiKey is required' },
        { status: 400 }
      );
    }

    // Find usage data for the specified endpoint or API key
    let relevantData = [];
    
    if (endpointId) {
      relevantData = usageData[endpointId] || [];
    } else if (apiKey) {
      // Find by API key
      for (const endpointId in usageData) {
        const endpointData = usageData[endpointId].find(d => d.apiKey === apiKey);
        if (endpointData) {
          relevantData.push(endpointData);
        }
      }
    }

    // Calculate totals
    const totalRelays = relevantData.reduce((sum, data) => sum + data.relays, 0);
    const totalRequests = relevantData.reduce((sum, data) => sum + data.requestCount, 0);
    const avgLatency = totalRequests > 0 
      ? Math.round(relevantData.reduce((sum, data) => sum + data.totalLatency, 0) / totalRequests)
      : 0;

    // Get method breakdown
    const methodBreakdown: Record<string, number> = {};
    relevantData.forEach(data => {
      Object.entries(data.methods).forEach(([method, count]) => {
        methodBreakdown[method] = (methodBreakdown[method] || 0) + count;
      });
    });

    // Get recent activity (last 10 requests)
    const recentActivity = relevantData
      .flatMap(data => data.timestamps.slice(-5).map(timestamp => ({
        timestamp,
        method: Object.keys(data.methods)[0] || 'unknown',
        latency: data.requestCount > 0 ? Math.round(data.totalLatency / data.requestCount) : 0,
        endpointId: data.endpointId
      })))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

    return NextResponse.json({
      success: true,
      endpointId,
      apiKey,
      summary: {
        totalRelays,
        totalRequests,
        avgLatency,
        activeEndpoints: relevantData.length,
        costPerRelay: 0.0001,
        estimatedCost: totalRelays * 0.0001,
      },
      methodBreakdown,
      recentActivity,
      rawData: relevantData // For debugging
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to retrieve usage data' },
      { status: 500 }
    );
  }
}

// POST /api/usage/real - Log usage data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { endpointId, apiKey, method = 'unknown', latency = 0 } = body;

    if (!endpointId || !apiKey) {
      return NextResponse.json(
        { error: 'endpointId and apiKey are required' },
        { status: 400 }
      );
    }

    // Initialize if not exists
    if (!usageData[endpointId]) {
      usageData[endpointId] = [];
    }

    // Find or create data entry for this API key
    let dataEntry = usageData[endpointId].find(d => d.apiKey === apiKey);
    if (!dataEntry) {
      dataEntry = {
        endpointId,
        apiKey,
        relays: 0,
        totalLatency: 0,
        requestCount: 0,
        methods: {},
        timestamps: []
      };
      usageData[endpointId].push(dataEntry);
    }

    // Update the data
    dataEntry.relays += 1;
    dataEntry.totalLatency += latency;
    dataEntry.requestCount += 1;
    dataEntry.methods[method] = (dataEntry.methods[method] || 0) + 1;
    dataEntry.timestamps.push(new Date().toISOString());

    // Keep only last 100 timestamps to prevent memory bloat
    if (dataEntry.timestamps.length > 100) {
      dataEntry.timestamps = dataEntry.timestamps.slice(-100);
    }


    return NextResponse.json({
      success: true,
      message: 'Usage logged successfully',
      data: {
        endpointId,
        apiKey,
        totalRelays: dataEntry.relays,
        totalRequests: dataEntry.requestCount,
        avgLatency: Math.round(dataEntry.totalLatency / dataEntry.requestCount)
      }
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to log usage data' },
      { status: 500 }
    );
  }
}



