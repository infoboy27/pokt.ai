#!/usr/bin/env node
// Generate pokt.ai Branded Report from k6 JSON Output
// This script reads k6 JSON output and generates a beautiful HTML report

const fs = require('fs');
const path = require('path');

// Get command line arguments
const jsonFile = process.argv[2];
const outputFile = process.argv[3] || 'report.html';
const testName = process.argv[4] || 'Load Test';
const testDescription = process.argv[5] || '10M ETH Requests at 5K RPS';

if (!jsonFile || !fs.existsSync(jsonFile)) {
    console.error('Usage: node generate-report-from-json.js <k6-json-file> [output-file] [test-name] [description]');
    process.exit(1);
}

// Read and parse JSON
let data;
try {
    const jsonContent = fs.readFileSync(jsonFile, 'utf8');
    data = JSON.parse(jsonContent);
} catch (error) {
    console.error('Error reading JSON file:', error);
    process.exit(1);
}

// Extract metrics from k6 JSON format
const metrics = data.metrics || {};
const rootGroup = data.root_group || {};

// Helper to get metric value
const getMetric = (name, prop = 'values') => {
    const metric = metrics[name];
    if (!metric) return null;
    if (prop === 'values' && metric.values) {
        return metric.values;
    }
    return metric[prop] || null;
};

// Extract key metrics
const httpReqDuration = getMetric('http_req_duration');
const httpReqs = getMetric('http_reqs');
const httpReqFailed = getMetric('http_req_failed');
const cacheHit = getMetric('cache_hit');
const vus = getMetric('vus');
const dataSent = getMetric('data_sent');
const dataReceived = getMetric('data_received');
const iterationDuration = getMetric('iteration_duration');

// Calculate values
const totalRequests = httpReqs?.count || 0;
const errorRate = (httpReqFailed?.rate || 0) * 100;
const successfulRequests = totalRequests * (1 - httpReqFailed?.rate || 0);
const failedRequests = totalRequests * (errorRate / 100);
const cacheHitRate = cacheHit ? (cacheHit.rate || 0) * 100 : 0;
const maxVUs = vus?.max || 0;

// Response time metrics
const avgResponseTime = httpReqDuration?.avg || 0;
const minResponseTime = httpReqDuration?.min || 0;
const medResponseTime = httpReqDuration?.med || 0;
const maxResponseTime = httpReqDuration?.max || 0;
const p90ResponseTime = httpReqDuration?.['p(90)'] || 0;
const p95ResponseTime = httpReqDuration?.['p(95)'] || 0;
const p99ResponseTime = httpReqDuration?.['p(99)'] || 0;

// Format time
const formatTime = (ms) => {
    if (ms < 1) return `${(ms * 1000).toFixed(2)}µs`;
    if (ms < 1000) return `${ms.toFixed(2)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
};

// Format bytes
const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

// Get test duration from timestamps
const testStart = data.root_group?.checks?.[0]?.first_ts || 0;
const testEnd = data.root_group?.checks?.[0]?.last_ts || 0;
const testDuration = testEnd - testStart;
const testDurationSeconds = Math.floor(testDuration / 1000000); // Convert from microseconds
const testDurationMinutes = Math.floor(testDurationSeconds / 60);

// Generate HTML report
const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${testName} - pokt.ai Gateway</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
            line-height: 1.6;
            padding: 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            font-weight: 700;
        }
        
        .header .logo {
            font-size: 3em;
            margin-bottom: 20px;
        }
        
        .header .subtitle {
            font-size: 1.2em;
            opacity: 0.9;
        }
        
        .content {
            padding: 40px;
        }
        
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        
        .metric-card {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            border-left: 4px solid #667eea;
            transition: transform 0.2s;
        }
        
        .metric-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        .metric-card .value {
            font-size: 2.5em;
            font-weight: 700;
            color: #667eea;
            margin-bottom: 10px;
        }
        
        .metric-card .label {
            font-size: 0.9em;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .metric-card.success .value {
            color: #28a745;
        }
        
        .metric-card.warning .value {
            color: #ffc107;
        }
        
        .metric-card.error .value {
            color: #dc3545;
        }
        
        .section {
            margin-bottom: 40px;
        }
        
        .section h2 {
            font-size: 1.8em;
            margin-bottom: 20px;
            color: #333;
            border-bottom: 3px solid #667eea;
            padding-bottom: 10px;
        }
        
        .metrics-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        
        .metrics-table th,
        .metrics-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        
        .metrics-table th {
            background: #f8f9fa;
            font-weight: 600;
            color: #333;
        }
        
        .metrics-table tr:hover {
            background: #f8f9fa;
        }
        
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.85em;
            font-weight: 600;
        }
        
        .status-badge.success {
            background: #d4edda;
            color: #155724;
        }
        
        .status-badge.warning {
            background: #fff3cd;
            color: #856404;
        }
        
        .status-badge.error {
            background: #f8d7da;
            color: #721c24;
        }
        
        .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #666;
            font-size: 0.9em;
        }
        
        .progress-bar {
            width: 100%;
            height: 30px;
            background: #e9ecef;
            border-radius: 15px;
            overflow: hidden;
            margin: 10px 0;
        }
        
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
            transition: width 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">⚡</div>
            <h1>${testName}</h1>
            <div class="subtitle">${testDescription}</div>
            <div style="margin-top: 20px; font-size: 0.9em; opacity: 0.8;">
                Generated: ${new Date().toLocaleString()}
            </div>
        </div>
        
        <div class="content">
            <div class="summary">
                <div class="metric-card success">
                    <div class="value">${totalRequests.toLocaleString()}</div>
                    <div class="label">Total Requests</div>
                </div>
                
                <div class="metric-card ${successfulRequests / totalRequests > 0.95 ? 'success' : successfulRequests / totalRequests > 0.8 ? 'warning' : 'error'}">
                    <div class="value">${successfulRequests.toLocaleString()}</div>
                    <div class="label">Successful Requests</div>
                </div>
                
                <div class="metric-card ${errorRate < 1 ? 'success' : errorRate < 5 ? 'warning' : 'error'}">
                    <div class="value">${errorRate.toFixed(2)}%</div>
                    <div class="label">Error Rate</div>
                </div>
                
                <div class="metric-card ${avgResponseTime < 500 ? 'success' : avgResponseTime < 2000 ? 'warning' : 'error'}">
                    <div class="value">${formatTime(avgResponseTime)}</div>
                    <div class="label">Avg Response Time</div>
                </div>
                
                <div class="metric-card ${cacheHitRate > 30 ? 'success' : 'warning'}">
                    <div class="value">${cacheHitRate.toFixed(1)}%</div>
                    <div class="label">Cache Hit Rate</div>
                </div>
                
                <div class="metric-card">
                    <div class="value">${maxVUs.toLocaleString()}</div>
                    <div class="label">Max Virtual Users</div>
                </div>
            </div>
            
            <div class="section">
                <h2>📊 Response Time Metrics</h2>
                <table class="metrics-table">
                    <thead>
                        <tr>
                            <th>Metric</th>
                            <th>Value</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Average</td>
                            <td><strong>${formatTime(avgResponseTime)}</strong></td>
                            <td><span class="status-badge ${avgResponseTime < 500 ? 'success' : avgResponseTime < 2000 ? 'warning' : 'error'}">${avgResponseTime < 500 ? 'Excellent' : avgResponseTime < 2000 ? 'Good' : 'Needs Improvement'}</span></td>
                        </tr>
                        <tr>
                            <td>Median (P50)</td>
                            <td><strong>${formatTime(medResponseTime)}</strong></td>
                            <td>-</td>
                        </tr>
                        <tr>
                            <td>Minimum</td>
                            <td><strong>${formatTime(minResponseTime)}</strong></td>
                            <td>-</td>
                        </tr>
                        <tr>
                            <td>Maximum</td>
                            <td><strong>${formatTime(maxResponseTime)}</strong></td>
                            <td>-</td>
                        </tr>
                        <tr>
                            <td>P90</td>
                            <td><strong>${formatTime(p90ResponseTime)}</strong></td>
                            <td><span class="status-badge ${p90ResponseTime < 1000 ? 'success' : p90ResponseTime < 3000 ? 'warning' : 'error'}">${p90ResponseTime < 1000 ? 'Good' : p90ResponseTime < 3000 ? 'Acceptable' : 'Slow'}</span></td>
                        </tr>
                        <tr>
                            <td>P95</td>
                            <td><strong>${formatTime(p95ResponseTime)}</strong></td>
                            <td><span class="status-badge ${p95ResponseTime < 2000 ? 'success' : p95ResponseTime < 5000 ? 'warning' : 'error'}">${p95ResponseTime < 2000 ? 'Good' : p95ResponseTime < 5000 ? 'Acceptable' : 'Slow'}</span></td>
                        </tr>
                        <tr>
                            <td>P99</td>
                            <td><strong>${formatTime(p99ResponseTime)}</strong></td>
                            <td><span class="status-badge ${p99ResponseTime < 5000 ? 'success' : 'warning'}">${p99ResponseTime < 5000 ? 'Good' : 'Acceptable'}</span></td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <div class="section">
                <h2>📈 Test Statistics</h2>
                <table class="metrics-table">
                    <thead>
                        <tr>
                            <th>Metric</th>
                            <th>Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Total Requests</td>
                            <td><strong>${totalRequests.toLocaleString()}</strong></td>
                        </tr>
                        <tr>
                            <td>Successful Requests</td>
                            <td><strong>${successfulRequests.toLocaleString()}</strong> (${((successfulRequests / totalRequests) * 100).toFixed(2)}%)</td>
                        </tr>
                        <tr>
                            <td>Failed Requests</td>
                            <td><strong>${failedRequests.toLocaleString()}</strong> (${errorRate.toFixed(2)}%)</td>
                        </tr>
                        <tr>
                            <td>Cache Hit Rate</td>
                            <td><strong>${cacheHitRate.toFixed(2)}%</strong></td>
                        </tr>
                        <tr>
                            <td>Max Virtual Users</td>
                            <td><strong>${maxVUs.toLocaleString()}</strong></td>
                        </tr>
                        <tr>
                            <td>Test Duration</td>
                            <td><strong>${testDurationMinutes} minutes ${testDurationSeconds % 60} seconds</strong></td>
                        </tr>
                        <tr>
                            <td>Data Sent</td>
                            <td><strong>${formatBytes(dataSent?.count || 0)}</strong></td>
                        </tr>
                        <tr>
                            <td>Data Received</td>
                            <td><strong>${formatBytes(dataReceived?.count || 0)}</strong></td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <div class="section">
                <h2>✅ Success Rate</h2>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${(successfulRequests / totalRequests) * 100}%">
                        ${((successfulRequests / totalRequests) * 100).toFixed(2)}%
                    </div>
                </div>
            </div>
            
            <div class="section">
                <h2>⚡ Performance Summary</h2>
                <p style="font-size: 1.1em; line-height: 1.8;">
                    The load test processed <strong>${totalRequests.toLocaleString()}</strong> requests over <strong>${testDurationMinutes} minutes</strong> 
                    with an average response time of <strong>${formatTime(avgResponseTime)}</strong>. 
                    ${errorRate < 1 ? 'The error rate was excellent' : errorRate < 5 ? 'The error rate was acceptable' : 'The error rate needs improvement'} 
                    at <strong>${errorRate.toFixed(2)}%</strong>.
                    ${cacheHitRate > 30 ? `Cache performance was good with a ${cacheHitRate.toFixed(1)}% hit rate.` : ''}
                </p>
            </div>
        </div>
        
        <div class="footer">
            <p>Generated by pokt.ai Load Testing Suite</p>
            <p style="margin-top: 10px; font-size: 0.85em;">Report generated at ${new Date().toLocaleString()}</p>
        </div>
    </div>
</body>
</html>`;

// Write HTML file
try {
    fs.writeFileSync(outputFile, html);
    console.log(`✅ Report generated successfully: ${outputFile}`);
} catch (error) {
    console.error('Error writing report:', error);
    process.exit(1);
}

