import { NextRequest, NextResponse } from 'next/server';
import { endpointQueries, usageQueries, networkQueries } from '@/lib/database';
import { gatewayRateLimit, withRateLimit } from '@/lib/rate-limit';
import { rpcCache, generateCacheKey, getTTLForMethod } from '@/lib/cache';
import { canOrganizationUseService, PAYMENT_STATUS } from '@/lib/suspension';
import { getAgent } from '@/lib/http-agent';
import { getCountryFromRequest } from '@/lib/geolocation';
import https from 'https';
import { URL } from 'url';

// Map chain IDs to RPC provider endpoints
// Using gateway.pokt.ai - Pocket Network Production RPC Provider
// Can be overridden with environment variables or database configuration

// Check for local/Shannon testnet configuration from environment
const SHANNON_RPC_URL = process.env.SHANNON_RPC_URL || 'https://gateway.pokt.ai';
const USE_LOCAL_NODE = process.env.USE_LOCAL_NODE === 'true';
// Local PATH gateway runs on port 3069 - this is the gateway that routes to local Shannon node
const LOCAL_GATEWAY_URL = process.env.LOCAL_GATEWAY_URL || 'http://localhost:3069';
const LOCAL_NODE_RPC_URL = process.env.LOCAL_NODE_RPC_URL || LOCAL_GATEWAY_URL;

// WeaversNodes Gateway configuration
// Read at request time to ensure environment variables are current
function getUseWeaversNodesGateway(): boolean {
  return process.env.USE_WEAVERSNODES_GATEWAY === 'true';
}
function getWeaversNodesGatewayUrl(): string {
  return process.env.WEAVERSNODES_GATEWAY_URL || 'https://gateway.weaversnodes.org/v1';
}
const USE_WEAVERSNODES_GATEWAY = getUseWeaversNodesGateway(); // Keep for backward compatibility, but will be overridden in POST handler
const WEAVERSNODES_GATEWAY_URL = getWeaversNodesGatewayUrl();

// PATH Gateway instances for load balancing (round-robin)
// Add more instances here to scale horizontally
// Use localhost when running via PM2, host.docker.internal when running in Docker
const PATH_GATEWAY_BASE = process.env.PATH_GATEWAY_BASE || 'http://localhost';
const PATH_GATEWAY_INSTANCES = process.env.PATH_GATEWAY_INSTANCES
  ? process.env.PATH_GATEWAY_INSTANCES.split(',').map(url => url.trim())
  : [
      `${PATH_GATEWAY_BASE}:3069`,
      `${PATH_GATEWAY_BASE}:3070`,
      `${PATH_GATEWAY_BASE}:3071`,
      `${PATH_GATEWAY_BASE}:3072`,
      `${PATH_GATEWAY_BASE}:3073`,
      `${PATH_GATEWAY_BASE}:3074`,
      `${PATH_GATEWAY_BASE}:3075`,
      `${PATH_GATEWAY_BASE}:3076`,
      `${PATH_GATEWAY_BASE}:3077`,
      `${PATH_GATEWAY_BASE}:3078`,
    ];

// Round-robin counter for PATH gateway instances (per-process, resets on restart)
// Use random starting point per process to improve distribution across PM2 instances
let pathGatewayIndex = Math.floor(Math.random() * PATH_GATEWAY_INSTANCES.length);

/**
 * Get next PATH gateway URL using round-robin load balancing
 * Uses atomic increment to ensure proper distribution across concurrent requests
 */
function getNextPathGatewayUrl(): string {
  // Use atomic increment with modulo to ensure thread-safe round-robin
  // Each PM2 instance will have a different starting point due to random initialization
  const index = pathGatewayIndex % PATH_GATEWAY_INSTANCES.length;
  pathGatewayIndex = (pathGatewayIndex + 1) % PATH_GATEWAY_INSTANCES.length;
  return PATH_GATEWAY_INSTANCES[index];
}
// API key for gateway.pokt.ai / rpc.pokt.ai (customer-rpc-gateway)
const RPC_API_KEY = process.env.RPC_API_KEY || process.env.SHANNON_RPC_API_KEY;
// App-Address for PATH gateway (delegated mode)
const PATH_GATEWAY_APP_ADDRESS = process.env.PATH_GATEWAY_APP_ADDRESS;

// Per-chain default app addresses (can be overridden per-network in database)
// WeaversNodes Gateway app addresses
const CHAIN_APP_ADDRESSES: Record<string, string> = {
  'eth': process.env.ETH_APP_ADDRESS || process.env.PATH_GATEWAY_APP_ADDRESS || 'pokt1zp90apxzym50uu6jt89p30urd69gfp7nu2u2w9',
  'avax': process.env.AVAX_APP_ADDRESS || process.env.PATH_GATEWAY_APP_ADDRESS || 'pokt16l4v7k8ks7u0ymgj0utxu6fjdy62jhp8t85wzr',
  'bsc': process.env.BSC_APP_ADDRESS || process.env.PATH_GATEWAY_APP_ADDRESS || 'pokt1du5ve83cj92qx0swvym7s6934a2rver68jje2z',
  'opt': process.env.OPT_APP_ADDRESS || process.env.PATH_GATEWAY_APP_ADDRESS || 'pokt1hcn484sc9w3xqdwajv7cz06wys3r4az999ds36',
  'opt-sepolia-testnet': process.env.OPT_SEPOLIA_APP_ADDRESS || process.env.PATH_GATEWAY_APP_ADDRESS || 'pokt1d465ferla2t2qacj88290ucqhqqflak34jevtu',
  'arb-one': process.env.ARB_ONE_APP_ADDRESS || process.env.PATH_GATEWAY_APP_ADDRESS || 'pokt1ew5j579vqjes85g7rprvyd6zt9qndc3m9edx8w',
  'base': process.env.BASE_APP_ADDRESS || process.env.PATH_GATEWAY_APP_ADDRESS || 'pokt1lylg9luqsvlwtynvu6kjse5qp98phyfwh9jgys',
  'linea': process.env.LINEA_APP_ADDRESS || process.env.PATH_GATEWAY_APP_ADDRESS || 'pokt1t787eh3punnjrmp8j5metng52jpnvzu0s4nmwz',
  'mantle': process.env.MANTLE_APP_ADDRESS || process.env.PATH_GATEWAY_APP_ADDRESS || 'pokt1uzdsuerd7ccpkd5xdm83jhmv4g2rfsr223vf70',
  'bera': process.env.BERA_APP_ADDRESS || process.env.PATH_GATEWAY_APP_ADDRESS || 'pokt15789ykufjy46p06kszkpnw2clf22z4248vkx68',
  'fuse': process.env.FUSE_APP_ADDRESS || process.env.PATH_GATEWAY_APP_ADDRESS || 'pokt1k9kycneld3fkl4xzqc6h95m7elrwfez2e0rx2x',
  'fraxtal': process.env.FRAXTAL_APP_ADDRESS || process.env.PATH_GATEWAY_APP_ADDRESS || 'pokt132gsqxk77e47jyfe5mhkjgl0ujnrk2mdn6t2qx',
  'metis': process.env.METIS_APP_ADDRESS || process.env.PATH_GATEWAY_APP_ADDRESS || 'pokt18498w7s4fgs95fywl8dftyznhk80sqmdh66m2a',
  'blast': process.env.BLAST_APP_ADDRESS || process.env.PATH_GATEWAY_APP_ADDRESS || 'pokt1ksfan89g3gengqvzh4hyr728p902l4l8aaytxe',
  'arb-sepolia-testnet': process.env.ARB_SEPOLIA_APP_ADDRESS || process.env.PATH_GATEWAY_APP_ADDRESS || 'pokt19m003r2agfr9wv7qldm9ak7g7lkfu8tyx20vxz',
  'base-sepolia-testnet': process.env.BASE_SEPOLIA_APP_ADDRESS || process.env.PATH_GATEWAY_APP_ADDRESS || 'pokt1339ddj4v4zangj4svjqfh3n2307zvmm4mfqzmy',
  'boba': process.env.BOBA_APP_ADDRESS || process.env.PATH_GATEWAY_APP_ADDRESS || 'pokt14mpsqly7xyyn4hpcaelmn49dq4pkws9wr7fh6f',
  'eth-holesky-testnet': process.env.ETH_HOLESKY_APP_ADDRESS || process.env.PATH_GATEWAY_APP_ADDRESS || 'pokt19z9kjvhwdncmjeflnasm0zglenkhly5zrse9un',
  'fantom': process.env.FANTOM_APP_ADDRESS || process.env.PATH_GATEWAY_APP_ADDRESS || 'pokt14fnfvne4mh0m8lh63nremuxmdl5qp2kxtljkfs',
  'gnosis': process.env.GNOSIS_APP_ADDRESS || process.env.PATH_GATEWAY_APP_ADDRESS || 'pokt1jcas7t3nsy9cp7k47mzwxycu2vc2hx2ynhgvr4',
  'ink': process.env.INK_APP_ADDRESS || process.env.PATH_GATEWAY_APP_ADDRESS || 'pokt105e4uw6j3ndjtjncx37mkfget667tf5tfccjff',
  'kava': process.env.KAVA_APP_ADDRESS || process.env.PATH_GATEWAY_APP_ADDRESS || 'pokt16rg6xfywfkxgaglpykkgrvx006v9n8jveq2f2y',
  'oasys': process.env.OASYS_APP_ADDRESS || process.env.PATH_GATEWAY_APP_ADDRESS || 'pokt1nnkjgpzzuuadyexuepuewj97p7s8hcdqapamgt',
  'poly': process.env.POLY_APP_ADDRESS || process.env.PATH_GATEWAY_APP_ADDRESS || 'pokt1904q7y3v23h7gur02d6ple97celg5ysgedcw6t',
  'solana': process.env.SOLANA_APP_ADDRESS || process.env.PATH_GATEWAY_APP_ADDRESS || 'pokt1fks44f9k05gml6lyatjqsexwuch7qj8c8xuhuy',
  'sonic': process.env.SONIC_APP_ADDRESS || process.env.PATH_GATEWAY_APP_ADDRESS || 'pokt18gnh7tenrxfne25daxxs2qrdxu0e0h4nd4kc9g',
  'eth-sepolia-testnet': process.env.ETH_SEPOLIA_APP_ADDRESS || process.env.PATH_GATEWAY_APP_ADDRESS || 'pokt1vpfcw5sqa7ypzekcdgnehhqkuqtx0hcqqh5mql',
  'text-to-text': process.env.TEXT_TO_TEXT_APP_ADDRESS || process.env.PATH_GATEWAY_APP_ADDRESS || '',
};

// Helper function to get RPC URL based on configuration
const getRpcUrl = (chainPath: string): string => {
  // Priority 1: WeaversNodes Gateway (if enabled)
  if (USE_WEAVERSNODES_GATEWAY) {
    return WEAVERSNODES_GATEWAY_URL;
  }
  
  // Priority 2: Local PATH gateway (if enabled)
  if (USE_LOCAL_NODE && LOCAL_NODE_RPC_URL) {
    // For local PATH gateway (localhost:3069), use /v1 endpoint (not /v1/rpc/{chain})
    // PATH gateway uses Target-Service-Id header instead of path-based routing
    if (LOCAL_NODE_RPC_URL.includes('localhost:3069') || LOCAL_NODE_RPC_URL.includes('127.0.0.1:3069') || LOCAL_NODE_RPC_URL.includes('3069')) {
      return `${LOCAL_NODE_RPC_URL}/v1`;
    }
    // For WeaversNodes gateway (if configured via LOCAL_NODE_RPC_URL)
    if (LOCAL_NODE_RPC_URL.includes('weaversnodes.org')) {
      return WEAVERSNODES_GATEWAY_URL;
    }
    // For Shannon testnet (poktroll.com), use base URL (service_id handled via header)
    if (LOCAL_NODE_RPC_URL.includes('poktroll.com')) {
      return LOCAL_NODE_RPC_URL;
    }
    // For remote gateway (gateway.pokt.ai), use /v1/rpc/{chain} path
    if (LOCAL_NODE_RPC_URL.includes('gateway.pokt.ai') || LOCAL_NODE_RPC_URL.includes('rpctest.pokt.ai')) {
      return `${LOCAL_NODE_RPC_URL}/v1/rpc/${chainPath}`;
    }
    // Default for other local nodes - try /v1 endpoint for PATH gateway
    return `${LOCAL_NODE_RPC_URL}/v1`;
  }
  // Default to production gateway.pokt.ai - use /v1 path with Target-Service-Id header
  return `${SHANNON_RPC_URL}/v1`;
};

const chainRpcMapping: Record<string, string> = {
  // Ethereum
  '1': getRpcUrl('eth'),
  'eth': getRpcUrl('eth'),
  'F003': getRpcUrl('eth'),
  
  // Polygon
  '137': getRpcUrl('poly'),
  'poly': getRpcUrl('poly'),
  'F00C': getRpcUrl('poly'),
  
  // BSC
  '56': getRpcUrl('bsc'),
  'bsc': getRpcUrl('bsc'),
  'F00B': getRpcUrl('bsc'),
  
  // Arbitrum
  '42161': getRpcUrl('arb-one'),
  'arb-one': getRpcUrl('arb-one'),
  'F00A': getRpcUrl('arb-one'),
  
  // Optimism
  '10': getRpcUrl('opt'),
  'opt': getRpcUrl('opt'),
  'F00E': getRpcUrl('opt'),
  
  // Base
  '8453': getRpcUrl('base'),
  'base': getRpcUrl('base'),
  
  // Avalanche
  '43114': getRpcUrl('avax'),
  'avax': getRpcUrl('avax'),
  'AVAX': getRpcUrl('avax'),
  
  // Kava
  '2222': getRpcUrl('kava'),
  'kava': getRpcUrl('kava'),
  
  // Linea
  '59144': getRpcUrl('linea'),
  'linea': getRpcUrl('linea'),
  
  // Mantle
  '5000': getRpcUrl('mantle'),
  'mantle': getRpcUrl('mantle'),
  
  // Bera Chain
  '80094': getRpcUrl('bera'),
  'bera': getRpcUrl('bera'),
  
  // Fuse Network
  '122': getRpcUrl('fuse'),
  'fuse': getRpcUrl('fuse'),
  
  // Fraxtal
  '252': getRpcUrl('fraxtal'),
  'fraxtal': getRpcUrl('fraxtal'),
  
  // Metis
  '1088': getRpcUrl('metis'),
  'metis': getRpcUrl('metis'),
  
  // Blast
  '81457': getRpcUrl('blast'),
  'blast': getRpcUrl('blast'),
  
  // Boba Network
  '288': getRpcUrl('boba'),
  'boba': getRpcUrl('boba'),
  
  // Fantom
  '250': getRpcUrl('fantom'),
  'fantom': getRpcUrl('fantom'),
  'ftm': getRpcUrl('fantom'),
  
  // Gnosis Chain
  '100': getRpcUrl('gnosis'),
  'gnosis': getRpcUrl('gnosis'),
  'xdai': getRpcUrl('gnosis'),
  
  // Ink Protocol
  '57073': getRpcUrl('ink'),
  'ink': getRpcUrl('ink'),
  
  // Oasys
  '248': getRpcUrl('oasys'),
  'oasys': getRpcUrl('oasys'),
  
  // Sonic
  '146': getRpcUrl('sonic'),
  'sonic': getRpcUrl('sonic'),
  
  // Testnets
  // Optimism Sepolia
  '11155420': getRpcUrl('opt-sepolia-testnet'),
  'opt-sepolia-testnet': getRpcUrl('opt-sepolia-testnet'),
  
  // Arbitrum Sepolia
  '421614': getRpcUrl('arb-sepolia-testnet'),
  'arb-sepolia-testnet': getRpcUrl('arb-sepolia-testnet'),
  
  // Base Sepolia
  '84532': getRpcUrl('base-sepolia-testnet'),
  'base-sepolia-testnet': getRpcUrl('base-sepolia-testnet'),
  
  // Ethereum Holesky
  '17000': getRpcUrl('eth-holesky-testnet'),
  'eth-holesky-testnet': getRpcUrl('eth-holesky-testnet'),
  
  // Ethereum Sepolia
  '11155111': getRpcUrl('eth-sepolia-testnet'),
  'eth-sepolia-testnet': getRpcUrl('eth-sepolia-testnet'),
  
  // text-to-text (for LLM services)
  'text-to-text': getRpcUrl('text-to-text'),
  
  // Solana
  'solana': getRpcUrl('solana'),
};

// Map chain IDs to service IDs for gateway routing (WeaversNodes, PATH gateway, etc.)
const chainToServiceId: Record<string, string> = {
  // Ethereum
  '1': 'eth',
  'eth': 'eth',
  'F003': 'eth',
  
  // Polygon
  '137': 'poly',
  'poly': 'poly',
  'F00C': 'poly',
  
  // BSC
  '56': 'bsc',
  'bsc': 'bsc',
  'F00B': 'bsc',
  
  // Arbitrum
  '42161': 'arb-one',
  'arb-one': 'arb-one',
  'F00A': 'arb-one',
  
  // Optimism
  '10': 'opt',
  'opt': 'opt',
  'F00E': 'opt',
  
  // Base
  '8453': 'base',
  'base': 'base',
  
  // Avalanche
  '43114': 'avax',
  'avax': 'avax',
  'AVAX': 'avax',
  
  // Kava
  '2222': 'kava',
  'kava': 'kava',
  
  // Linea
  '59144': 'linea',
  'linea': 'linea',
  
  // Mantle
  '5000': 'mantle',
  'mantle': 'mantle',
  
  // Bera Chain
  '80094': 'bera',
  'bera': 'bera',
  
  // Fuse Network
  '122': 'fuse',
  'fuse': 'fuse',
  
  // Fraxtal
  '252': 'fraxtal',
  'fraxtal': 'fraxtal',
  
  // Metis
  '1088': 'metis',
  'metis': 'metis',
  
  // Blast
  '81457': 'blast',
  'blast': 'blast',
  
  // Boba Network
  '288': 'boba',
  'boba': 'boba',
  
  // Fantom
  '250': 'fantom',
  'fantom': 'fantom',
  'ftm': 'fantom',
  
  // Gnosis Chain
  '100': 'gnosis',
  'gnosis': 'gnosis',
  'xdai': 'gnosis',
  
  // Ink Protocol
  '57073': 'ink',
  'ink': 'ink',
  
  // Oasys
  '248': 'oasys',
  'oasys': 'oasys',
  
  // Sonic
  '146': 'sonic',
  'sonic': 'sonic',
  
  // Testnets
  // Optimism Sepolia
  '11155420': 'opt-sepolia-testnet',
  'opt-sepolia-testnet': 'opt-sepolia-testnet',
  
  // Arbitrum Sepolia
  '421614': 'arb-sepolia-testnet',
  'arb-sepolia-testnet': 'arb-sepolia-testnet',
  
  // Base Sepolia
  '84532': 'base-sepolia-testnet',
  'base-sepolia-testnet': 'base-sepolia-testnet',
  
  // Ethereum Holesky
  '17000': 'eth-holesky-testnet',
  'eth-holesky-testnet': 'eth-holesky-testnet',
  
  // Ethereum Sepolia
  '11155111': 'eth-sepolia-testnet',
  'eth-sepolia-testnet': 'eth-sepolia-testnet',
  
  // text-to-text (for LLM services)
  'text-to-text': 'text-to-text',
  
  // Solana
  'solana': 'solana',
};

// Optimize for high throughput - use edge runtime for better performance
export const runtime = 'nodejs'; // Keep nodejs for database access
export const maxDuration = 10; // 10 second max duration

// In-memory cache for endpoints and networks (faster than Redis for single-instance)
const inMemoryCache = (global as any).__gatewayCache || {
  endpoints: new Map(),
  networks: new Map(),
  lastCleanup: Date.now(),
};
(global as any).__gatewayCache = inMemoryCache;

// Cleanup expired entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    if (now - inMemoryCache.lastCleanup > 5 * 60 * 1000) {
      // Cleanup expired entries
      for (const [key, value] of inMemoryCache.endpoints.entries()) {
        if (value.expires < now) {
          inMemoryCache.endpoints.delete(key);
        }
      }
      for (const [key, value] of inMemoryCache.networks.entries()) {
        if (value.expires < now) {
          inMemoryCache.networks.delete(key);
        }
      }
      inMemoryCache.lastCleanup = now;
    }
  }, 60 * 1000); // Check every minute
}

// POST /api/gateway?endpoint=<endpointId> - RPC Gateway with Permanent Storage & Billing
export async function POST(request: NextRequest) {
  // Apply rate limiting (can be disabled via DISABLE_RATE_LIMIT env var for load testing)
  if (process.env.DISABLE_RATE_LIMIT !== 'true') {
    const rateLimitResponse = await withRateLimit(request, gatewayRateLimit);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
  }

  const startTime = Date.now();
  let endpointId: string | null = null;
  let endpoint: any = null;
  
  try {
    const { searchParams } = new URL(request.url);
    endpointId = searchParams.get('endpoint');
    
    // Also check for endpoint ID in header (from Traefik rewrite)
    if (!endpointId) {
      endpointId = request.headers.get('X-Endpoint-ID');
    }
    
    if (!endpointId) {
      return NextResponse.json(
        { 
          jsonrpc: '2.0',
          error: { 
            code: -32001, 
            message: 'Endpoint ID is required as query parameter: ?endpoint=<endpointId>' 
          },
          id: null 
        },
        { status: 400 }
      );
    }
    
    // Look up the endpoint in PostgreSQL database (with caching for load testing)
    // Use in-memory cache first (synchronous, fast)
    const CACHE_ENDPOINT_LOOKUPS = process.env.CACHE_ENDPOINT_LOOKUPS !== 'false'; // Default to true
    
    // File-based logging for debugging
    const fs = require('fs');
    const logFile = '/tmp/gateway-route.log';
    const logMsg = `[${new Date().toISOString()}] [GATEWAY] Looking up endpoint: ${endpointId}\n`;
    try {
      fs.appendFileSync(logFile, logMsg);
    } catch (e) {}
    console.log(`[GATEWAY] Looking up endpoint: ${endpointId}`);
    
    if (CACHE_ENDPOINT_LOOKUPS) {
      const endpointCacheKey = `endpoint:${endpointId}`;
      const cached = inMemoryCache.endpoints.get(endpointCacheKey);
      if (cached && cached.expires > Date.now()) {
        endpoint = cached.data;
        console.log(`[GATEWAY] Found endpoint in memory cache: ${endpointId}, endpoint: ${endpoint ? endpoint.id : 'null'}`);
        // If cached endpoint is null (negative cache), skip it and query DB
        if (endpoint === null) {
          console.log(`[GATEWAY] Negative cache found, clearing and querying DB: ${endpointId}`);
          endpoint = undefined; // Clear negative cache, force DB lookup
          inMemoryCache.endpoints.delete(endpointCacheKey);
        }
      } else if (cached) {
        // Expired, remove it
        console.log(`[GATEWAY] Expired cache entry found, removing: ${endpointId}`);
        inMemoryCache.endpoints.delete(endpointCacheKey);
      }
      
      // Fallback to Redis cache if not in memory (async, but don't block)
      if (!endpoint) {
        try {
          // Use Promise.race to timeout Redis lookup quickly
          const cachedEndpoint = await Promise.race([
            rpcCache.get(endpointCacheKey),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Cache timeout')), 50))
          ]) as any;
          if (cachedEndpoint !== null && cachedEndpoint !== undefined) {
            console.log(`[GATEWAY] Found endpoint in Redis cache: ${endpointId}`);
            endpoint = cachedEndpoint;
            // Store in memory cache too
            inMemoryCache.endpoints.set(endpointCacheKey, {
              data: cachedEndpoint,
              expires: Date.now() + 5 * 60 * 1000 // 5 minutes
            });
          }
        } catch (e) {
          // Cache miss or timeout - continue to database lookup
          console.log(`[GATEWAY] Redis cache miss/timeout, querying DB: ${endpointId}`);
        }
      }
    }
    
    // Database lookup only if not cached (with timeout)
    // Increased timeout to 15 seconds to handle database load and connection pool wait time
    if (!endpoint) {
      console.log(`[GATEWAY] Querying database for endpoint: ${endpointId}`);
      try {
        const DB_LOOKUP_TIMEOUT = parseInt(process.env.DB_LOOKUP_TIMEOUT_MS || '15000'); // 15 seconds default
        const lookupStart = Date.now();
        endpoint = await Promise.race([
          endpointQueries.findById(endpointId).then(result => {
            const lookupTime = Date.now() - lookupStart;
            console.log(`[GATEWAY] DB lookup completed for ${endpointId}: ${result ? 'FOUND' : 'NOT FOUND'} (${lookupTime}ms)`);
            if (lookupTime > 1000) {
              console.warn(`[GATEWAY] Slow DB lookup for endpoint ${endpointId}: ${lookupTime}ms`);
            }
            return result;
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('DB timeout')), DB_LOOKUP_TIMEOUT))
        ]) as any;
        
        // Cache endpoint in both memory and Redis (endpoints don't change often)
        // Only cache if endpoint exists (don't cache null to avoid negative caching)
        if (CACHE_ENDPOINT_LOOKUPS && endpoint) {
          const endpointCacheKey = `endpoint:${endpointId}`;
          // Store in memory cache (synchronous, fast)
          inMemoryCache.endpoints.set(endpointCacheKey, {
            data: endpoint,
            expires: Date.now() + 5 * 60 * 1000 // 5 minutes
          });
          // Also cache in Redis (async, fire and forget)
          setImmediate(() => {
            rpcCache.set(endpointCacheKey, endpoint, 5 * 60 * 1000).catch(() => {
              // Silently fail - caching should never block requests
            });
          });
        } else if (CACHE_ENDPOINT_LOOKUPS && !endpoint) {
          // Clear any stale cache entries for non-existent endpoints
          const endpointCacheKey = `endpoint:${endpointId}`;
          inMemoryCache.endpoints.delete(endpointCacheKey);
          // Also clear from Redis (async)
          setImmediate(() => {
            rpcCache.delete(endpointCacheKey).catch(() => {
              // Silently fail
            });
          });
        }
      } catch (error) {
        // Database timeout or error - return error
        return NextResponse.json(
          { 
            jsonrpc: '2.0',
            error: { 
              code: -32603, 
              message: 'Database lookup timeout or error' 
            },
            id: null 
          },
          { status: 503 }
        );
      }
    }

    if (!endpoint) {
      // Log usage even for non-existent endpoints (for tracking/monitoring)
      const latency = Date.now() - startTime;
      console.log(`[GATEWAY] Endpoint not found: ${endpointId}, latency: ${latency}ms, logging usage`);
      if (process.env.DISABLE_USAGE_LOGGING !== 'true') {
        console.log(`[USAGE] Attempting to log usage for non-existent endpoint: ${endpointId}`);
        setImmediate(() => {
          usageQueries.logUsage({
            apiKeyId: endpointId || 'unknown',
            relayCount: 0, // Count as 0 since request failed
            responseTime: latency,
            method: 'unknown',
            networkId: 'unknown'
          }).then((result) => {
            console.log(`[USAGE] Successfully logged usage for non-existent endpoint: ${endpointId}, result:`, result);
          }).catch(err => {
            console.error(`[USAGE] Error logging usage for non-existent endpoint ${endpointId}:`, err.message, err.stack);
            if (!err.message?.includes('too many clients')) {
              console.error('[USAGE] Full error details:', err);
            }
          });
        });
      } else {
        console.warn(`[USAGE] Usage logging is DISABLED for endpoint: ${endpointId}`);
      }
      return NextResponse.json(
        { 
          jsonrpc: '2.0',
          error: { 
            code: -32001, 
            message: `Endpoint '${endpointId}' not found. Create endpoints at /api/endpoints` 
          },
          id: null 
        },
        { status: 404 }
      );
    }
    
    const foundMsg = `[${new Date().toISOString()}] [GATEWAY] Endpoint found: ${endpointId}, id: ${endpoint.id}, is_active: ${endpoint.is_active}\n`;
    try {
      fs.appendFileSync(logFile, foundMsg);
    } catch (e) {}
    console.log(`[GATEWAY] Endpoint found: ${endpointId}, id: ${endpoint.id}, is_active: ${endpoint.is_active}`);

    if (!endpoint.is_active) {
      return NextResponse.json(
        { 
          jsonrpc: '2.0',
          error: { 
            code: -32002, 
            message: 'Endpoint is not active' 
          },
          id: null 
        },
        { status: 403 }
      );
    }

    // ✅ NEW: Check organization payment status (60-day grace period)
    // Skip payment check if DISABLE_PAYMENT_CHECK is set (for load testing)
    // Payment check is already disabled, so this is a no-op
    if (false && endpoint.org_id && process.env.DISABLE_PAYMENT_CHECK !== 'true') {
      // Payment check code removed for performance
    }

    // Get the network configuration for this endpoint (with caching)
    let networks: any[] | undefined;
    if (CACHE_ENDPOINT_LOOKUPS) {
      const networksCacheKey = `networks:${endpointId}`;
      // Check in-memory cache first
      const cached = inMemoryCache.networks.get(networksCacheKey);
      if (cached && cached.expires > Date.now()) {
        networks = cached.data;
      } else if (cached) {
        // Expired, remove it
        inMemoryCache.networks.delete(networksCacheKey);
      }
      
      // Fallback to Redis cache if not in memory
      if (!networks) {
        try {
          const cachedNetworks = await Promise.race([
            rpcCache.get(networksCacheKey),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Cache timeout')), 50))
          ]) as any;
          if (cachedNetworks) {
            networks = cachedNetworks;
            // Store in memory cache too
            inMemoryCache.networks.set(networksCacheKey, {
              data: cachedNetworks,
              expires: Date.now() + 5 * 60 * 1000 // 5 minutes
            });
          }
        } catch (e) {
          // Cache miss or timeout - continue to database lookup
        }
      }
    }

    // Database lookup only if not cached (with timeout)
    // Increased timeout to 5 seconds to handle database load (was 1 second)
    if (!networks) {
      console.log('[GATEWAY] No cached networks found, querying database for endpoint:', endpointId);
      try {
        const DB_LOOKUP_TIMEOUT = parseInt(process.env.DB_LOOKUP_TIMEOUT_MS || '5000'); // 5 seconds default
        console.log('[GATEWAY] Starting network query with timeout:', DB_LOOKUP_TIMEOUT, 'ms');
        networks = await Promise.race([
          networkQueries.findByEndpointId(endpointId),
          new Promise((_, reject) => setTimeout(() => reject(new Error('DB timeout')), DB_LOOKUP_TIMEOUT))
        ]) as any;
        
        console.log('[GATEWAY] Network query completed. Result:', networks ? `${networks.length} networks` : 'null/undefined');
        
        // Cache networks in both memory and Redis
        if (CACHE_ENDPOINT_LOOKUPS && networks) {
          const networksCacheKey = `networks:${endpointId}`;
          console.log('[GATEWAY] Caching networks result for endpoint:', endpointId);
          // Store in memory cache (synchronous, fast)
          inMemoryCache.networks.set(networksCacheKey, {
            data: networks,
            expires: Date.now() + 5 * 60 * 1000 // 5 minutes
          });
          // Also cache in Redis (async, fire and forget)
          setImmediate(() => {
            rpcCache.set(networksCacheKey, networks, 5 * 60 * 1000).catch(() => {
              // Silently fail - caching should never block requests
            });
          });
        }
      } catch (error) {
        console.error('[GATEWAY] Network lookup error for endpoint', endpointId, ':', error);
        // Database timeout or error - return error
        return NextResponse.json(
          { 
            jsonrpc: '2.0',
            error: { 
              code: -32603, 
              message: 'Network lookup timeout or error' 
            },
            id: null 
          },
          { status: 503 }
        );
      }
    }
    
    console.log('[GATEWAY] Final networks check for endpoint', endpointId, ':', networks ? `${networks.length} networks` : 'null/undefined');
    if (!networks || networks.length === 0) {
      console.error('[GATEWAY] ERROR: No network configuration found for endpoint:', endpointId);
      return NextResponse.json(
        { 
          jsonrpc: '2.0',
          error: { 
            code: -32003, 
            message: `No network configuration found for endpoint '${endpointId}'. Please contact support.` 
          },
          id: null 
        },
        { status: 400 }
      );
    }

    // Parse request body
    let requestBody: any;
    try {
      requestBody = await request.json();
    } catch (error) {
      return NextResponse.json(
        { 
          jsonrpc: '2.0',
          error: { 
            code: -32700, 
            message: 'Parse error: Invalid JSON' 
          },
          id: null 
        },
        { status: 400 }
      );
    }

    // Determine chain ID from request or use default
    const chainId = requestBody.chainId?.toString() || 
                    networks[0]?.code || 
                    'eth';

    // Find network configuration for this chain
    const network = networks.find((n: any) => 
      n.code === chainId || 
      n.chain_id?.toString() === chainId.toString()
    ) || networks[0];

    // Get service ID for gateway routing (needed for app address lookup)
    const serviceId = chainToServiceId[chainId] || chainId;

    // Get network-specific app address (for multi-tenant support)
    // Priority order:
    // 1. Database network.path_app_address (per-network override)
    // 2. Chain-specific app address from CHAIN_APP_ADDRESSES (WeaversNodes defaults)
    // 3. Global PATH_GATEWAY_APP_ADDRESS
    const networkAppAddress = network.path_app_address || 
                              CHAIN_APP_ADDRESSES[serviceId] || 
                              PATH_GATEWAY_APP_ADDRESS;

    // Determine RPC URL: Priority order:
    // 1. WeaversNodes Gateway (if enabled)
    // 2. PATH gateway (if enabled)
    // 3. Network's rpc_url (from database)
    // 4. Default chain mapping
    // Read environment variables at request time to ensure they're current
    const USE_WEAVERSNODES_GATEWAY_NOW = getUseWeaversNodesGateway();
    const WEAVERSNODES_GATEWAY_URL_NOW = getWeaversNodesGatewayUrl();
    
    let rpcUrl: string;
    if (USE_WEAVERSNODES_GATEWAY_NOW) {
      // Use WeaversNodes gateway
      rpcUrl = WEAVERSNODES_GATEWAY_URL_NOW;
    } else if (USE_LOCAL_NODE && LOCAL_NODE_RPC_URL) {
      // Use PATH gateway when enabled
      if (LOCAL_NODE_RPC_URL.includes('3069') || 
          LOCAL_NODE_RPC_URL.includes('shannon-testnet-gateway') ||
          LOCAL_NODE_RPC_URL.includes('poktroll.com') || 
          LOCAL_NODE_RPC_URL.includes('shannon') ||
          LOCAL_NODE_RPC_URL.includes('weaversnodes.org')) {
        // PATH gateway uses /v1 endpoint (not /v1/rpc/{chain})
        // Service routing is handled via Target-Service-Id header
        // Use round-robin load balancing across multiple instances
        if (LOCAL_NODE_RPC_URL.includes('weaversnodes.org')) {
          rpcUrl = WEAVERSNODES_GATEWAY_URL;
        } else {
          const gatewayBaseUrl = getNextPathGatewayUrl();
          rpcUrl = `${gatewayBaseUrl}/v1`;
        }
      } else {
        // USE_LOCAL_NODE is true but URL doesn't match PATH gateway pattern
        rpcUrl = network.rpc_url || chainRpcMapping[chainId];
      }
    } else {
      // PATH gateway not enabled, use network's rpc_url or default
      rpcUrl = network.rpc_url || chainRpcMapping[chainId];
    }

    // Check cache first (with error handling)
    // Use in-memory cache for faster lookups (synchronous)
    const cacheKey = generateCacheKey(chainId, requestBody.method, requestBody.params || []);
    let cachedResponse: any = null;
    
    // Check in-memory cache first (synchronous, fast)
    const inMemoryRpcCache = (global as any).__rpcCache || new Map();
    (global as any).__rpcCache = inMemoryRpcCache;
    const cached = inMemoryRpcCache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      cachedResponse = cached.data;
    } else if (cached) {
      // Expired, remove it
      inMemoryRpcCache.delete(cacheKey);
    }
    
    // Fallback to Redis cache if not in memory (with timeout)
    if (!cachedResponse) {
      try {
        cachedResponse = await Promise.race([
          rpcCache.get(cacheKey),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Cache timeout')), 50))
        ]) as any;
        // Store in memory cache too if found
        if (cachedResponse) {
          const ttl = getTTLForMethod(requestBody.method, requestBody.params || []);
          if (ttl > 0) {
            inMemoryRpcCache.set(cacheKey, {
              data: cachedResponse,
              expires: Date.now() + ttl
            });
          }
        }
      } catch (error) {
        // Cache miss or timeout - continue without cache
      }
    }
    
    let responseData: any;
    let latency: number;
    let upstreamLatency: number | null = null; // Track actual upstream RPC latency
    let fromCache = false;

    if (cachedResponse) {
      // Return cached response
      responseData = cachedResponse;
      latency = Date.now() - startTime;
      fromCache = true;
      // For cached requests, we don't have upstream latency, so we'll skip logging latency
      // but still count the relay. The latency will be 0, which is fine for cached requests.
    } else {
      // Service ID already calculated above
      // Prepare headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add API key for gateway.pokt.ai / rpc.pokt.ai (customer-rpc-gateway)
      if (RPC_API_KEY && (rpcUrl.includes('gateway.pokt.ai') || rpcUrl.includes('rpctest.pokt.ai') || rpcUrl.includes('rpc.pokt.ai'))) {
        headers['X-API-Key'] = RPC_API_KEY;
      }
      
      // Add headers for PATH gateway, WeaversNodes gateway, or Shannon testnet
      // These gateways use /v1 endpoint with Target-Service-Id header for routing
      const needsGatewayHeaders = USE_WEAVERSNODES_GATEWAY || 
                                   (USE_LOCAL_NODE && LOCAL_NODE_RPC_URL && (
                                     LOCAL_NODE_RPC_URL.includes('3069') || 
                                     LOCAL_NODE_RPC_URL.includes('shannon-testnet-gateway') ||
                                     LOCAL_NODE_RPC_URL.includes('poktroll.com') || 
                                     LOCAL_NODE_RPC_URL.includes('shannon') ||
                                     LOCAL_NODE_RPC_URL.includes('weaversnodes.org')
                                   )) ||
                                   rpcUrl.includes('weaversnodes.org') ||
                                   rpcUrl.includes('gateway.pokt.ai') ||
                                   rpcUrl.includes('localhost:3070') ||
                                   rpcUrl.includes('host.docker.internal:3070') ||
                                   (rpcUrl.includes('/v1') && !rpcUrl.includes('/v1/rpc/'));
      
      if (needsGatewayHeaders) {
        headers['Target-Service-Id'] = serviceId;
        // Use network-specific app address (for multi-tenant support)
        // Falls back to chain-specific or global PATH_GATEWAY_APP_ADDRESS
        if (networkAppAddress) {
          headers['App-Address'] = networkAppAddress;
        }
        console.log('[GATEWAY] Added gateway headers:', {
          'Target-Service-Id': serviceId,
          'App-Address': networkAppAddress || 'NOT SET',
        });
      } else {
        console.log('[GATEWAY] Gateway headers NOT needed for URL:', rpcUrl);
      }
      
      // Forward the request to RPC provider with optimized timeout
      // Reduced timeout for faster failure detection (load testing)
      const RPC_TIMEOUT_MS = parseInt(process.env.RPC_TIMEOUT_MS || '3000'); // Reduced from 15s to 3s
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), RPC_TIMEOUT_MS);
      
      // Debug logging for request details
      console.log('[GATEWAY] Forwarding RPC request:', {
        rpcUrl,
        serviceId,
        networkAppAddress,
        headers: Object.keys(headers),
        method: requestBody.method,
        chainId,
        networkCode: network.code,
      });
      
      let response: Response;
      const upstreamStartTime = Date.now(); // Track upstream RPC call start time
      try {
        // Use native fetch (Node.js 18+ has built-in connection pooling)
        // Connection keep-alive is handled automatically by Node.js fetch
        // For gateway.pokt.ai, handle self-signed certificates using httpsAgent
        const fetchOptions: RequestInit = {
          method: 'POST',
          headers: {
            ...headers,
            'Connection': 'keep-alive', // Enable HTTP keep-alive for connection pooling
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        };
        
        // Use httpsAgent for gateway.pokt.ai to handle self-signed certificates
        // Node.js fetch doesn't support custom agents, so we use a workaround
        if (rpcUrl.includes('gateway.pokt.ai')) {
          // Use https module directly with rejectUnauthorized: false for self-signed certificates
          const url = new URL(rpcUrl);
          const requestBodyStr = JSON.stringify(requestBody);
          
          const httpsResponse = await new Promise<{ status: number; statusText: string; headers: Record<string, string>; body: string }>((resolve, reject) => {
            let resolved = false;
            let timeoutFired = false;
            
            // Set up connection timeout (faster failure for connection issues)
            const connectionTimeout = setTimeout(() => {
              if (!resolved) {
                timeoutFired = true;
                reject(new Error(`Connection timeout after ${RPC_TIMEOUT_MS}ms`));
              }
            }, RPC_TIMEOUT_MS);
            
            const req = https.request({
              hostname: url.hostname,
              port: url.port || 443,
              path: url.pathname + url.search,
              method: 'POST',
              headers: {
                ...headers,
                'Content-Length': Buffer.byteLength(requestBodyStr),
              },
              agent: getAgent(rpcUrl),
              rejectUnauthorized: false, // Allow self-signed certificates
              timeout: RPC_TIMEOUT_MS, // Connection timeout
            }, (res) => {
              clearTimeout(connectionTimeout);
              if (timeoutFired) return;
              
              let body = '';
              res.on('data', (chunk) => { body += chunk; });
              res.on('end', () => {
                if (!resolved) {
                  resolved = true;
                  resolve({
                    status: res.statusCode || 200,
                    statusText: res.statusMessage || 'OK',
                    headers: res.headers as Record<string, string>,
                    body,
                  });
                }
              });
            });
            
            req.on('error', (err) => {
              clearTimeout(connectionTimeout);
              if (!resolved && !timeoutFired) {
                resolved = true;
                reject(err);
              }
            });
            
            req.on('timeout', () => {
              clearTimeout(connectionTimeout);
              if (!resolved && !timeoutFired) {
                timeoutFired = true;
                resolved = true;
                req.destroy();
                reject(new Error('Request timeout'));
              }
            });
            
            req.setTimeout(RPC_TIMEOUT_MS);
            req.write(requestBodyStr);
            req.end();
            
            // Handle abort signal
            controller.signal.addEventListener('abort', () => {
              clearTimeout(connectionTimeout);
              if (!resolved && !timeoutFired) {
                timeoutFired = true;
                resolved = true;
                req.destroy();
                reject(new Error('Request aborted'));
              }
            });
          });
          
          // Convert https response to fetch-like Response object
          response = new Response(httpsResponse.body, {
            status: httpsResponse.status,
            statusText: httpsResponse.statusText,
            headers: httpsResponse.headers,
          });
        } else {
          // Use native fetch for other URLs (Node.js 18+ has built-in connection pooling)
          // Add timeout handling for fetch as well
          const fetchPromise = fetch(rpcUrl, fetchOptions);
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error(`Fetch timeout after ${RPC_TIMEOUT_MS}ms`)), RPC_TIMEOUT_MS);
          });
          response = await Promise.race([fetchPromise, timeoutPromise]);
        }
        clearTimeout(timeoutId);
        
        console.log('[GATEWAY] RPC response received:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
        });
      } catch (error: any) {
        clearTimeout(timeoutId);
        // Handle timeout or network errors
        if (error.name === 'AbortError' || error.name === 'TimeoutError') {
          latency = Date.now() - startTime;
          return NextResponse.json(
            {
              jsonrpc: '2.0',
              error: {
                code: -32603,
                message: `Upstream RPC timeout after ${RPC_TIMEOUT_MS}ms`,
              },
              id: requestBody.id || null,
            },
            { status: 504 } // Gateway Timeout
          );
        }
        throw error;
      }

      // Check response status before reading body
      if (!response.ok) {
        latency = Date.now() - startTime;
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error('[GATEWAY] Upstream RPC error:', {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText.substring(0, 500), // Limit log length
          rpcUrl,
          serviceId,
          networkAppAddress,
          headers: Object.keys(headers),
        });
        return NextResponse.json(
          {
            jsonrpc: '2.0',
            error: {
              code: -32603,
              message: `Upstream RPC error: ${response.status} ${response.statusText}`,
              data: errorText.substring(0, 200), // Limit error text length
            },
            id: requestBody.id || null,
          },
          { status: response.status >= 500 ? 502 : response.status } // Bad Gateway for 5xx errors
        );
      }

      const responseText = await response.text();
      latency = Date.now() - startTime;

      // Try to parse as JSON
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = { 
          jsonrpc: '2.0',
          error: { 
            code: -32700, 
            message: 'Parse error from upstream RPC' 
          },
          id: requestBody.id || null 
        };
      }

      // Cache the response if successful and cacheable (async, fire and forget)
      if (response.ok && !responseData.error) {
        const ttl = getTTLForMethod(requestBody.method, requestBody.params || []);
        if (ttl > 0) {
          // Store in memory cache immediately (synchronous, fast)
          inMemoryRpcCache.set(cacheKey, {
            data: responseData,
            expires: Date.now() + ttl
          });
          // Also cache in Redis (async, fire and forget)
          setImmediate(() => {
            rpcCache.set(cacheKey, responseData, ttl).catch(() => {
              // Silently fail - caching should never block requests
            });
          });
        }
      }
    }

    // Track relay for billing (async, don't wait)
    // IMPORTANT: Usage logging is required for billing/invoicing
    // Only skip if explicitly disabled for load testing (should be re-enabled for production)
    const usageLogMsg = `[${new Date().toISOString()}] [USAGE] Attempting to log usage for endpoint: ${endpointId}, relayCount: 1, latency: ${latency}ms, method: ${requestBody?.method || 'unknown'}, networkId: ${chainId || 'eth'}, DISABLE_USAGE_LOGGING: ${process.env.DISABLE_USAGE_LOGGING}\n`;
    try {
      fs.appendFileSync(logFile, usageLogMsg);
    } catch (e) {}
    // Use upstream latency for logging (actual RPC call time)
    // For cached requests, log 0 latency (they're instant, don't represent actual RPC calls)
    // This ensures we track actual upstream RPC latency for non-cached requests, matching PATH gateway metrics
    const latencyToLog = fromCache ? 0 : (upstreamLatency !== null ? upstreamLatency : latency);
    console.log(`[USAGE] Attempting to log usage for endpoint: ${endpointId}, relayCount: 1, latency: ${latencyToLog}ms (total: ${latency}ms, upstream: ${upstreamLatency !== null ? upstreamLatency + 'ms' : 'N/A'}, cached: ${fromCache}), method: ${requestBody?.method || 'unknown'}, networkId: ${chainId || 'eth'}`);
    if (process.env.DISABLE_USAGE_LOGGING !== 'true') {
      setImmediate(() => {
        // Log all requests (cached and non-cached) for accurate relay counts
        // Cached requests have 0 latency, which is correct (they're instant)
        // Non-cached requests have actual upstream latency
        // When calculating averages, cached requests (0ms) won't skew the results significantly
        usageQueries.logUsage({
          apiKeyId: endpointId || 'unknown', // endpointId is used as apiKeyId in usage_daily table
          relayCount: 1,
          responseTime: latencyToLog, // Use upstream latency for non-cached, 0 for cached
          method: requestBody?.method || 'unknown',
          networkId: chainId || 'eth'
        }).then((result) => {
          const successMsg = `[${new Date().toISOString()}] [USAGE] Successfully logged usage for endpoint: ${endpointId}, result: ${JSON.stringify(result)}\n`;
          try {
            fs.appendFileSync(logFile, successMsg);
          } catch (e) {}
          console.log(`[USAGE] Successfully logged usage for endpoint: ${endpointId}`);
        }).catch((err) => {
          if (!err.message?.includes('too many clients')) {
            const errorMsg = `[${new Date().toISOString()}] [USAGE] Error logging usage for endpoint ${endpointId}: ${err.message}\n`;
            try {
              fs.appendFileSync(logFile, errorMsg);
            } catch (e) {}
            console.error(`[USAGE] Error logging usage for endpoint ${endpointId}:`, err.message);
          }
        });
      });
    } else {
      // Log warning if usage logging is disabled (for production monitoring)
      const disabledMsg = `[${new Date().toISOString()}] [USAGE] Usage logging is DISABLED for endpoint: ${endpointId}\n`;
      try {
        fs.appendFileSync(logFile, disabledMsg);
      } catch (e) {}
      console.warn(`[USAGE] Usage logging is DISABLED for endpoint: ${endpointId}`);
      if (process.env.NODE_ENV === 'production') {
        console.warn('[USAGE] WARNING: Usage logging is DISABLED - billing/invoicing will not work!');
      }
    }

    // Add metadata headers with billing info
    const headers = new Headers();
    headers.set('X-Relay-Latency', latency.toString());
    headers.set('X-From-Cache', fromCache ? 'true' : 'false');
    headers.set('X-Endpoint-ID', endpointId);

    return NextResponse.json(responseData, { headers });
  } catch (error: any) {
    const latency = Date.now() - startTime;
    console.error('Gateway error:', error);
    
    // Log usage even for errors (for tracking/monitoring)
    if (endpointId && process.env.DISABLE_USAGE_LOGGING !== 'true') {
      setImmediate(() => {
        usageQueries.logUsage({
          apiKeyId: endpointId || 'unknown',
          relayCount: 0, // Count as 0 since request failed
          responseTime: latency,
          method: 'unknown',
          networkId: 'unknown'
        }).catch(err => {
          if (!err.message?.includes('too many clients')) {
            console.error('[USAGE] Error logging usage for failed request:', err);
          }
        });
      });
    }
    
    return NextResponse.json(
      {
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: error.message || 'Internal server error',
        },
        id: null,
      },
      { 
        status: 500,
        headers: {
          'X-Relay-Latency': latency.toString(),
        }
      }
    );
  }
}
