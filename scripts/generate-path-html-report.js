#!/usr/bin/env node
// Generate HTML Report for PATH Gateway Load Test with pokt.ai Branding

const fs = require('fs');
const path = require('path');

// Get JSON summary file from k6
const jsonFile = process.argv[2] || process.argv[1].replace('load-test-path-1m-5krps.js', 'load-test-results/path-1m-5krps-*.json');
const outputFile = process.argv[3] || 'load-test-results/path-load-test-report.html';

// Read and parse JSON data
let data = {};
if (fs.existsSync(jsonFile)) {
  try {
    data = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
  } catch (e) {
    console.error('Error parsing JSON:', e.message);
    process.exit(1);
  }
} else {
  console.error('JSON file not found:', jsonFile);
  process.exit(1);
}

// Extract metrics
const metrics = data.metrics || {};
const httpReqs = metrics.http_reqs?.values || {};
const httpReqDuration = metrics.http_req_duration?.values || {};
const httpReqFailed = metrics.http_req_failed?.values || {};
const testConfig = data.testConfig || {};
const chainDistribution = data.chainDistribution || {};

// Calculate values
const totalRequests = httpReqs.count || 0;
const avgDuration = httpReqDuration.avg || 0;
const p95Duration = httpReqDuration['p(95)'] || 0;
const p99Duration = httpReqDuration['p(99)'] || 0;
const errorRate = (httpReqFailed.rate || 0) * 100;
const successRate = 100 - errorRate;
const avgRPS = httpReqs.rate || 0;

// Generate HTML with pokt.ai branding
const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PATH Gateway Load Test Report - pokt.ai</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #0a0e27 0%, #1a1a2e 50%, #16213e 100%);
            color: #ffffff;
            line-height: 1.6;
            padding: 20px;
            min-height: 100vh;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            overflow: hidden;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .header {
            background: linear-gradient(135deg, #00d4ff 0%, #5b8def 50%, #764ba2 100%);
            color: white;
            padding: 60px 40px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
            animation: pulse 10s ease-in-out infinite;
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 0.5; }
            50% { transform: scale(1.1); opacity: 0.8; }
        }
        
        .header h1 {
            font-size: 3.5em;
            margin-bottom: 10px;
            font-weight: 700;
            text-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            position: relative;
            z-index: 1;
        }
        
        .header .logo {
            font-size: 2.5em;
            font-weight: 800;
            margin-bottom: 20px;
            position: relative;
            z-index: 1;
        }
        
        .header .subtitle {
            font-size: 1.5em;
            opacity: 0.95;
            margin-top: 10px;
            font-weight: 300;
            position: relative;
            z-index: 1;
        }
        
        .header .timestamp {
            font-size: 0.9em;
            opacity: 0.8;
            margin-top: 20px;
            position: relative;
            z-index: 1;
        }
        
        .content {
            padding: 40px;
            background: rgba(255, 255, 255, 0.02);
        }
        
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 25px;
            margin-bottom: 50px;
        }
        
        .metric-card {
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.3) 0%, rgba(118, 75, 162, 0.3) 100%);
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
        }
        
        .metric-card:hover {
            transform: translateY(-8px);
            box-shadow: 0 15px 40px rgba(0, 212, 255, 0.3);
            border-color: rgba(0, 212, 255, 0.5);
        }
        
        .metric-card.success {
            background: linear-gradient(135deg, rgba(76, 175, 80, 0.3) 0%, rgba(56, 142, 60, 0.3) 100%);
        }
        
        .metric-card.warning {
            background: linear-gradient(135deg, rgba(255, 152, 0, 0.3) 0%, rgba(245, 124, 0, 0.3) 100%);
        }
        
        .metric-card.error {
            background: linear-gradient(135deg, rgba(244, 67, 54, 0.3) 0%, rgba(211, 47, 47, 0.3) 100%);
        }
        
        .metric-card h3 {
            font-size: 0.95em;
            opacity: 0.9;
            margin-bottom: 15px;
            text-transform: uppercase;
            letter-spacing: 2px;
            font-weight: 600;
        }
        
        .metric-card .value {
            font-size: 2.8em;
            font-weight: 700;
            margin-bottom: 8px;
            background: linear-gradient(135deg, #00d4ff 0%, #ffffff 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .metric-card .label {
            font-size: 1em;
            opacity: 0.8;
            font-weight: 300;
        }
        
        .section {
            margin-bottom: 50px;
        }
        
        .section h2 {
            font-size: 2.2em;
            margin-bottom: 30px;
            color: #00d4ff;
            border-bottom: 3px solid rgba(0, 212, 255, 0.3);
            padding-bottom: 15px;
            font-weight: 600;
        }
        
        .config-info {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            padding: 30px;
            border-radius: 15px;
            margin-bottom: 40px;
            backdrop-filter: blur(10px);
        }
        
        .config-info h3 {
            margin-bottom: 20px;
            color: #00d4ff;
            font-size: 1.5em;
            font-weight: 600;
        }
        
        .config-info .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
        }
        
        .config-info .info-row {
            padding: 15px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .config-info .info-label {
            font-weight: 600;
            color: rgba(255, 255, 255, 0.7);
            margin-bottom: 5px;
            font-size: 0.9em;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .config-info .info-value {
            color: #00d4ff;
            font-size: 1.2em;
            font-weight: 600;
        }
        
        .table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 15px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(10px);
        }
        
        .table th {
            background: linear-gradient(135deg, rgba(0, 212, 255, 0.3) 0%, rgba(91, 141, 239, 0.3) 100%);
            color: white;
            padding: 20px;
            text-align: left;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-size: 0.9em;
            border-bottom: 2px solid rgba(0, 212, 255, 0.3);
        }
        
        .table td {
            padding: 20px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            color: rgba(255, 255, 255, 0.9);
        }
        
        .table tr:hover {
            background: rgba(0, 212, 255, 0.1);
        }
        
        .table tr:last-child td {
            border-bottom: none;
        }
        
        .status-badge {
            display: inline-block;
            padding: 8px 20px;
            border-radius: 25px;
            font-size: 0.9em;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .status-success {
            background: linear-gradient(135deg, #4caf50 0%, #66bb6a 100%);
            color: white;
            box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
        }
        
        .status-warning {
            background: linear-gradient(135deg, #ff9800 0%, #ffb74d 100%);
            color: white;
            box-shadow: 0 4px 15px rgba(255, 152, 0, 0.3);
        }
        
        .status-error {
            background: linear-gradient(135deg, #f44336 0%, #ef5350 100%);
            color: white;
            box-shadow: 0 4px 15px rgba(244, 67, 54, 0.3);
        }
        
        .footer {
            background: rgba(0, 0, 0, 0.3);
            color: rgba(255, 255, 255, 0.8);
            padding: 30px;
            text-align: center;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .footer a {
            color: #00d4ff;
            text-decoration: none;
            font-weight: 600;
            transition: color 0.3s ease;
        }
        
        .footer a:hover {
            color: #ffffff;
            text-decoration: underline;
        }
        
        .progress-bar {
            width: 100%;
            height: 40px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            overflow: hidden;
            margin-top: 15px;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #00d4ff 0%, #5b8def 100%);
            transition: width 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 700;
            font-size: 1.1em;
            box-shadow: 0 4px 15px rgba(0, 212, 255, 0.5);
        }
        
        .chain-badge {
            display: inline-block;
            padding: 6px 15px;
            border-radius: 20px;
            font-size: 0.85em;
            font-weight: 600;
            margin: 5px;
            background: rgba(0, 212, 255, 0.2);
            border: 1px solid rgba(0, 212, 255, 0.4);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">⚡ pokt.ai</div>
            <h1>PATH Gateway Load Test Report</h1>
            <div class="subtitle">1M Requests @ 5K RPS - Multi-Chain Performance Analysis</div>
            <div class="timestamp">${new Date().toLocaleString()}</div>
        </div>
        
        <div class="content">
            <div class="config-info">
                <h3>Test Configuration</h3>
                <div class="info-grid">
                    <div class="info-row">
                        <div class="info-label">Gateway URL</div>
                        <div class="info-value">${testConfig.gatewayUrl || 'http://localhost:3069/v1'}</div>
                    </div>
                    <div class="info-row">
                        <div class="info-label">Target RPS</div>
                        <div class="info-value">${(testConfig.targetRPS || 5000).toLocaleString()}</div>
                    </div>
                    <div class="info-row">
                        <div class="info-label">Total Requests</div>
                        <div class="info-value">${(testConfig.totalRequests || 1000000).toLocaleString()}</div>
                    </div>
                    <div class="info-row">
                        <div class="info-label">Test Duration</div>
                        <div class="info-value">${testConfig.testDuration || 200} seconds (~${Math.floor((testConfig.testDuration || 200) / 60)} minutes)</div>
                    </div>
                </div>
            </div>
            
            <div class="summary">
                <div class="metric-card ${successRate >= 99 ? 'success' : successRate >= 95 ? 'warning' : 'error'}">
                    <h3>Success Rate</h3>
                    <div class="value">${successRate.toFixed(2)}%</div>
                    <div class="label">${totalRequests.toLocaleString()} successful requests</div>
                </div>
                
                <div class="metric-card">
                    <h3>Total Requests</h3>
                    <div class="value">${totalRequests.toLocaleString()}</div>
                    <div class="label">Average: ${avgRPS.toFixed(2)} req/s</div>
                </div>
                
                <div class="metric-card ${avgDuration < 200 ? 'success' : avgDuration < 500 ? 'warning' : 'error'}">
                    <h3>Avg Response Time</h3>
                    <div class="value">${(avgDuration / 1000).toFixed(2)}s</div>
                    <div class="label">P95: ${(p95Duration / 1000).toFixed(2)}s | P99: ${(p99Duration / 1000).toFixed(2)}s</div>
                </div>
                
                <div class="metric-card ${errorRate < 1 ? 'success' : errorRate < 5 ? 'warning' : 'error'}">
                    <h3>Error Rate</h3>
                    <div class="value">${errorRate.toFixed(2)}%</div>
                    <div class="label">${(totalRequests * errorRate / 100).toFixed(0)} failed requests</div>
                </div>
            </div>
            
            <div class="section">
                <h2>Chain Distribution</h2>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Chain</th>
                            <th>App Address</th>
                            <th>Requests</th>
                            <th>Percentage</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${Object.keys(chainDistribution).map(chainId => {
                          const chain = chainDistribution[chainId];
                          const requests = chain.requests || 0;
                          const percentage = chain.percentage || '0%';
                          const status = requests > 0 ? 'success' : 'error';
                          return \`
                            <tr>
                                <td><span class="chain-badge">\${chainId}</span></td>
                                <td style="font-family: monospace; font-size: 0.85em;">\${chain.appAddress || 'N/A'}</td>
                                <td>\${requests.toLocaleString()}</td>
                                <td>\${percentage}</td>
                                <td><span class="status-badge status-\${status}">\${status === 'success' ? 'Active' : 'Inactive'}</span></td>
                            </tr>
                          \`;
                        }).join('')}
                    </tbody>
                </table>
            </div>
            
            <div class="section">
                <h2>Performance Metrics</h2>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Metric</th>
                            <th>Value</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Average Response Time</td>
                            <td>\${(avgDuration / 1000).toFixed(3)}s</td>
                            <td><span class="status-badge status-\${avgDuration < 200 ? 'success' : avgDuration < 500 ? 'warning' : 'error'}">\${avgDuration < 200 ? 'Excellent' : avgDuration < 500 ? 'Good' : 'Needs Improvement'}</span></td>
                        </tr>
                        <tr>
                            <td>P95 Response Time</td>
                            <td>\${(p95Duration / 1000).toFixed(3)}s</td>
                            <td><span class="status-badge status-\${p95Duration < 1000 ? 'success' : p95Duration < 2000 ? 'warning' : 'error'}">\${p95Duration < 1000 ? 'Excellent' : p95Duration < 2000 ? 'Good' : 'Needs Improvement'}</span></td>
                        </tr>
                        <tr>
                            <td>P99 Response Time</td>
                            <td>\${(p99Duration / 1000).toFixed(3)}s</td>
                            <td><span class="status-badge status-\${p99Duration < 2000 ? 'success' : p99Duration < 5000 ? 'warning' : 'error'}">\${p99Duration < 2000 ? 'Excellent' : p99Duration < 5000 ? 'Good' : 'Needs Improvement'}</span></td>
                        </tr>
                        <tr>
                            <td>Requests per Second</td>
                            <td>\${avgRPS.toFixed(2)} req/s</td>
                            <td><span class="status-badge status-\${Math.abs(avgRPS - (testConfig.targetRPS || 5000)) < 100 ? 'success' : 'warning'}">\${Math.abs(avgRPS - (testConfig.targetRPS || 5000)) < 100 ? 'On Target' : 'Variance'}</span></td>
                        </tr>
                        <tr>
                            <td>Error Rate</td>
                            <td>\${errorRate.toFixed(2)}%</td>
                            <td><span class="status-badge status-\${errorRate < 1 ? 'success' : errorRate < 5 ? 'warning' : 'error'}">\${errorRate < 1 ? 'Excellent' : errorRate < 5 ? 'Acceptable' : 'High'}</span></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
        
        <div class="footer">
            <p>© \${new Date().getFullYear()} pokt.ai. All rights reserved.</p>
            <p>Powered by <a href="https://pokt.ai">pokt.ai</a> | Built on <a href="https://www.pokt.network">Pocket Network Shannon</a></p>
        </div>
    </div>
</body>
</html>`;

// Write HTML file
fs.writeFileSync(outputFile, html, 'utf8');
console.log(`✅ HTML report generated: ${outputFile}`);

