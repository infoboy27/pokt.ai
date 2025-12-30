// k6 Load Test Script for 10M Relays at 5K RPS across Multiple Chains
// Target: 10,000,000 relays at 5,000 RPS for ~33 minutes across multiple chains

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const cacheHitRate = new Rate('cache_hit');
const chainDistribution = new Counter('chain_distribution');
const errorRate = new Rate('errors');

// Test configuration
const GATEWAY_URL = __ENV.GATEWAY_URL || 'http://localhost:4000';
const ENDPOINT_ID = __ENV.ENDPOINT_ID || 'endpoint-1'; // Must be a valid endpoint ID

// Get test duration and target RPS from environment variables (defaults for full 10M relay test)
const TEST_DURATION = parseInt(__ENV.TEST_DURATION || '2000'); // Default to 2000 seconds for 10M relays
const TARGET_RPS = parseInt(__ENV.TARGET_RPS || '5000'); // Default to 5000 RPS
const TOTAL_RELAYS = TARGET_RPS * TEST_DURATION;

// Multi-chain configuration
const CHAINS = [
  { code: 'eth', methods: ['eth_blockNumber', 'eth_gasPrice', 'eth_getBalance'] },
  { code: 'poly', methods: ['eth_blockNumber', 'eth_gasPrice', 'eth_getBalance'] },
  { code: 'bsc', methods: ['eth_blockNumber', 'eth_gasPrice', 'eth_getBalance'] },
  { code: 'arb-one', methods: ['eth_blockNumber', 'eth_gasPrice', 'eth_getBalance'] },
  { code: 'opt', methods: ['eth_blockNumber', 'eth_gasPrice', 'eth_getBalance'] },
  { code: 'base', methods: ['eth_blockNumber', 'eth_gasPrice', 'eth_getBalance'] },
  { code: 'avax', methods: ['eth_blockNumber', 'eth_gasPrice', 'eth_getBalance'] },
  { code: 'solana', methods: ['getBlockHeight', 'getBalance'] },
];

// RPC methods with different parameters for testing
const RPC_METHODS = {
  eth_blockNumber: { method: 'eth_blockNumber', params: [] },
  eth_gasPrice: { method: 'eth_gasPrice', params: [] },
  eth_getBalance: { 
    method: 'eth_getBalance', 
    params: ['0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', 'latest'] 
  },
  eth_getBlockByNumber: { 
    method: 'eth_getBlockByNumber', 
    params: ['latest', false] 
  },
  getBlockHeight: { method: 'getBlockHeight', params: [] },
  getBalance: { 
    method: 'getBalance', 
    params: ['9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM'] 
  },
};

// TEST_DURATION and TARGET_RPS are defined above

export const options = {
  stages: [
    // Stage 1: Warm-up (30 seconds)
    { duration: '30s', target: Math.min(100, TARGET_RPS / 50) },   // Ramp up to 100 RPS or 2% of target
    
    // Stage 2: Ramp-up to 50% of target (30 seconds)
    { duration: '30s', target: Math.floor(TARGET_RPS / 2) },  // Ramp up to 50% of target
    
    // Stage 3: Sustained target RPS
    { duration: `${TEST_DURATION}s`, target: TARGET_RPS },  // Stay at target RPS
    
    // Stage 4: Ramp-down (30 seconds)
    { duration: '30s', target: 0 },     // Ramp down
  ],
  thresholds: {
    // Response time thresholds
    http_req_duration: [
      'p(50)<100',   // 50% of requests < 100ms
      'p(95)<500',   // 95% of requests < 500ms
      'p(99)<1000',  // 99% of requests < 1s
    ],
    // Error rate threshold
    http_req_failed: ['rate<0.01'],    // < 1% errors
    // Cache hit rate (from headers) - optional, may not be available in all tests
    // cache_hit: ['rate>0.3'], // > 30% cache hit rate
  },
};

// Helper function to get random chain
function getRandomChain() {
  return CHAINS[Math.floor(Math.random() * CHAINS.length)];
}

// Helper function to get random RPC method for chain
function getRandomMethod(chain) {
  const methods = RPC_METHODS[chain.methods[Math.floor(Math.random() * chain.methods.length)]];
  return methods || RPC_METHODS.eth_blockNumber;
}

// Main test function
export default function () {
  // Select random chain for multi-chain testing
  const chain = getRandomChain();
  const rpcMethod = getRandomMethod(chain);
  
  // Build request URL
  const url = `${GATEWAY_URL}/api/gateway?endpoint=${ENDPOINT_ID}`;
  
  // Build RPC request payload
  const payload = JSON.stringify({
    jsonrpc: '2.0',
    method: rpcMethod.method,
    params: rpcMethod.params,
    id: Math.floor(Math.random() * 1000000),
  });
  
  // Request parameters
  const params = {
    headers: { 
      'Content-Type': 'application/json',
    },
    tags: {
      chain: chain.code,
      method: rpcMethod.method,
    },
  };
  
  // Make request
  const res = http.post(url, payload, params);
  
  // Track chain distribution
  chainDistribution.add(1, { chain: chain.code });
  
  // Check cache status from header
  const cacheStatus = res.headers['X-Cache-Status'];
  if (cacheStatus === 'HIT') {
    cacheHitRate.add(1);
  } else {
    cacheHitRate.add(0);
  }
  
  // Check for errors
  if (res.status !== 200) {
    errorRate.add(1);
  } else {
    errorRate.add(0);
  }
  
  // Validate response
  const checks = {
    'status is 200': (r) => r.status === 200,
    'response time < 1s': (r) => r.timings.duration < 1000,
    'valid JSON-RPC response': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.jsonrpc === '2.0' && (body.result !== undefined || body.error !== undefined);
      } catch (e) {
        return false;
      }
    },
    'no rate limit error': (r) => r.status !== 429,
  };
  
  // Perform checks
  const checkResult = check(res, checks);
  
  // Log rate limit errors
  if (res.status === 429) {
    console.error(`Rate limit error: ${res.status} - ${res.body}`);
  }
  
  // Small delay between requests (to maintain target RPS)
  // With 5K RPS, each VU should make ~1 request every 0.2 seconds
  // But k6 handles this automatically based on target RPS
  sleep(0.1);
}

// Setup function (runs once before the test)
export function setup() {
  console.log('═══════════════════════════════════════════════');
  console.log('  k6 Load Test: 10M Relays at 5K RPS');
  console.log('═══════════════════════════════════════════════');
  console.log(`Gateway URL: ${GATEWAY_URL}`);
  console.log(`Endpoint ID: ${ENDPOINT_ID}`);
  console.log(`Target RPS: ${TARGET_RPS}`);
  console.log(`Total Relays: ${TOTAL_RELAYS}`);
  console.log(`Duration: ${TEST_DURATION} seconds (~${Math.ceil(TEST_DURATION / 60)} minutes)`);
  console.log(`Chains: ${CHAINS.length} (${CHAINS.map(c => c.code).join(', ')})`);
  console.log('═══════════════════════════════════════════════\n');
  
  // Verify endpoint is accessible
  const testUrl = `${GATEWAY_URL}/api/gateway?endpoint=${ENDPOINT_ID}`;
  const testPayload = JSON.stringify({
    jsonrpc: '2.0',
    method: 'eth_blockNumber',
    params: [],
    id: 1,
  });
  
  const testRes = http.post(testUrl, testPayload, {
    headers: { 'Content-Type': 'application/json' },
  });
  
  if (testRes.status !== 200) {
    console.error(`⚠️  Endpoint test returned status ${testRes.status}`);
    console.error(`Response: ${testRes.body}`);
    console.error(`Note: Continuing with load test anyway to test gateway capacity`);
    console.error(`Please verify ENDPOINT_ID=${ENDPOINT_ID} is valid if you need successful responses\n`);
  } else {
    console.log('✅ Endpoint is accessible and ready for load testing\n');
  }
  
  return { endpointId: ENDPOINT_ID, gatewayUrl: GATEWAY_URL };
}

// Teardown function (runs once after the test)
export function teardown(data) {
  console.log('\n═══════════════════════════════════════════════');
  console.log('  Load Test Complete');
  console.log('═══════════════════════════════════════════════');
  console.log(`Endpoint ID: ${data.endpointId}`);
  console.log(`Gateway URL: ${data.gatewayUrl}`);
  console.log('═══════════════════════════════════════════════\n');
}

