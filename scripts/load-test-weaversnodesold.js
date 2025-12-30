// k6 Load Test Script for PATH Gateway - Multi-Chain Support
// Target: Multiple chains with specific app addresses
// Generates HTML report with pokt.ai branding

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Gateway Configuration
const GATEWAY_URL = __ENV.GATEWAY_URL || 'https://gateway.weaversnodes.org/v1';

// Chain configuration with app addresses (from user's curl commands)
const CHAINS = [
  { serviceId: 'eth', appAddress: 'pokt1zp90apxzym50uu6jt89p30urd69gfp7nu2u2w9', method: 'eth_blockNumber', weight: 8 },
  { serviceId: 'avax', appAddress: 'pokt16l4v7k8ks7u0ymgj0utxu6fjdy62jhp8t85wzr', method: 'eth_blockNumber', weight: 8 },
  { serviceId: 'bsc', appAddress: 'pokt1du5ve83cj92qx0swvym7s6934a2rver68jje2z', method: 'eth_blockNumber', weight: 8 },
  { serviceId: 'opt', appAddress: 'pokt1hcn484sc9w3xqdwajv7cz06wys3r4az999ds36', method: 'eth_blockNumber', weight: 8 },
  { serviceId: 'opt-sepolia-testnet', appAddress: 'pokt1d465ferla2t2qacj88290ucqhqqflak34jevtu', method: 'eth_blockNumber', weight: 4 },
  { serviceId: 'arb-one', appAddress: 'pokt1ew5j579vqjes85g7rprvyd6zt9qndc3m9edx8w', method: 'eth_blockNumber', weight: 8 },
  { serviceId: 'base', appAddress: 'pokt1lylg9luqsvlwtynvu6kjse5qp98phyfwh9jgys', method: 'eth_blockNumber', weight: 8 },
  { serviceId: 'linea', appAddress: 'pokt1t787eh3punnjrmp8j5metng52jpnvzu0s4nmwz', method: 'eth_blockNumber', weight: 4 },
  { serviceId: 'fraxtal', appAddress: 'pokt132gsqxk77e47jyfe5mhkjgl0ujnrk2mdn6t2qx', method: 'eth_blockNumber', weight: 4 },
  { serviceId: 'metis', appAddress: 'pokt18498w7s4fgs95fywl8dftyznhk80sqmdh66m2a', method: 'eth_blockNumber', weight: 4 },
  { serviceId: 'blast', appAddress: 'pokt1ksfan89g3gengqvzh4hyr728p902l4l8aaytxe', method: 'eth_blockNumber', weight: 4 },
  { serviceId: 'arb-sepolia-testnet', appAddress: 'pokt19m003r2agfr9wv7qldm9ak7g7lkfu8tyx20vxz', method: 'eth_blockNumber', weight: 2 },
  { serviceId: 'base-sepolia-testnet', appAddress: 'pokt1339ddj4v4zangj4svjqfh3n2307zvmm4mfqzmy', method: 'eth_blockNumber', weight: 2 },
  { serviceId: 'boba', appAddress: 'pokt14mpsqly7xyyn4hpcaelmn49dq4pkws9wr7fh6f', method: 'eth_blockNumber', weight: 4 },
  { serviceId: 'eth-holesky-testnet', appAddress: 'pokt19z9kjvhwdncmjeflnasm0zglenkhly5zrse9un', method: 'eth_blockNumber', weight: 2 },
  { serviceId: 'fantom', appAddress: 'pokt14fnfvne4mh0m8lh63nremuxmdl5qp2kxtljkfs', method: 'eth_blockNumber', weight: 4 },
  { serviceId: 'gnosis', appAddress: 'pokt1jcas7t3nsy9cp7k47mzwxycu2vc2hx2ynhgvr4', method: 'eth_blockNumber', weight: 4 },
  { serviceId: 'ink', appAddress: 'pokt105e4uw6j3ndjtjncx37mkfget667tf5tfccjff', method: 'eth_blockNumber', weight: 2 },
  { serviceId: 'kava', appAddress: 'pokt16rg6xfywfkxgaglpykkgrvx006v9n8jveq2f2y', method: 'eth_blockNumber', weight: 4 },
  { serviceId: 'oasys', appAddress: 'pokt1nnkjgpzzuuadyexuepuewj97p7s8hcdqapamgt', method: 'eth_blockNumber', weight: 2 },
  { serviceId: 'solana', appAddress: 'pokt1fks44f9k05gml6lyatjqsexwuch7qj8c8xuhuy', method: 'getSlot', weight: 4 }, // Solana uses getSlot
  { serviceId: 'sonic', appAddress: 'pokt18gnh7tenrxfne25daxxs2qrdxu0e0h4nd4kc9g', method: 'eth_blockNumber', weight: 2 },
  { serviceId: 'eth-sepolia-testnet', appAddress: 'pokt1vpfcw5sqa7ypzekcdgnehhqkuqtx0hcqqh5mql', method: 'eth_blockNumber', weight: 2 },
];

// RPC methods mapping
const RPC_METHODS = {
  eth_blockNumber: { method: 'eth_blockNumber', params: [] },
  getSlot: { method: 'getSlot', params: [] }, // Solana method
};

// Test configuration
const TARGET_RPS = parseInt(__ENV.TARGET_RPS || '500');
const TOTAL_REQUESTS = parseInt(__ENV.TOTAL_REQUESTS || '100000');
const TEST_DURATION = Math.ceil(TOTAL_REQUESTS / TARGET_RPS);

// Custom metrics - create separate counter for each chain
const chainDistribution = {};
CHAINS.forEach(chain => {
  const metricName = `chain_${chain.serviceId.replace(/-/g, '_')}_requests`;
  chainDistribution[chain.serviceId] = {
    counter: new Counter(metricName),
    metricName: metricName,
  };
});
const errorRate = new Rate('errors');
const successRate = new Rate('success');
const pathLatency = new Trend('path_latency');

// Build weighted chain array for distribution
const weightedChains = [];
CHAINS.forEach(chain => {
  for (let i = 0; i < chain.weight; i++) {
    weightedChains.push(chain);
  }
});

// Helper function to get random chain based on weights
function getRandomChain() {
  return weightedChains[Math.floor(Math.random() * weightedChains.length)];
}

// Helper function to get method for chain
function getMethod(chain) {
  return RPC_METHODS[chain.method] || RPC_METHODS.eth_blockNumber;
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

function generateHTMLReport(data, chainStats) {
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
  
  const chainRows = CHAINS.map(chain => {
    const chainData = chainStats[chain.serviceId] || { requests: 0, percentage: '0%', appAddress: chain.appAddress };
    const status = chainData.requests > 0 ? 'success' : 'error';
    return `
      <tr>
        <td><span class="chain-badge">${chain.serviceId}</span></td>
        <td style="font-family: monospace; font-size: 0.85em;">${chain.appAddress}</td>
        <td>${chainData.requests.toLocaleString()}</td>
        <td>${chainData.percentage}</td>
        <td><span class="status-badge status-${status}">${status === 'success' ? 'Active' : 'Inactive'}</span></td>
      </tr>
    `;
  }).join('');
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PATH Gateway Load Test Report - pokt.ai</title>
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
        .chain-badge { display: inline-block; padding: 6px 15px; border-radius: 20px; font-size: 0.85em; font-weight: 600; margin: 5px; background: rgba(0, 212, 255, 0.2); border: 1px solid rgba(0, 212, 255, 0.4); }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">⚡ pokt.ai</div>
            <h1>PATH Gateway Load Test Report</h1>
            <div class="subtitle">${TOTAL_REQUESTS.toLocaleString()} Requests @ ${TARGET_RPS.toLocaleString()} RPS - Multi-Chain Performance</div>
            <div class="timestamp">${new Date().toLocaleString()}</div>
        </div>
        <div class="content">
            <div class="config-info">
                <h3>Test Configuration</h3>
                <div class="info-grid">
                    <div class="info-row"><div class="info-label">Gateway URL</div><div class="info-value long-text" title="${GATEWAY_URL}">${GATEWAY_URL}</div></div>
                    <div class="info-row"><div class="info-label">Target RPS</div><div class="info-value">${TARGET_RPS.toLocaleString()}</div></div>
                    <div class="info-row"><div class="info-label">Total Requests</div><div class="info-value">${TOTAL_REQUESTS.toLocaleString()}</div></div>
                    <div class="info-row"><div class="info-label">Test Duration</div><div class="info-value">${TEST_DURATION}s (~${Math.floor(TEST_DURATION / 60)} min)</div></div>
                    <div class="info-row"><div class="info-label">Total Chains</div><div class="info-value">${CHAINS.length}</div></div>
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
                <h2>Chain Distribution</h2>
                <table class="table">
                    <thead><tr><th>Chain</th><th>App Address</th><th>Requests</th><th>Percentage</th><th>Status</th></tr></thead>
                    <tbody>${chainRows}</tbody>
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
  const summaryFile = `load-test-results/weaversnodes-multichain-${timestamp}.json`;
  
  // Calculate chain distribution
  const chainStats = {};
  CHAINS.forEach(chain => {
    const metricName = chainDistribution[chain.serviceId].metricName;
    const chainReqs = data.metrics[metricName] && data.metrics[metricName].values 
      ? (data.metrics[metricName].values.count || 0)
      : 0;
    chainStats[chain.serviceId] = {
      appAddress: chain.appAddress,
      requests: chainReqs,
      percentage: 0,
    };
  });
  
  const totalRequests = Object.values(chainStats).reduce((sum, stat) => sum + stat.requests, 0);
  Object.keys(chainStats).forEach(chainId => {
    chainStats[chainId].percentage = totalRequests > 0 
      ? ((chainStats[chainId].requests / totalRequests) * 100).toFixed(2) + '%'
      : '0%';
  });
  
  const htmlFile = summaryFile.replace('.json', '.html');
  
  const result = {
    'stdout': textSummary(data, chainStats),
  };
  result[summaryFile] = JSON.stringify({
    metrics: data.metrics,
    root_group: data.root_group,
    state: data.state,
    chainDistribution: chainStats,
    testConfig: {
      targetRPS: TARGET_RPS,
      totalRequests: TOTAL_REQUESTS,
      testDuration: TEST_DURATION,
      gatewayUrl: GATEWAY_URL,
      chains: CHAINS.length,
    },
  }, null, 2);
  
  // Generate HTML report
  result[htmlFile] = generateHTMLReport(data, chainStats);
  
  return result;
}

// Main test function
export default function () {
  // Select random chain based on weights
  const chain = getRandomChain();
  const rpcMethod = getMethod(chain);
  
  // Build request
  const url = GATEWAY_URL;
  const headers = {
    'Content-Type': 'application/json',
    'Target-Service-Id': chain.serviceId,
    'App-Address': chain.appAddress,
  };
  
  const payload = JSON.stringify({
    jsonrpc: '2.0',
    method: rpcMethod.method,
    params: rpcMethod.params,
    id: Math.floor(Math.random() * 1000000),
  });
  
  const startTime = Date.now();
  const params = {
    headers: headers,
    timeout: '30s', // 30 second timeout
    tags: { chain: chain.serviceId, method: rpcMethod.method },
  };
  const response = http.post(url, payload, params);
  const latency = Date.now() - startTime;
  
  // Track metrics - check for success more carefully
  let isSuccess = false;
  let errorType = 'unknown';
  
  // First check HTTP status
  if (response.status === 200) {
    try {
      const body = JSON.parse(response.body);
      
      // JSON-RPC success: has "result" field and no "error" field
      // Check for standard JSON-RPC success format
      if (body.result !== undefined && body.result !== null && body.error === undefined) {
        isSuccess = true;
      }
      // Also check for alternative success formats (some gateways return differently)
      else if (body.jsonrpc === '2.0' && body.result !== undefined && body.error === undefined) {
        isSuccess = true;
      }
      // If there's an error field, it's a failure (even if status 200)
      else if (body.error !== undefined && body.error !== null) {
        isSuccess = false;
        // Categorize error types
        if (body.error.code) {
          if (body.error.code === -31001 || body.error.message && body.error.message.includes('Failed to receive')) {
            errorType = 'timeout';
          } else if (body.error.code === -32000 || body.error.message && body.error.message.includes('rate limit')) {
            errorType = 'rate_limit';
          } else if (body.error.code === -32603) {
            errorType = 'internal_error';
          } else {
            errorType = `rpc_error_${body.error.code}`;
          }
        } else {
          errorType = 'rpc_error';
        }
      }
      // If no error and no result, might be a different format - check if it's a valid response structure
      else if (body.jsonrpc === '2.0' && body.error === undefined) {
        // Might be success with empty/null result - treat as success
        isSuccess = true;
      } else {
        errorType = 'invalid_response_format';
      }
    } catch (e) {
      // If body is not JSON, it's a failure
      isSuccess = false;
      errorType = 'parse_error';
    }
  } else if (response.status === 429) {
    // Rate limit
    isSuccess = false;
    errorType = 'rate_limit_http';
  } else if (response.status >= 500) {
    // Server error
    isSuccess = false;
    errorType = 'server_error';
  } else if (response.status >= 400) {
    // Client error
    isSuccess = false;
    errorType = 'client_error';
  } else {
    // Other HTTP status
    isSuccess = false;
    errorType = `http_${response.status}`;
  }
  
  // Track chain distribution regardless of success/failure
  chainDistribution[chain.serviceId].counter.add(1);
  
  if (isSuccess) {
    successRate.add(1);
    errorRate.add(0);
    pathLatency.add(latency);
  } else {
    successRate.add(0);
    errorRate.add(1);
    // Only track latency for successful requests in pathLatency metric
  }
  
  // Also use k6's built-in check for reporting (for k6's built-in metrics)
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
        // Valid if it has either result (success) or error (valid JSON-RPC error)
        return body.result !== undefined || (body.error !== undefined && body.jsonrpc === '2.0');
      } catch (e) {
        return false;
      }
    },
  });
  
  // Small sleep to help maintain target RPS (k6 handles this automatically, but helps with distribution)
  sleep(0.1);
}

function textSummary(data, chainStats) {
  let summary = '\n';
  summary += '╔═══════════════════════════════════════════════════════╗\n';
  summary += '║     PATH Gateway Load Test Results                  ║\n';
  summary += '╚═══════════════════════════════════════════════════════╝\n\n';
  
  summary += `Target: ${TOTAL_REQUESTS.toLocaleString()} requests at ${TARGET_RPS.toLocaleString()} RPS\n`;
  summary += `Duration: ${TEST_DURATION} seconds (~${Math.floor(TEST_DURATION / 60)} minutes)\n`;
  summary += `Gateway: ${GATEWAY_URL}\n`;
  summary += `Total Chains: ${CHAINS.length}\n`;
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
  
  // Chain distribution
  summary += 'Chain Distribution:\n';
  CHAINS.forEach(chain => {
    const chainData = chainStats[chain.serviceId] || { requests: 0 };
    const httpReqs = data.metrics.http_reqs && data.metrics.http_reqs.values
      ? data.metrics.http_reqs.values.count
      : 0;
    const percentage = httpReqs > 0
      ? ((chainData.requests / httpReqs) * 100).toFixed(2)
      : '0.00';
    summary += `  ${chain.serviceId.padEnd(25)}: ${chainData.requests.toLocaleString()} (${percentage}%)\n`;
  });
  
  summary += '\n';
  return summary;
}
