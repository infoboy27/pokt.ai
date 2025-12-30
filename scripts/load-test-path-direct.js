import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');
const requestCount = new Counter('requests');

// Configuration
const TARGET_RPS = parseInt(__ENV.TARGET_RPS || '2000');
const TOTAL_REQUESTS = parseInt(__ENV.TOTAL_REQUESTS || '1000000');
const DURATION = Math.ceil(TOTAL_REQUESTS / TARGET_RPS);

// PATH Gateway Configuration
const PATH_GATEWAY_URL = __ENV.PATH_GATEWAY_URL || 'http://localhost:3069/v1';
const SERVICE_ID = __ENV.SERVICE_ID || 'eth';
const APP_ADDRESS = __ENV.APP_ADDRESS || 'pokt1q89a5tyhaq5xh49ec5n2wqn5zhynw6fmve06sv';

export const options = {
  stages: [
    { duration: '30s', target: TARGET_RPS }, // Ramp up to target RPS
    { duration: `${DURATION}s`, target: TARGET_RPS }, // Sustain target RPS
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000', 'p(99)<5000'], // 95% under 2s, 99% under 5s
    http_req_failed: ['rate<0.01'], // Less than 1% errors
    errors: ['rate<0.01'], // Less than 1% errors
  },
};

export default function () {
  const payload = JSON.stringify({
    jsonrpc: '2.0',
    method: 'eth_blockNumber',
    params: [],
    id: Math.floor(Math.random() * 1000000),
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Target-Service-Id': SERVICE_ID,
      'App-Address': APP_ADDRESS,
    },
    timeout: '5s', // 5 second timeout
  };

  const startTime = Date.now();
  const response = http.post(PATH_GATEWAY_URL, payload, params);
  const duration = Date.now() - startTime;

  // Track metrics
  requestCount.add(1);
  responseTime.add(duration);

  // Check response
  const success = check(response, {
    'status is 200': (r) => r.status === 200,
    'has result': (r) => {
      try {
        const body = JSON.parse(r.body);
        // Success if result exists
        return body.result !== undefined;
      } catch (e) {
        // If body is not JSON, it's a failure
        return false;
      }
    },
    'response time < 2s': (r) => r.timings.duration < 2000,
    'response time < 5s': (r) => r.timings.duration < 5000,
  });

  if (!success) {
    errorRate.add(1);
  } else {
    errorRate.add(0);
  }

  // No sleep - k6 will control the rate via stages
}

export function handleSummary(data) {
  const totalRequests = data.metrics.requests.values.count;
  const totalErrors = data.metrics.errors.values.count;
  const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;
  const successRate = 100 - errorRate;
  const avgResponseTime = data.metrics.response_time.values.avg;
  const p95ResponseTime = data.metrics.response_time.values['p(95)'];
  const p99ResponseTime = data.metrics.response_time.values['p(99)'];
  const maxResponseTime = data.metrics.response_time.values.max;
  const minResponseTime = data.metrics.response_time.values.min;
  const medianResponseTime = data.metrics.response_time.values.med;
  const rps = data.metrics.http_reqs.values.rate;

  return {
    stdout: `
═══════════════════════════════════════════════════════════════
  PATH Gateway Direct Load Test Results
═══════════════════════════════════════════════════════════════

Target: ${TOTAL_REQUESTS.toLocaleString()} requests at ${TARGET_RPS} RPS
Duration: ${data.state.testRunDurationMs / 1000}s (~${Math.round(data.state.testRunDurationMs / 60000)} minutes)

Gateway: ${PATH_GATEWAY_URL}
Service: ${SERVICE_ID}
App Address: ${APP_ADDRESS}

Response Times:
  Average: ${(avgResponseTime / 1000).toFixed(2)}s
  Median: ${(medianResponseTime / 1000).toFixed(2)}s
  Min: ${(minResponseTime / 1000).toFixed(2)}s
  Max: ${(maxResponseTime / 1000).toFixed(2)}s
  P95: ${(p95ResponseTime / 1000).toFixed(2)}s
  P99: ${(p99ResponseTime / 1000).toFixed(2)}s

Total Requests: ${totalRequests.toLocaleString()}
Rate: ${rps.toFixed(2)} req/s

Error Rate: ${errorRate.toFixed(2)}%
Success Rate: ${successRate.toFixed(2)}%

═══════════════════════════════════════════════════════════════
`,
    'path-gateway-load-test-summary.json': JSON.stringify(data, null, 2),
  };
}

