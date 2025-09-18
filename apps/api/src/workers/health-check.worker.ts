import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface HealthCheckResult {
  ok: boolean;
  httpStatus?: number;
  latencyMs?: number;
  error?: string;
}

class HealthCheckWorker {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  async start(intervalMs: number = 60000) {
    if (this.isRunning) {
      console.log('Health check worker is already running');
      return;
    }

    console.log(`Starting health check worker with ${intervalMs}ms interval`);
    this.isRunning = true;

    // Run immediately
    await this.runHealthChecks();

    // Then run on interval
    this.intervalId = setInterval(async () => {
      await this.runHealthChecks();
    }, intervalMs);
  }

  async stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('Health check worker stopped');
  }

  private async runHealthChecks() {
    try {
      console.log('Running health checks...');
      
      const endpoints = await prisma.endpoint.findMany({
        where: {
          isActive: true,
        },
      });

      const healthCheckPromises = endpoints.map(endpoint => 
        this.checkEndpointHealth(endpoint.id, endpoint.healthUrl)
      );

      const results = await Promise.allSettled(healthCheckPromises);
      
      let successCount = 0;
      let failureCount = 0;

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successCount++;
        } else {
          failureCount++;
          console.error(`Health check failed for endpoint ${endpoints[index].name}:`, result.reason);
        }
      });

      console.log(`Health checks completed: ${successCount} successful, ${failureCount} failed`);
    } catch (error) {
      console.error('Error running health checks:', error);
    }
  }

  private async checkEndpointHealth(endpointId: string, healthUrl: string): Promise<void> {
    const startTime = Date.now();
    let result: HealthCheckResult;

    try {
      const response = await fetch(healthUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      const latencyMs = Date.now() - startTime;
      const ok = response.ok;

      result = {
        ok,
        httpStatus: response.status,
        latencyMs,
      };

      // Store health check result
      await prisma.healthCheck.create({
        data: {
          endpointId,
          ok,
          httpStatus: response.status,
          latencyMs,
          checkedAt: new Date(),
          meta: {
            url: healthUrl,
            responseTime: latencyMs,
          },
        },
      });

      console.log(`Health check for endpoint ${endpointId}: ${ok ? 'OK' : 'FAILED'} (${latencyMs}ms)`);
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      
      result = {
        ok: false,
        latencyMs,
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      // Store failed health check
      await prisma.healthCheck.create({
        data: {
          endpointId,
          ok: false,
          latencyMs,
          checkedAt: new Date(),
          meta: {
            url: healthUrl,
            error: result.error,
          },
        },
      });

      console.error(`Health check failed for endpoint ${endpointId}:`, result.error);
    }
  }
}

// Create and export worker instance
export const healthCheckWorker = new HealthCheckWorker();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Received SIGINT, stopping health check worker...');
  await healthCheckWorker.stop();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, stopping health check worker...');
  await healthCheckWorker.stop();
  await prisma.$disconnect();
  process.exit(0);
});

// Start worker if this file is run directly
if (require.main === module) {
  healthCheckWorker.start(60000); // Run every minute
}


