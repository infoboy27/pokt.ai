// k6 Load Test Script for pokt.ai Gateway Endpoint
// Tests a specific endpoint with configurable RPS and total requests
// Generates HTML report with pokt.ai branding

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Gateway Configuration
const POKT_AI_GATEWAY_URL = __ENV.POKT_AI_GATEWAY_URL || 'https://pokt.ai/api/gateway';
const ENDPOINT_ID = __ENV.ENDPOINT_ID || 'eth_1760726811471_1760726811479';
const GATEWAY_URL = `${POKT_AI_GATEWAY_URL}?endpoint=${ENDPOINT_ID}`;

// RPC methods to test
const RPC_METHODS = [
  { method: 'eth_blockNumber', params: [] },
  { method: 'eth_gasPrice', params: [] },
];

// Test configuration
const TARGET_RPS = parseInt(__ENV.TARGET_RPS || '500');
const TOTAL_REQUESTS = parseInt(__ENV.TOTAL_REQUESTS || '100000');
const TEST_DURATION = Math.ceil(TOTAL_REQUESTS / TARGET_RPS);

// Custom metrics
const errorRate = new Rate('errors');
const successRate = new Rate('success');
const endpointLatency = new Trend('endpoint_latency');
const methodCounter = {
  eth_blockNumber: new Counter('method_eth_blockNumber'),
  eth_gasPrice: new Counter('method_eth_gasPrice'),
};

// Helper function to get random method
function getRandomMethod() {
  return RPC_METHODS[Math.floor(Math.random() * RPC_METHODS.length)];
}

export const options = {
  stages: [
    // Stage 1: Warm-up (30 seconds) - ramp to 10% of target
    { duration: '30s', target: Math.floor(TARGET_RPS * 0.1) },
    
    // Stage 2: Ramp-up to 50% (30 seconds)
    { duration: '30s', target: Math.floor(TARGET_RPS * 0.5) },
    
    // Stage 3: Ramp-up to 100% (30 seconds)
    { duration: '30s', target: TARGET_RPS },
    
    // Stage 4: Sustained load at target RPS
    { duration: `${TEST_DURATION}s`, target: TARGET_RPS },
    
    // Stage 5: Ramp-down (30 seconds)
    { duration: '30s', target: 0 },
  ],
  maxRedirects: 0,
  noConnectionReuse: false,
  userAgent: 'k6-load-test/1.0',
  thresholds: {
    // Response time thresholds
    http_req_duration: [
      'p(50)<200',   // 50% of requests < 200ms
      'p(95)<1000',  // 95% of requests < 1s
      'p(99)<2000',  // 99% of requests < 2s
    ],
    // Error rate threshold
    http_req_failed: ['rate<0.01'],    // < 1% errors
    errors: ['rate<0.01'],             // < 1% errors
    success: ['rate>0.99'],            // > 99% success
  },
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)', 'p(99.9)', 'p(99.99)', 'count'],
};

function generateHTMLReport(data, methodStats) {
  const metrics = data.metrics || {};
  const httpReqs = metrics.http_reqs && metrics.http_reqs.values ? metrics.http_reqs.values : {};
  const httpReqDuration = metrics.http_req_duration && metrics.http_req_duration.values ? metrics.http_req_duration.values : {};
  const httpReqFailed = metrics.http_req_failed && metrics.http_req_failed.values ? metrics.http_req_failed.values : {};
  
  const totalRequests = httpReqs.count || 0;
  const avgDuration = httpReqDuration.avg || 0;
  const p95Duration = httpReqDuration['p(95)'] || 0;
  const p99Duration = httpReqDuration['p(99)'] || 0;
  const errorRate = (httpReqFailed.rate || 0) * 100;
  const successRate = 100 - errorRate;
  const avgRPS = httpReqs.rate || 0;
  
  const methodRows = RPC_METHODS.map(method => {
    const methodData = methodStats[method.method] || { requests: 0, percentage: '0%' };
    const status = methodData.requests > 0 ? 'success' : 'error';
    return `
      <tr>
        <td><span class="method-badge">${method.method}</span></td>
        <td>${methodData.requests.toLocaleString()}</td>
        <td>${methodData.percentage}</td>
        <td><span class="status-badge status-${status}">${status === 'success' ? 'Active' : 'Inactive'}</span></td>
      </tr>
    `;
  }).join('');
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>pokt.ai Endpoint Load Test Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #0a0e27 0%, #1a1a2e 50%, #16213e 100%);
            color: #ffffff; line-height: 1.6; padding: 20px; min-height: 100vh;
        }
        .container {
            max-width: 1400px; margin: 0 auto; background: rgba(255, 255, 255, 0.05);
            border-radius: 20px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            overflow: hidden; backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #00d4ff 0%, #5b8def 50%, #764ba2 100%);
            color: white; padding: 60px 40px; text-align: center; position: relative; overflow: hidden;
        }
        .header::before {
            content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
            animation: pulse 10s ease-in-out infinite;
        }
        @keyframes pulse { 0%, 100% { transform: scale(1); opacity: 0.5; } 50% { transform: scale(1.1); opacity: 0.8; } }
        .header h1 { font-size: 3.5em; margin-bottom: 10px; font-weight: 700; text-shadow: 0 4px 20px rgba(0, 0, 0, 0.3); position: relative; z-index: 1; }
        .header .logo { font-size: 2.5em; font-weight: 800; margin-bottom: 20px; position: relative; z-index: 1; }
        .header .subtitle { font-size: 1.5em; opacity: 0.95; margin-top: 10px; font-weight: 300; position: relative; z-index: 1; }
        .header .timestamp { font-size: 0.9em; opacity: 0.8; margin-top: 20px; position: relative; z-index: 1; }
        .content { padding: 40px; background: rgba(255, 255, 255, 0.02); }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 25px; margin-bottom: 50px; }
        .metric-card {
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.3) 0%, rgba(118, 75, 162, 0.3) 100%);
            border: 1px solid rgba(255, 255, 255, 0.1); color: white; padding: 30px; border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3); transition: all 0.3s ease; backdrop-filter: blur(10px);
        }
        .metric-card:hover { transform: translateY(-8px); box-shadow: 0 15px 40px rgba(0, 212, 255, 0.3); border-color: rgba(0, 212, 255, 0.5); }
        .metric-card.success { background: linear-gradient(135deg, rgba(76, 175, 80, 0.3) 0%, rgba(56, 142, 60, 0.3) 100%); }
        .metric-card.warning { background: linear-gradient(135deg, rgba(255, 152, 0, 0.3) 0%, rgba(245, 124, 0, 0.3) 100%); }
        .metric-card.error { background: linear-gradient(135deg, rgba(244, 67, 54, 0.3) 0%, rgba(211, 47, 47, 0.3) 100%); }
        .metric-card h3 { font-size: 0.95em; opacity: 0.9; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600; }
        .metric-card .value {
            font-size: 2.8em; font-weight: 700; margin-bottom: 8px;
            background: linear-gradient(135deg, #00d4ff 0%, #ffffff 100%);
            -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .metric-card .label { font-size: 1em; opacity: 0.8; font-weight: 300; }
        .section { margin-bottom: 50px; }
        .section h2 { font-size: 2.2em; margin-bottom: 30px; color: #00d4ff; border-bottom: 3px solid rgba(0, 212, 255, 0.3); padding-bottom: 15px; font-weight: 600; }
        .config-info { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); padding: 30px; border-radius: 15px; margin-bottom: 40px; backdrop-filter: blur(10px); }
        .config-info h3 { margin-bottom: 20px; color: #00d4ff; font-size: 1.5em; font-weight: 600; }
        .config-info .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; }
        .config-info .info-row { padding: 15px; background: rgba(255, 255, 255, 0.05); border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.1); }
        .config-info .info-label { font-weight: 600; color: rgba(255, 255, 255, 0.7); margin-bottom: 5px; font-size: 0.9em; text-transform: uppercase; letter-spacing: 1px; }
        .config-info .info-value { color: #00d4ff; font-size: 1.2em; font-weight: 600; }
        .config-info .info-value.long-text { 
            font-size: 0.75em; 
            font-family: 'Courier New', monospace; 
            word-break: break-all; 
            word-wrap: break-word; 
            line-height: 1.5; 
            max-height: 4.5em; 
            overflow-y: auto; 
            overflow-x: hidden;
            padding: 5px;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 4px;
        }
        .table { width: 100%; border-collapse: collapse; margin-top: 20px; background: rgba(255, 255, 255, 0.05); border-radius: 15px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3); backdrop-filter: blur(10px); }
        .table th {
            background: linear-gradient(135deg, rgba(0, 212, 255, 0.3) 0%, rgba(91, 141, 239, 0.3) 100%);
            color: white; padding: 20px; text-align: left; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; font-size: 0.9em; border-bottom: 2px solid rgba(0, 212, 255, 0.3);
        }
        .table td { padding: 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); color: rgba(255, 255, 255, 0.9); }
        .table tr:hover { background: rgba(0, 212, 255, 0.1); }
        .table tr:last-child td { border-bottom: none; }
        .status-badge { display: inline-block; padding: 8px 20px; border-radius: 25px; font-size: 0.9em; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
        .status-success { background: linear-gradient(135deg, #4caf50 0%, #66bb6a 100%); color: white; box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3); }
        .status-warning { background: linear-gradient(135deg, #ff9800 0%, #ffb74d 100%); color: white; box-shadow: 0 4px 15px rgba(255, 152, 0, 0.3); }
        .status-error { background: linear-gradient(135deg, #f44336 0%, #ef5350 100%); color: white; box-shadow: 0 4px 15px rgba(244, 67, 54, 0.3); }
        .footer { background: rgba(0, 0, 0, 0.3); color: rgba(255, 255, 255, 0.8); padding: 30px; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.1); }
        .footer a { color: #00d4ff; text-decoration: none; font-weight: 600; transition: color 0.3s ease; }
        .footer a:hover { color: #ffffff; text-decoration: underline; }
        .method-badge { display: inline-block; padding: 6px 15px; border-radius: 20px; font-size: 0.85em; font-weight: 600; margin: 5px; background: rgba(0, 212, 255, 0.2); border: 1px solid rgba(0, 212, 255, 0.4); }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">⚡ pokt.ai</div>
            <h1>Endpoint Load Test Report</h1>
            <div class="subtitle">${TOTAL_REQUESTS.toLocaleString()} Requests @ ${TARGET_RPS.toLocaleString()} RPS</div>
            <div class="timestamp">${new Date().toLocaleString()}</div>
        </div>
        <div class="content">
            <div class="config-info">
                <h3>Test Configuration</h3>
                <div class="info-grid">
                    <div class="info-row"><div class="info-label">Endpoint ID</div><div class="info-value long-text" title="${ENDPOINT_ID}">${ENDPOINT_ID}</div></div>
                    <div class="info-row"><div class="info-label">Gateway URL</div><div class="info-value long-text" title="${GATEWAY_URL}">${GATEWAY_URL}</div></div>
                    <div class="info-row"><div class="info-label">Target RPS</div><div class="info-value">${TARGET_RPS.toLocaleString()}</div></div>
                    <div class="info-row"><div class="info-label">Total Requests</div><div class="info-value">${TOTAL_REQUESTS.toLocaleString()}</div></div>
                    <div class="info-row"><div class="info-label">Test Duration</div><div class="info-value">${TEST_DURATION}s (~${Math.floor(TEST_DURATION / 60)} min)</div></div>
                </div>
            </div>
            <div class="summary">
                <div class="metric-card ${successRate >= 99 ? 'success' : successRate >= 95 ? 'warning' : 'error'}">
                    <h3>Success Rate</h3><div class="value">${successRate.toFixed(2)}%</div><div class="label">${totalRequests.toLocaleString()} successful</div>
                </div>
                <div class="metric-card"><h3>Total Requests</h3><div class="value">${totalRequests.toLocaleString()}</div><div class="label">Avg: ${avgRPS.toFixed(2)} req/s</div></div>
                <div class="metric-card ${avgDuration < 200 ? 'success' : avgDuration < 500 ? 'warning' : 'error'}">
                    <h3>Avg Response</h3><div class="value">${(avgDuration / 1000).toFixed(2)}s</div><div class="label">P95: ${(p95Duration / 1000).toFixed(2)}s | P99: ${(p99Duration / 1000).toFixed(2)}s</div>
                </div>
                <div class="metric-card ${errorRate < 1 ? 'success' : errorRate < 5 ? 'warning' : 'error'}">
                    <h3>Error Rate</h3><div class="value">${errorRate.toFixed(2)}%</div><div class="label">${(totalRequests * errorRate / 100).toFixed(0)} failed</div>
                </div>
            </div>
            <div class="section">
                <h2>Method Distribution</h2>
                <table class="table">
                    <thead><tr><th>RPC Method</th><th>Requests</th><th>Percentage</th><th>Status</th></tr></thead>
                    <tbody>${methodRows}</tbody>
                </table>
            </div>
            <div class="section">
                <h2>Performance Metrics</h2>
                <table class="table">
                    <thead><tr><th>Metric</th><th>Value</th><th>Status</th></tr></thead>
                    <tbody>
                        <tr><td>Average Response Time</td><td>${(avgDuration / 1000).toFixed(3)}s</td><td><span class="status-badge status-${avgDuration < 200 ? 'success' : avgDuration < 500 ? 'warning' : 'error'}">${avgDuration < 200 ? 'Excellent' : avgDuration < 500 ? 'Good' : 'Needs Improvement'}</span></td></tr>
                        <tr><td>P95 Response Time</td><td>${(p95Duration / 1000).toFixed(3)}s</td><td><span class="status-badge status-${p95Duration < 1000 ? 'success' : p95Duration < 2000 ? 'warning' : 'error'}">${p95Duration < 1000 ? 'Excellent' : p95Duration < 2000 ? 'Good' : 'Needs Improvement'}</span></td></tr>
                        <tr><td>P99 Response Time</td><td>${(p99Duration / 1000).toFixed(3)}s</td><td><span class="status-badge status-${p99Duration < 2000 ? 'success' : p99Duration < 5000 ? 'warning' : 'error'}">${p99Duration < 2000 ? 'Excellent' : p99Duration < 5000 ? 'Good' : 'Needs Improvement'}</span></td></tr>
                        <tr><td>Requests per Second</td><td>${avgRPS.toFixed(2)} req/s</td><td><span class="status-badge status-${Math.abs(avgRPS - TARGET_RPS) < 100 ? 'success' : 'warning'}">${Math.abs(avgRPS - TARGET_RPS) < 100 ? 'On Target' : 'Variance'}</span></td></tr>
                        <tr><td>Error Rate</td><td>${errorRate.toFixed(2)}%</td><td><span class="status-badge status-${errorRate < 1 ? 'success' : errorRate < 5 ? 'warning' : 'error'}">${errorRate < 1 ? 'Excellent' : errorRate < 5 ? 'Acceptable' : 'High'}</span></td></tr>
                    </tbody>
                </table>
            </div>
        </div>
        <div class="footer">
            <p>© ${new Date().getFullYear()} pokt.ai. All rights reserved.</p>
            <p>Powered by <a href="https://pokt.ai">pokt.ai</a> | Built on <a href="https://www.pokt.network">Pocket Network Shannon</a></p>
        </div>
    </div>
</body>
</html>`;
}

export function handleSummary(data) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const summaryFile = `load-test-results/endpoint-${ENDPOINT_ID}-${timestamp}.json`;
  
  // Calculate method distribution
  const methodStats = {};
  RPC_METHODS.forEach(method => {
    const methodReqs = data.metrics[`method_${method.method}`] && data.metrics[`method_${method.method}`].values 
      ? (data.metrics[`method_${method.method}`].values.count || 0)
      : 0;
    methodStats[method.method] = {
      requests: methodReqs,
      percentage: 0,
    };
  });
  
  const totalRequests = Object.values(methodStats).reduce((sum, stat) => sum + stat.requests, 0);
  Object.keys(methodStats).forEach(method => {
    methodStats[method].percentage = totalRequests > 0 
      ? ((methodStats[method].requests / totalRequests) * 100).toFixed(2) + '%'
      : '0%';
  });
  
  const htmlFile = summaryFile.replace('.json', '.html');
  
  const result = {
    'stdout': textSummary(data, methodStats),
  };
  result[summaryFile] = JSON.stringify({
    metrics: data.metrics,
    root_group: data.root_group,
    state: data.state,
    methodDistribution: methodStats,
    testConfig: {
      endpointId: ENDPOINT_ID,
      gatewayUrl: GATEWAY_URL,
      targetRPS: TARGET_RPS,
      totalRequests: TOTAL_REQUESTS,
      testDuration: TEST_DURATION,
    },
  }, null, 2);
  
  // Generate HTML report
  result[htmlFile] = generateHTMLReport(data, methodStats);
  
  return result;
}

// Main test function
export default function () {
  // Select random method
  const rpcMethod = getRandomMethod();
  
  // Build request
  const payload = JSON.stringify({
    jsonrpc: '2.0',
    method: rpcMethod.method,
    params: rpcMethod.params,
    id: Math.floor(Math.random() * 1000000),
  });
  
  const startTime = Date.now();
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: '30s', // 30 second timeout
    tags: { method: rpcMethod.method },
  };
  const response = http.post(GATEWAY_URL, payload, params);
  const latency = Date.now() - startTime;
  
  // Track metrics - check for success
  let isSuccess = false;
  
  // Check HTTP status
  if (response.status === 200) {
    try {
      const body = JSON.parse(response.body);
      
      // JSON-RPC success: has "result" field and no "error" field
      if (body.result !== undefined && body.result !== null && body.error === undefined) {
        isSuccess = true;
      }
      // If there's an error field, it's a failure (even if status 200)
      else if (body.error !== undefined && body.error !== null) {
        isSuccess = false;
      }
      // If no error and no result, might be a different format
      else if (body.jsonrpc === '2.0' && body.error === undefined) {
        isSuccess = true;
      }
    } catch (e) {
      // If body is not JSON, it's a failure
      isSuccess = false;
    }
  }
  
  // Track method distribution
  methodCounter[rpcMethod.method].add(1);
  
  if (isSuccess) {
    successRate.add(1);
    errorRate.add(0);
    endpointLatency.add(latency);
  } else {
    successRate.add(0);
    errorRate.add(1);
  }
  
  // Use k6's built-in check for reporting
  check(response, {
    'status is 200': (r) => r.status === 200,
    'has valid JSON': (r) => {
      try {
        JSON.parse(r.body);
        return true;
      } catch (e) {
        return false;
      }
    },
    'has result or valid error': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.result !== undefined || (body.error !== undefined && body.jsonrpc === '2.0');
      } catch (e) {
        return false;
      }
    },
  });
  
  // Small sleep to help maintain target RPS
  sleep(0.1);
}

function textSummary(data, methodStats) {
  let summary = '\n';
  summary += '╔═══════════════════════════════════════════════════════╗\n';
  summary += '║     pokt.ai Endpoint Load Test Results               ║\n';
  summary += '╚═══════════════════════════════════════════════════════╝\n\n';
  
  summary += `Endpoint: ${ENDPOINT_ID}\n`;
  summary += `Target: ${TOTAL_REQUESTS.toLocaleString()} requests at ${TARGET_RPS.toLocaleString()} RPS\n`;
  summary += `Duration: ${TEST_DURATION} seconds (~${Math.floor(TEST_DURATION / 60)} minutes)\n`;
  summary += `Gateway: ${GATEWAY_URL}\n`;
  summary += '\n';
  
  // HTTP metrics
  if (data.metrics && data.metrics.http_req_duration && data.metrics.http_req_duration.values) {
    const duration = data.metrics.http_req_duration.values;
    summary += 'Response Times:\n';
    summary += `  Average: ${(duration.avg / 1000).toFixed(2)}s\n`;
    summary += `  Median: ${(duration.med / 1000).toFixed(2)}s\n`;
    summary += `  P95: ${(duration['p(95)'] / 1000).toFixed(2)}s\n`;
    summary += `  P99: ${(duration['p(99)'] / 1000).toFixed(2)}s\n`;
    summary += `  Max: ${(duration.max / 1000).toFixed(2)}s\n\n`;
  }
  
  // Request counts
  if (data.metrics && data.metrics.http_reqs && data.metrics.http_reqs.values) {
    const reqs = data.metrics.http_reqs.values;
    summary += `Total Requests: ${reqs.count.toLocaleString()}\n`;
    summary += `Rate: ${reqs.rate.toFixed(2)} req/s\n\n`;
  }
  
  // Error rate
  if (data.metrics && data.metrics.http_req_failed && data.metrics.http_req_failed.values) {
    const failed = data.metrics.http_req_failed.values;
    summary += `Error Rate: ${(failed.rate * 100).toFixed(2)}%\n`;
    summary += `Success Rate: ${((1 - failed.rate) * 100).toFixed(2)}%\n\n`;
  }
  
  // Method distribution
  summary += 'Method Distribution:\n';
  RPC_METHODS.forEach(method => {
    const methodData = methodStats[method.method] || { requests: 0 };
    const httpReqs = data.metrics.http_reqs && data.metrics.http_reqs.values
      ? data.metrics.http_reqs.values.count
      : 0;
    const percentage = httpReqs > 0
      ? ((methodData.requests / httpReqs) * 100).toFixed(2)
      : '0.00';
    summary += `  ${method.method.padEnd(25)}: ${methodData.requests.toLocaleString()} (${percentage}%)\n`;
  });
  
  summary += '\n';
  return summary;
}

