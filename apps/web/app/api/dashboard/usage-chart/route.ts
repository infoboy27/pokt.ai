import { NextRequest, NextResponse } from 'next/server';
import { usageQueries } from '@/lib/database';

// GET /api/dashboard/usage-chart - Get usage chart data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');
    const orgId = request.headers.get('X-Organization-ID') || 'org-1';

    // Generate chart data for the last N days
    const chartData = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // For now, generate realistic sample data based on current usage
      // In production, this would query the usage_daily table for each date
      const baseRelays = 2000; // Base relays per day
      const variation = Math.random() * 0.5; // ±50% variation
      const relays = Math.floor(baseRelays * (1 + variation));
      
      chartData.push({
        date: dateStr,
        relays: relays,
        latency: Math.floor(40 + Math.random() * 20), // 40-60ms latency
        errors: Math.random() * 2 // 0-2 errors per day
      });
    }


    return NextResponse.json(chartData);

  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to fetch usage chart data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
