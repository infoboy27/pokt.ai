// k6 Validation Load Test Script
// Small test to validate optimizations: 100 RPS for 60 seconds

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const cacheHitRate = new Rate('cache_hit');
const errorRate = new Rate('errors');
const pathGatewayRate = new Rate('path_gateway_used');

// Test configuration
const GATEWAY_URL = __ENV.GATEWAY_URL || 'http://localhost:4000';
const ENDPOINT_ID = __ENV.ENDPOINT_ID || 'endpoint-1';

// Validation test: 100 RPS for 60 seconds
const TEST_DURATION = parseInt(__ENV.TEST_DURATION || '60'); // 60 seconds
const TARGET_RPS = parseInt(__ENV.TARGET_RPS || '100'); // 100 RPS

// RPC methods for testing
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
};

export const options = {
    stages: [
        // Stage 1: Warm-up (10 seconds)
        { duration: '10s', target: 20 },   // Ramp up to 20 RPS

        // Stage 2: Ramp-up to target (10 seconds)
        { duration: '10s', target: TARGET_RPS },  // Ramp up to target RPS

        // Stage 3: Sustained target RPS
        { duration: `${TEST_DURATION}s`, target: TARGET_RPS },  // Stay at target RPS

        // Stage 4: Ramp-down (10 seconds)
        { duration: '10s', target: 0 },     // Ramp down
    ],
    thresholds: {
        // Response time thresholds (more lenient for validation)
        http_req_duration: [
            'p(50)<500',   // 50% of requests < 500ms
            'p(95)<2000',  // 95% of requests < 2s
            'p(99)<5000',  // 99% of requests < 5s
        ],
        // Error rate threshold (more lenient for validation)
        http_req_failed: ['rate<0.20'],    // < 20% errors (validation threshold)
    },
};

function getRandomMethod() {
    const methods = Object.keys(RPC_METHODS);
    const randomMethod = methods[Math.floor(Math.random() * methods.length)];
    return RPC_METHODS[randomMethod];
}

export default function () {
    const rpcMethod = getRandomMethod();

    const url = `${GATEWAY_URL}/api/gateway?endpoint=${ENDPOINT_ID}`;

    const payload = JSON.stringify({
        jsonrpc: '2.0',
        method: rpcMethod.method,
        params: rpcMethod.params,
        id: Math.floor(Math.random() * 1000000),
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
        },
        tags: {
            method: rpcMethod.method,
        },
    };

    const res = http.post(url, payload, params);

    const cacheStatus = res.headers['X-Cache-Status'];
    if (cacheStatus === 'HIT') {
        cacheHitRate.add(1);
    } else {
        cacheHitRate.add(0);
    }

    if (res.status !== 200) {
        errorRate.add(1);
    } else {
        errorRate.add(0);
    }

    // Check if PATH gateway was used (indirectly - if response is fast and successful)
    if (res.status === 200 && res.timings.duration < 1000) {
        pathGatewayRate.add(1); // Likely PATH gateway or cache
    } else {
        pathGatewayRate.add(0);
    }

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

    check(res, checks);

    if (res.status === 429) {
        console.error(`Rate limit error: ${res.status} - ${res.body}`);
    }

    sleep(0.1);
}

export function setup() {
    console.log('═══════════════════════════════════════════════');
    console.log('  k6 Validation Load Test');
    console.log('═══════════════════════════════════════════════');
    console.log(`Gateway URL: ${GATEWAY_URL}`);
    console.log(`Endpoint ID: ${ENDPOINT_ID}`);
    console.log(`Target RPS: ${TARGET_RPS}`);
    console.log(`Duration: ${TEST_DURATION} seconds`);
    console.log(`Total Expected Requests: ~${TARGET_RPS * TEST_DURATION}`);
    console.log('═══════════════════════════════════════════════\n');

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
        console.error(`Note: Continuing with load test anyway`);
        console.error(`Please verify ENDPOINT_ID=${ENDPOINT_ID} is valid if you need successful responses\n`);
    } else {
        console.log('✅ Endpoint is accessible and ready for load testing\n');
    }

    return { endpointId: ENDPOINT_ID, gatewayUrl: GATEWAY_URL };
}

export function teardown(data) {
    console.log('\n═══════════════════════════════════════════════');
    console.log('  Validation Load Test Complete');
    console.log('═══════════════════════════════════════════════');
    console.log(`Endpoint ID: ${data.endpointId}`);
    console.log(`Gateway URL: ${data.gatewayUrl}`);
    console.log('═══════════════════════════════════════════════\n');
}

