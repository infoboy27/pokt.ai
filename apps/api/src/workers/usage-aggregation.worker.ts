import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class UsageAggregationWorker {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  async start(intervalMs: number = 300000) { // 5 minutes
    if (this.isRunning) {
      console.log('Usage aggregation worker is already running');
      return;
    }

    console.log(`Starting usage aggregation worker with ${intervalMs}ms interval`);
    this.isRunning = true;

    // Run immediately
    await this.aggregateUsage();

    // Then run on interval
    this.intervalId = setInterval(async () => {
      await this.aggregateUsage();
    }, intervalMs);
  }

  async stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('Usage aggregation worker stopped');
  }

  private async aggregateUsage() {
    try {
      console.log('Aggregating usage data...');
      
      // Get all usage records that need aggregation
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      
      // Find usage records older than 1 hour that haven't been aggregated
      const usageRecords = await prisma.usage.findMany({
        where: {
          tsMinute: {
            lt: oneHourAgo,
          },
        },
        orderBy: {
          tsMinute: 'asc',
        },
        take: 1000, // Process in batches
      });

      if (usageRecords.length === 0) {
        console.log('No usage records to aggregate');
        return;
      }

      // Group by hour for aggregation
      const hourlyData = new Map<string, {
        apiKeyId: string;
        networkId?: string;
        hour: Date;
        totalCount: number;
        totalLatency: number;
        latencyCount: number;
        totalErrors: number;
        totalRequests: number;
      }>();

      for (const record of usageRecords) {
        const hour = new Date(record.tsMinute);
        hour.setMinutes(0, 0, 0); // Round down to hour
        
        const key = `${record.apiKeyId}-${record.networkId || 'null'}-${hour.toISOString()}`;
        
        if (!hourlyData.has(key)) {
          hourlyData.set(key, {
            apiKeyId: record.apiKeyId,
            networkId: record.networkId || undefined,
            hour,
            totalCount: 0,
            totalLatency: 0,
            latencyCount: 0,
            totalErrors: 0,
            totalRequests: 0,
          });
        }

        const data = hourlyData.get(key)!;
        data.totalCount += record.count;
        data.totalRequests += record.count;
        
        if (record.latencyP50) {
          data.totalLatency += record.latencyP50 * record.count;
          data.latencyCount += record.count;
        }
        
        if (record.errorRate) {
          data.totalErrors += record.errorRate * record.count;
        }
      }

      // Create hourly aggregated records
      for (const [key, data] of hourlyData) {
        await prisma.usage.upsert({
          where: {
            apiKeyId_tsMinute: {
              apiKeyId: data.apiKeyId,
              tsMinute: data.hour,
            },
          },
          update: {
            count: {
              increment: data.totalCount,
            },
            latencyP50: data.latencyCount > 0 ? data.totalLatency / data.latencyCount : undefined,
            latencyP95: data.latencyCount > 0 ? data.totalLatency / data.latencyCount : undefined, // Simplified
            errorRate: data.totalRequests > 0 ? data.totalErrors / data.totalRequests : 0,
          },
          create: {
            apiKeyId: data.apiKeyId,
            networkId: data.networkId,
            tsMinute: data.hour,
            count: data.totalCount,
            latencyP50: data.latencyCount > 0 ? data.totalLatency / data.latencyCount : undefined,
            latencyP95: data.latencyCount > 0 ? data.totalLatency / data.latencyCount : undefined,
            errorRate: data.totalRequests > 0 ? data.totalErrors / data.totalRequests : 0,
          },
        });
      }

      // Clean up old minute-level records (keep only last 24 hours)
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      const deletedCount = await prisma.usage.deleteMany({
        where: {
          tsMinute: {
            lt: twentyFourHoursAgo,
          },
        },
      });

      console.log(`Usage aggregation completed: ${hourlyData.size} hourly records created, ${deletedCount.count} old records cleaned up`);
    } catch (error) {
      console.error('Error aggregating usage data:', error);
    }
  }
}

// Create and export worker instance
export const usageAggregationWorker = new UsageAggregationWorker();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Received SIGINT, stopping usage aggregation worker...');
  await usageAggregationWorker.stop();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, stopping usage aggregation worker...');
  await usageAggregationWorker.stop();
  await prisma.$disconnect();
  process.exit(0);
});

// Start worker if this file is run directly
if (require.main === module) {
  usageAggregationWorker.start(300000); // Run every 5 minutes
}


