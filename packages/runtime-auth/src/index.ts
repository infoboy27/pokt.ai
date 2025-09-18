import { verify } from 'argon2';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthResult {
  success: boolean;
  apiKey?: {
    id: string;
    label: string;
    rpsLimit: number;
    rpdLimit: number;
    rpmLimit: number;
    endpointId: string;
  };
  error?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  error?: string;
}

export class RuntimeAuth {
  private redis: any; // Redis client for rate limiting

  constructor(redisClient?: any) {
    this.redis = redisClient;
  }

  /**
   * Authenticate API key from request headers
   */
  async authenticateApiKey(apiKey: string): Promise<AuthResult> {
    try {
      // Find API key by hash
      const apiKeyRecord = await prisma.apiKey.findFirst({
        where: {
          isActive: true,
        },
        include: {
          endpoint: true,
        },
      });

      if (!apiKeyRecord) {
        return {
          success: false,
          error: 'Invalid API key',
        };
      }

      // Verify the API key hash
      const isValid = await verify(apiKeyRecord.keyHash, apiKey);
      if (!isValid) {
        return {
          success: false,
          error: 'Invalid API key',
        };
      }

      return {
        success: true,
        apiKey: {
          id: apiKeyRecord.id,
          label: apiKeyRecord.label,
          rpsLimit: apiKeyRecord.rpsLimit,
          rpdLimit: apiKeyRecord.rpdLimit,
          rpmLimit: apiKeyRecord.rpmLimit,
          endpointId: apiKeyRecord.endpointId,
        },
      };
    } catch (error) {
      console.error('Authentication error:', error);
      return {
        success: false,
        error: 'Authentication failed',
      };
    }
  }

  /**
   * Check rate limits for API key
   */
  async checkRateLimit(
    apiKeyId: string,
    rpsLimit: number,
    rpdLimit: number,
    rpmLimit: number
  ): Promise<RateLimitResult> {
    if (!this.redis) {
      // If no Redis, allow all requests (for development)
      return {
        allowed: true,
        remaining: rpsLimit,
        resetTime: Date.now() + 1000,
      };
    }

    try {
      const now = Date.now();
      const minute = Math.floor(now / 60000);
      const hour = Math.floor(now / 3600000);
      const day = Math.floor(now / 86400000);

      // Check per-second limit
      const rpsKey = `rate_limit:rps:${apiKeyId}:${Math.floor(now / 1000)}`;
      const rpsCount = await this.redis.incr(rpsKey);
      await this.redis.expire(rpsKey, 1);

      if (rpsCount > rpsLimit) {
        return {
          allowed: false,
          remaining: 0,
          resetTime: Math.floor(now / 1000) * 1000 + 1000,
          error: 'Rate limit exceeded (per second)',
        };
      }

      // Check per-minute limit
      const rpmKey = `rate_limit:rpm:${apiKeyId}:${minute}`;
      const rpmCount = await this.redis.incr(rpmKey);
      await this.redis.expire(rpmKey, 60);

      if (rpmCount > rpmLimit) {
        return {
          allowed: false,
          remaining: 0,
          resetTime: minute * 60000 + 60000,
          error: 'Rate limit exceeded (per minute)',
        };
      }

      // Check per-day limit
      const rpdKey = `rate_limit:rpd:${apiKeyId}:${day}`;
      const rpdCount = await this.redis.incr(rpdKey);
      await this.redis.expire(rpdKey, 86400);

      if (rpdCount > rpdLimit) {
        return {
          allowed: false,
          remaining: 0,
          resetTime: day * 86400000 + 86400000,
          error: 'Rate limit exceeded (per day)',
        };
      }

      return {
        allowed: true,
        remaining: Math.max(0, rpsLimit - rpsCount),
        resetTime: Math.floor(now / 1000) * 1000 + 1000,
      };
    } catch (error) {
      console.error('Rate limit check error:', error);
      // On error, allow the request but log it
      return {
        allowed: true,
        remaining: rpsLimit,
        resetTime: Date.now() + 1000,
      };
    }
  }

  /**
   * Record usage for analytics
   */
  async recordUsage(
    apiKeyId: string,
    networkId?: string,
    latency?: number,
    success: boolean = true
  ): Promise<void> {
    try {
      const now = new Date();
      const tsMinute = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes());

      // Upsert usage record
      await prisma.usage.upsert({
        where: {
          apiKeyId_tsMinute: {
            apiKeyId,
            tsMinute,
          },
        },
        update: {
          count: {
            increment: 1,
          },
          latencyP50: latency ? (latency + (await this.getCurrentLatencyP50(apiKeyId, tsMinute))) / 2 : undefined,
          latencyP95: latency ? Math.max(latency, await this.getCurrentLatencyP95(apiKeyId, tsMinute)) : undefined,
          errorRate: success ? await this.calculateErrorRate(apiKeyId, tsMinute) : 1,
        },
        create: {
          apiKeyId,
          networkId,
          tsMinute,
          count: 1,
          latencyP50: latency,
          latencyP95: latency,
          errorRate: success ? 0 : 1,
        },
      });
    } catch (error) {
      console.error('Usage recording error:', error);
    }
  }

  private async getCurrentLatencyP50(apiKeyId: string, tsMinute: Date): Promise<number> {
    const usage = await prisma.usage.findUnique({
      where: {
        apiKeyId_tsMinute: {
          apiKeyId,
          tsMinute,
        },
      },
    });
    return usage?.latencyP50 || 0;
  }

  private async getCurrentLatencyP95(apiKeyId: string, tsMinute: Date): Promise<number> {
    const usage = await prisma.usage.findUnique({
      where: {
        apiKeyId_tsMinute: {
          apiKeyId,
          tsMinute,
        },
      },
    });
    return usage?.latencyP95 || 0;
  }

  private async calculateErrorRate(apiKeyId: string, tsMinute: Date): Promise<number> {
    const usage = await prisma.usage.findUnique({
      where: {
        apiKeyId_tsMinute: {
          apiKeyId,
          tsMinute,
        },
      },
    });
    
    if (!usage) return 0;
    
    // Simple error rate calculation - in production, you'd want more sophisticated logic
    return usage.errorRate || 0;
  }
}

// Export singleton instance
export const runtimeAuth = new RuntimeAuth();

// Export types
export type { AuthResult, RateLimitResult };


