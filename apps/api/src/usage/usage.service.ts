import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsageService {
  constructor(private prisma: PrismaService) {}

  async getUsageStats(orgId: string, startDate: Date, endDate: Date) {
    const usage = await this.prisma.usageDaily.findMany({
      where: {
        endpoint: {
          orgId,
        },
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        endpoint: true,
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
}
