import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsageService {
  constructor(private prisma: PrismaService) {}

  async getUsageStats(orgId: string, startDate: Date, endDate: Date) {
    // Get endpoint IDs for the organization
    const endpointIds = await this.prisma.endpoint.findMany({
      where: { orgId },
      select: { id: true },
    }).then(endpoints => endpoints.map(e => e.id));

    const usage = await this.prisma.usageDaily.findMany({
      where: {
        endpointId: {
          in: endpointIds,
        },
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const totalRelays = usage.reduce((sum, record) => sum + record.relays, 0);
    const avgLatency = usage.length > 0 
      ? usage.reduce((sum, record) => sum + record.p95ms, 0) / usage.length 
      : 0;
    const avgErrorRate = usage.length > 0
      ? usage.reduce((sum, record) => sum + record.errorRate, 0) / usage.length
      : 0;

    return {
      totalRelays,
      avgLatency: Math.round(avgLatency),
      avgErrorRate: Math.round(avgErrorRate * 100) / 100,
      dailyData: usage,
    };
  }

  async getUsageAnalytics(orgId: string, days: number = 7, endpointId?: string) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Get endpoint IDs for the organization
    let endpointIds: string[];
    if (endpointId) {
      // Verify the endpoint belongs to the organization
      const endpoint = await this.prisma.endpoint.findFirst({
        where: { id: endpointId, orgId },
        select: { id: true },
      });
      endpointIds = endpoint ? [endpointId] : [];
    } else {
      endpointIds = await this.prisma.endpoint.findMany({
        where: { orgId },
        select: { id: true },
      }).then(endpoints => endpoints.map(e => e.id));
    }

    if (endpointIds.length === 0) {
      // Return empty analytics if no endpoints
      return {
        totalRelays: 0,
        avgResponseTime: 0,
        errorRate: 0,
        activeEndpoints: 0,
        relayChangePercent: 0,
        latencyChangePercent: 0,
        errorChangePercent: 0,
        endpointChangeCount: 0,
        dailyData: [],
        endpointBreakdown: [],
        errorTrends: [],
      };
    }

    // Get current period usage
    const currentUsage = await this.prisma.usageDaily.findMany({
      where: {
        endpointId: { in: endpointIds },
        date: { gte: startDate },
      },
    });

    // Get previous period for comparison
    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - days);
    const previousUsage = await this.prisma.usageDaily.findMany({
      where: {
        endpointId: { in: endpointIds },
        date: { 
          gte: previousStartDate,
          lt: startDate,
        },
      },
    });

    // Calculate current period stats
    const totalRelays = currentUsage.reduce((sum, record) => sum + record.relays, 0);
    const avgLatency = currentUsage.length > 0 
      ? currentUsage.reduce((sum, record) => sum + record.p95ms, 0) / currentUsage.length 
      : 0;
    const avgErrorRate = currentUsage.length > 0
      ? currentUsage.reduce((sum, record) => sum + record.errorRate, 0) / currentUsage.length
      : 0;

    // Calculate previous period stats for comparison
    const prevTotalRelays = previousUsage.reduce((sum, record) => sum + record.relays, 0);
    const prevAvgLatency = previousUsage.length > 0 
      ? previousUsage.reduce((sum, record) => sum + record.p95ms, 0) / previousUsage.length 
      : 0;
    const prevAvgErrorRate = previousUsage.length > 0
      ? previousUsage.reduce((sum, record) => sum + record.errorRate, 0) / previousUsage.length
      : 0;

    // Calculate percentage changes
    const relayChangePercent = prevTotalRelays > 0 
      ? ((totalRelays - prevTotalRelays) / prevTotalRelays) * 100 
      : 0;
    const latencyChangePercent = prevAvgLatency > 0 
      ? ((avgLatency - prevAvgLatency) / prevAvgLatency) * 100 
      : 0;
    const errorChangePercent = prevAvgErrorRate > 0 
      ? ((avgErrorRate - prevAvgErrorRate) / prevAvgErrorRate) * 100 
      : 0;

    // Get active endpoints count
    const activeEndpoints = await this.prisma.endpoint.count({
      where: { 
        orgId,
        isActive: true,
      },
    });

    // Get endpoints created this month
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    
    const endpointChangeCount = await this.prisma.endpoint.count({
      where: {
        orgId,
        createdAt: { gte: thisMonth },
      },
    });

    // Format daily data for charts
    const dailyData = this.formatDailyData(currentUsage, days);

    // Get endpoint breakdown
    const endpointBreakdown = await this.getEndpointBreakdown(orgId, days);

    // Get error trends
    const errorTrends = this.formatErrorTrends(currentUsage, days);

    return {
      totalRelays,
      avgResponseTime: Math.round(avgLatency),
      errorRate: Math.round(avgErrorRate * 10000) / 100, // Convert to percentage with 2 decimal places
      activeEndpoints,
      relayChangePercent: Math.round(relayChangePercent * 10) / 10,
      latencyChangePercent: Math.round(latencyChangePercent * 10) / 10,
      errorChangePercent: Math.round(errorChangePercent * 100) / 100,
      endpointChangeCount,
      dailyData,
      endpointBreakdown,
      errorTrends,
    };
  }

  async getEndpointBreakdown(orgId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const endpointIds = await this.prisma.endpoint.findMany({
      where: { orgId },
      select: { id: true, name: true },
    });

    const endpointUsage = await this.prisma.usageDaily.findMany({
      where: {
        endpointId: { in: endpointIds.map(e => e.id) },
        date: { gte: startDate },
      },
    });

    // Group by endpoint
    const breakdown = endpointUsage.reduce((acc, record) => {
      const endpointId = record.endpointId;
      if (!acc[endpointId]) {
        acc[endpointId] = {
          endpointId,
          name: endpointIds.find(e => e.id === endpointId)?.name || 'Unknown',
          relays: 0,
          latency: 0,
          errors: 0,
          count: 0,
        };
      }
      acc[endpointId].relays += record.relays;
      acc[endpointId].latency += record.p95ms;
      acc[endpointId].errors += record.errorRate;
      acc[endpointId].count += 1;
      return acc;
    }, {} as Record<string, any>);

    const totalRelays = Object.values(breakdown).reduce((sum: number, item: any) => sum + item.relays, 0);

    return Object.values(breakdown).map((item: any) => ({
      name: item.name,
      relays: item.relays,
      percentage: totalRelays > 0 ? Math.round((item.relays / totalRelays) * 100) : 0,
      avgLatency: Math.round(item.latency / item.count),
      avgErrorRate: Math.round((item.errors / item.count) * 10000) / 100,
    })).sort((a, b) => b.relays - a.relays);
  }

  async getUsageTrends(orgId: string, days: number = 7, granularity: 'hourly' | 'daily' = 'daily') {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const endpointIds = await this.prisma.endpoint.findMany({
      where: { orgId },
      select: { id: true },
    }).then(endpoints => endpoints.map(e => e.id));

    if (granularity === 'daily') {
      const usage = await this.prisma.usageDaily.findMany({
        where: {
          endpointId: { in: endpointIds },
          date: { gte: startDate },
        },
        orderBy: { date: 'asc' },
      });

      return this.formatDailyData(usage, days);
    } else {
      // For hourly data, we'd need to use the Usage table instead of UsageDaily
      // This would require more complex aggregation
      const usage = await this.prisma.usage.findMany({
        where: {
          apiKey: {
            endpoint: {
              orgId,
            },
          },
          tsMinute: { gte: startDate },
        },
        orderBy: { tsMinute: 'asc' },
      });

      return this.formatHourlyData(usage, days);
    }
  }

  private formatDailyData(usage: any[], days: number) {
    const dataMap = new Map();
    
    // Initialize all days with zero values
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dataMap.set(dateStr, {
        date: dateStr,
        relays: 0,
        latency: 0,
        errors: 0,
        count: 0,
      });
    }

    // Fill in actual data
    usage.forEach(record => {
      const dateStr = record.date.toISOString().split('T')[0];
      if (dataMap.has(dateStr)) {
        const dayData = dataMap.get(dateStr);
        dayData.relays += record.relays;
        dayData.latency += record.p95ms;
        dayData.errors += record.errorRate;
        dayData.count += 1;
      }
    });

    // Calculate averages and return array
    return Array.from(dataMap.values()).map(dayData => ({
      date: dayData.date,
      relays: dayData.relays,
      latency: dayData.count > 0 ? Math.round(dayData.latency / dayData.count) : 0,
      errors: dayData.count > 0 ? Math.round((dayData.errors / dayData.count) * 10000) / 100 : 0,
    }));
  }

  private formatErrorTrends(usage: any[], days: number) {
    const dataMap = new Map();
    
    // Initialize all days with zero values
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dataMap.set(dateStr, {
        date: dateStr,
        errorRate: 0,
        count: 0,
      });
    }

    // Fill in actual data
    usage.forEach(record => {
      const dateStr = record.date.toISOString().split('T')[0];
      if (dataMap.has(dateStr)) {
        const dayData = dataMap.get(dateStr);
        dayData.errorRate += record.errorRate;
        dayData.count += 1;
      }
    });

    // Calculate averages and return array
    return Array.from(dataMap.values()).map(dayData => ({
      date: dayData.date,
      errors: dayData.count > 0 ? Math.round((dayData.errorRate / dayData.count) * 10000) / 100 : 0,
    }));
  }

  private formatHourlyData(usage: any[], days: number) {
    // This would format hourly data from the Usage table
    // For now, return empty array as hourly aggregation is more complex
    return [];
  }
}
