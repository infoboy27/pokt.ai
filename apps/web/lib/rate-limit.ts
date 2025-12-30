import { NextRequest } from 'next/server';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: NextRequest) => string;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// Redis client (lazy initialization)
let redisClient: any = null;
let redisInitialized = false;

async function getRedisClient() {
  if (redisInitialized) {
    return redisClient;
  }

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    redisInitialized = true;
    return null;
  }

  try {
    // Dynamic import to avoid breaking if redis is not installed
    const { createClient } = await import('redis');
    redisClient = createClient({ url: redisUrl });
    
    redisClient.on('error', (err: Error) => {
      console.error('Redis Client Error:', err);
      redisClient = null;
    });

    await redisClient.connect();
    redisInitialized = true;
    console.log('Redis connected for rate limiting');
    return redisClient;
  } catch (error) {
    console.warn('Redis not available, falling back to in-memory rate limiting:', error);
    redisInitialized = true;
    return null;
  }
}

// In-memory store (fallback when Redis is not available)
const store: RateLimitStore = {};

export class RateLimiter {
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  async checkLimit(request: NextRequest): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
  }> {
    const key = this.config.keyGenerator 
      ? this.config.keyGenerator(request)
      : this.getDefaultKey(request);

    // Try Redis first, fallback to memory
    const redis = await getRedisClient();
    
    if (redis) {
      return this.checkLimitRedis(redis, key);
    } else {
      return this.checkLimitMemory(key);
    }
  }

  private async checkLimitRedis(redis: any, key: string): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
  }> {
    const now = Date.now();
    const windowSeconds = Math.ceil(this.config.windowMs / 1000);
    const redisKey = `rate_limit:${key}:${this.config.windowMs}`;
    
    try {
      // Use Redis INCR with EXPIRE for sliding window
      const count = await redis.incr(redisKey);
      
      if (count === 1) {
        // First request in window, set expiration
        await redis.expire(redisKey, windowSeconds);
      }
      
      const resetTime = now + this.config.windowMs;
      const remaining = Math.max(0, this.config.maxRequests - count);
      const allowed = count <= this.config.maxRequests;
      
      return {
        allowed,
        remaining,
        resetTime,
      };
    } catch (error) {
      console.error('Redis rate limit error, falling back to memory:', error);
      return this.checkLimitMemory(key);
    }
  }

  private checkLimitMemory(key: string): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
  } {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Clean up expired entries
    this.cleanup(windowStart);

    const entry = store[key];
    const resetTime = now + this.config.windowMs;

    if (!entry || entry.resetTime < now) {
      // New window or expired entry
      store[key] = {
        count: 1,
        resetTime,
      };

      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime,
      };
    }

    if (entry.count >= this.config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
      };
    }

    // Increment counter
    entry.count++;
    store[key] = entry;

    return {
      allowed: true,
      remaining: this.config.maxRequests - entry.count,
      resetTime: entry.resetTime,
    };
  }

  private getDefaultKey(request: NextRequest): string {
    // For gateway, use endpoint ID from query param or header for better rate limiting
    const endpointId = request.nextUrl.searchParams.get('endpoint') || 
                       request.headers.get('X-Endpoint-ID') || 
                       'default';
    
    // For load testing: if DISABLE_IP_RATE_LIMIT is set, don't include IP in key
    // This allows load testing from a single machine
    if (process.env.DISABLE_IP_RATE_LIMIT === 'true') {
      return `gateway:${endpointId}`;
    }
    
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    return `gateway:${endpointId}:${ip}`;
  }

  private cleanup(windowStart: number): void {
    Object.keys(store).forEach(key => {
      if (store[key].resetTime < windowStart) {
        delete store[key];
      }
    });
  }
}

// Predefined rate limiters
export const apiRateLimit = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 1000, // 1000 requests per 15 minutes (increased from 100)
});

export const authRateLimit = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 20, // 20 login attempts per 15 minutes (increased from 5)
});

export const gatewayRateLimit = new RateLimiter({
  windowMs: 1000, // 1 second window for better granularity
  maxRequests: 10000, // 10,000 requests per second (2x buffer for 5K RPS load testing)
});

// Rate limit middleware
export async function withRateLimit(
  request: NextRequest,
  rateLimiter: RateLimiter
): Promise<Response | null> {
  const result = await rateLimiter.checkLimit(request);

  if (!result.allowed) {
    return new Response(
      JSON.stringify({
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
          'X-RateLimit-Limit': rateLimiter['config'].maxRequests.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': result.resetTime.toString(),
        },
      }
    );
  }

  return null;
}










