// k6 Load Test Script for 10M ETH Requests at 5K RPS
// Target: 10,000,000 ETH requests at 5,000 RPS for ~33 minutes

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const cacheHitRate = new Rate('cache_hit');
const errorRate = new Rate('errors');

// Test configuration
const GATEWAY_URL = __ENV.GATEWAY_URL || 'https://pokt.ai';
const ENDPOINT_ID = __ENV.ENDPOINT_ID || 'eth_1760726811471_1760726811479';

// Fixed configuration for 10M requests at 5K RPS
const TEST_DURATION = 2000; // 2000 seconds = ~33 minutes
const TARGET_RPS = 5000; // 5,000 requests per second
const TOTAL_RELAYS = TARGET_RPS * TEST_DURATION; // 10,000,000

// ETH-only RPC methods
const ETH_METHODS = [
  { method: 'eth_blockNumber', params: [] },
  { method: 'eth_gasPrice', params: [] },
  { method: 'eth_getBalance', params: ['0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', 'latest'] },
  { method: 'eth_getBlockByNumber', params: ['latest', false] },
  { method: 'eth_getTransactionCount', params: ['0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', 'latest'] },
];

export const options = {
  stages: [
    // Stage 1: Warm-up (1 minute at 100 RPS)
    { duration: '60s', target: 100 },
    
    // Stage 2: Ramp-up to 1K RPS (2 minutes)
    { duration: '120s', target: 1000 },
    
    // Stage 3: Ramp-up to 5K RPS (3 minutes)
    { duration: '180s', target: 5000 },
    
    // Stage 4: Sustained 5K RPS (33 minutes = 10M requests)
    { duration: `${TEST_DURATION}s`, target: TARGET_RPS },
    
    // Stage 5: Ramp-down (1 minute)
    { duration: '60s', target: 0 },
  ],
  thresholds: {
    // Response time thresholds
    http_req_duration: [
      'p(50)<500',   // 50% of requests < 500ms
      'p(95)<2000',  // 95% of requests < 2s
      'p(99)<5000',  // 99% of requests < 5s
    ],
    // Error rate threshold (relaxed for upstream provider issues)
    http_req_failed: ['rate<0.05'],    // < 5% errors
  },
};

// Helper function to get random ETH RPC method
function getRandomEthMethod() {
  return ETH_METHODS[Math.floor(Math.random() * ETH_METHODS.length)];
}

// Main test function
export default function () {
  const rpcMethod = getRandomEthMethod();
  
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
      chain: 'eth',
      method: rpcMethod.method,
    },
  };
  
  // Make request
  const res = http.post(url, payload, params);
  
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
    'response time < 5s': (r) => r.timings.duration < 5000,
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
  check(res, checks);
  
  // Log rate limit errors
  if (res.status === 429) {
    console.error(`Rate limit error: ${res.status} - ${res.body}`);
  }
  
  // Small delay (k6 handles RPS automatically)
  sleep(0.1);
}

// Setup function (runs once before the test)
export function setup() {
  console.log('═══════════════════════════════════════════════');
  console.log('  k6 Load Test: 10M ETH Requests at 5K RPS');
  console.log('═══════════════════════════════════════════════');
  console.log(`Gateway URL: ${GATEWAY_URL}`);
  console.log(`Endpoint ID: ${ENDPOINT_ID}`);
  console.log(`Target RPS: ${TARGET_RPS}`);
  console.log(`Total Relays: ${TOTAL_RELAYS.toLocaleString()}`);
  console.log(`Duration: ${TEST_DURATION} seconds (~${Math.ceil(TEST_DURATION / 60)} minutes)`);
  console.log(`Chain: ETH only`);
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
    throw new Error(`Endpoint ${ENDPOINT_ID} is not accessible`);
  }
  
  console.log('✅ Endpoint is accessible\n');
  
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

