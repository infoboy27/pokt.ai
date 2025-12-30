// Caching layer for RPC responses with Redis support
// This will dramatically improve performance for repeated queries

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

// Redis client (lazy initialization with proper error handling)
let redisCacheClient: any = null;
let redisCacheInitialized = false;
let redisCacheInitializing = false;
let cacheHits = 0;
let cacheMisses = 0;

async function getRedisCacheClient() {
  // Return null if already tried and failed
  if (redisCacheInitialized && !redisCacheClient) {
    return null;
  }

  // Return existing client if available
  if (redisCacheClient) {
    return redisCacheClient;
  }

  // Prevent concurrent initialization
  if (redisCacheInitializing) {
    // Wait a bit and retry
    await new Promise(resolve => setTimeout(resolve, 50));
    return redisCacheClient || null;
  }

  redisCacheInitializing = true;

  try {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      redisCacheInitialized = true;
      redisCacheInitializing = false;
      return null;
    }

    // Dynamic import to avoid breaking if redis is not installed
    const { createClient } = await import('redis');
    redisCacheClient = createClient({ 
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries: number) => {
          if (retries > 10) {
            console.error('Redis connection failed after 10 retries');
            return new Error('Redis connection failed');
          }
          return Math.min(retries * 100, 3000);
        }
      }
    });
    
    redisCacheClient.on('error', (err: Error) => {
      console.error('Redis Cache Client Error:', err);
      // Don't set client to null on error, let it try to reconnect
    });

    await redisCacheClient.connect();
    redisCacheInitialized = true;
    redisCacheInitializing = false;
    console.log('Redis connected for caching');
    return redisCacheClient;
  } catch (error) {
    console.warn('Redis not available for caching, falling back to in-memory cache:', error);
    redisCacheInitialized = true;
    redisCacheInitializing = false;
    redisCacheClient = null;
    return null;
  }
}

class ResponseCache {
  private cache: Map<string, CacheEntry>;
  private maxSize: number;

  constructor(maxSize: number = 100000) {
    this.cache = new Map();
    this.maxSize = maxSize; // Increased for multi-chain workloads
    
    // Cleanup expired entries every 30 seconds (only for in-memory cache)
    // Use setTimeout to avoid blocking during module initialization
    if (typeof setInterval !== 'undefined') {
      setInterval(() => {
        try {
          this.cleanup();
        } catch (error) {
          // Silently handle cleanup errors
        }
      }, 30000);
    }
  }

  /**
   * Get cached response if available and not expired
   * Returns synchronous result from memory cache first, then tries Redis async
   */
  async get(key: string): Promise<any | null> {
    // First check in-memory cache (synchronous, fast path)
    const entry = this.cache.get(key);
    
    if (entry) {
      const now = Date.now();
      if (now - entry.timestamp <= entry.ttl) {
        // Valid entry in memory cache
        cacheHits++;
        return entry.data;
      } else {
        // Expired entry
        this.cache.delete(key);
      }
    }

    // Try Redis (async, but don't block if it's slow)
    try {
      const redis = await Promise.race([
        getRedisCacheClient(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Redis timeout')), 100))
      ]) as any;
      
      if (redis) {
        try {
          const cached = await Promise.race([
            redis.get(key),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Redis get timeout')), 100))
          ]) as string | null;
          
          if (cached) {
            cacheHits++;
            const parsed = JSON.parse(cached);
            // Also update memory cache for faster access next time
            this.set(key, parsed, 60000).catch(() => {}); // Cache for 1 min, ignore errors
            return parsed;
          }
        } catch (error) {
          // Redis error or timeout - silently fall through to cache miss
          if (error instanceof Error && !error.message.includes('timeout')) {
            console.error('Redis cache get error:', error);
          }
        }
      }
    } catch (error) {
      // Redis client initialization timeout or error - use memory cache only
    }

    // Not found in either cache
    cacheMisses++;
    return null;
  }

  /**
   * Store response in cache with TTL
   */
  async set(key: string, data: any, ttl: number): Promise<void> {
    if (ttl <= 0) {
      return; // Don't cache if TTL is 0 or negative
    }

    // Try Redis first
    const redis = await getRedisCacheClient();
    
    if (redis) {
      try {
        const ttlSeconds = Math.ceil(ttl / 1000);
        await redis.setEx(key, ttlSeconds, JSON.stringify(data));
        return;
      } catch (error) {
        console.error('Redis cache set error, falling back to memory:', error);
        // Fall through to memory cache
      }
    }

    // Fallback to in-memory cache
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Check if key exists and is not expired
   */
  async has(key: string): Promise<boolean> {
    const result = await this.get(key);
    return result !== null;
  }

  /**
   * Delete a specific cache entry
   */
  async delete(key: string): Promise<void> {
    // Delete from in-memory cache
    this.cache.delete(key);

    // Also delete from Redis if available
    const redis = await getRedisCacheClient();
    if (redis) {
      try {
        await redis.del(key);
      } catch (error) {
        // Silently fail - Redis deletion errors shouldn't block
      }
    }
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    const redis = await getRedisCacheClient();
    if (redis) {
      try {
        // Clear all keys matching our pattern
        const keys = await redis.keys('rpc:*');
        if (keys.length > 0) {
          await redis.del(keys);
        }
      } catch (error) {
        console.error('Redis cache clear error:', error);
      }
    }
    this.cache.clear();
  }

  /**
   * Remove expired entries (only for in-memory cache)
   */
  private cleanup(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > entry.ttl) {
        toDelete.push(key);
      }
    });

    toDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; maxSize: number; hitRate: number } {
    const total = cacheHits + cacheMisses;
    const hitRate = total > 0 ? cacheHits / total : 0;
    
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate,
    };
  }
}

// Global cache instance - increased size for multi-chain workloads
// Lazy initialization to avoid blocking Next.js route module preparation
let _rpcCache: ResponseCache | null = null;

function getRpcCache(): ResponseCache {
  if (!_rpcCache) {
    _rpcCache = new ResponseCache(100000);
  }
  return _rpcCache;
}

export const rpcCache = {
  get: async (key: string) => {
    try {
      return await getRpcCache().get(key);
    } catch (error) {
      // Silently fail - return null on error
      return null;
    }
  },
  set: async (key: string, data: any, ttl: number) => {
    try {
      await getRpcCache().set(key, data, ttl);
    } catch (error) {
      // Silently fail - caching should never block requests
    }
  },
  has: async (key: string) => {
    try {
      return await getRpcCache().has(key);
    } catch (error) {
      return false;
    }
  },
  delete: async (key: string) => {
    try {
      await getRpcCache().delete(key);
    } catch (error) {
      // Silently fail
    }
  },
  clear: async () => {
    try {
      await getRpcCache().clear();
    } catch (error) {
      // Silently fail
    }
  },
  getStats: () => {
    try {
      return getRpcCache().getStats();
    } catch (error) {
      return { size: 0, maxSize: 0, hitRate: 0 };
    }
  },
};

/**
 * Generate cache key for RPC request
 */
export function generateCacheKey(
  chainId: string,
  method: string,
  params: any[]
): string {
  const paramsHash = JSON.stringify(params);
  return `rpc:${chainId}:${method}:${paramsHash}`;
}

/**
 * Determine TTL based on RPC method
 * Immutable data (old blocks) can be cached longer
 */
export function getTTLForMethod(method: string, params: any[]): number {
  // Don't cache these methods (always need fresh data)
  const nonCacheableMethods = [
    'eth_sendRawTransaction',
    'eth_sendTransaction',
    'eth_sign',
    'eth_signTransaction',
    'personal_sign',
  ];

  if (nonCacheableMethods.includes(method)) {
    return 0; // Don't cache
  }

  // Short cache for frequently changing data (optimized for better hit rate)
  const shortCacheMethods = [
    'eth_blockNumber',
    'eth_gasPrice',
    'eth_estimateGas',
    'eth_getBalance', // Balance changes frequently
    'eth_getTransactionCount',
  ];

  if (shortCacheMethods.includes(method)) {
    // Optimized: Increased from 2s to 5s for better cache hit rate
    // BlockNumber changes every ~12s on Ethereum, so 5s cache is safe
    return 5000; // 5 seconds
  }

  // Medium cache for blocks (optimized for better hit rate)
  if (method === 'eth_getBlockByNumber') {
    const blockParam = params[0];
    
    // Don't cache 'latest', 'pending', 'earliest' - but increase TTL for 'latest'
    if (typeof blockParam === 'string' && 
        ['latest', 'pending', 'earliest'].includes(blockParam)) {
      // Optimized: Increased from 1s to 3s for 'latest' blocks
      // Blocks change every ~12s, so 3s cache is safe and improves hit rate
      return 3000; // 3 seconds
    }
    
    // Historical blocks are immutable - cache for 1 hour
    return 60 * 60 * 1000;
  }

  // Medium cache for transactions (once mined, they don't change)
  if (method === 'eth_getTransactionByHash' || 
      method === 'eth_getTransactionReceipt') {
    return 30 * 60 * 1000; // 30 minutes
  }

  // Long cache for code and storage (rarely changes)
  if (method === 'eth_getCode' || 
      method === 'eth_getStorageAt') {
    return 5 * 60 * 1000; // 5 minutes
  }

  // Default: short cache for safety (optimized for better hit rate)
  return 5000; // 5 seconds (increased from 2s)
}

/**
 * Check if method should be cached
 */
export function shouldCacheMethod(method: string): boolean {
  const ttl = getTTLForMethod(method, []);
  return ttl > 0;
}









