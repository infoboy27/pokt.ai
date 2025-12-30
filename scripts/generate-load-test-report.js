#!/usr/bin/env node
// Generate Load Test HTML Report with pokt.ai Branding
// This script generates a beautiful HTML report from k6 JSON results

const fs = require('fs');
const path = require('path');

// Get command line arguments
const resultsFile = process.argv[2];
const summaryFile = process.argv[3];
const outputFile = process.argv[4];
const gatewayUrl = process.argv[5] || 'http://localhost:4000';
const endpointId = process.argv[6] || 'unknown';
const testDuration = process.argv[7] || '60';
const targetRps = process.argv[8] || '5000';

// Parse k6 summary output from text file
let metrics = {};

// First, try to parse the summary text file (k6's stdout)
if (summaryFile && fs.existsSync(summaryFile)) {
    try {
        const summaryText = fs.readFileSync(summaryFile, 'utf8');
        
        // Parse k6 summary output format
        // Example: http_req_duration...........: avg=123.45ms min=12.34ms med=98.76ms max=567.89ms p(90)=234.56ms p(95)=345.67ms p(99)=456.78ms
        
        // Parse http_req_duration
        const httpReqDurationMatch = summaryText.match(/http_req_duration[^:]*:\s*avg=([\d.]+)(\w+)\s+min=([\d.]+)(\w+)\s+med=([\d.]+)(\w+)\s+max=([\d.]+)(\w+)\s+p\(90\)=([\d.]+)(\w+)\s+p\(95\)=([\d.]+)(\w+)\s+p\(99\)=([\d.]+)(\w+)/);
        if (httpReqDurationMatch) {
            const convertToMs = (val, unit) => {
                if (unit === 'ms') return parseFloat(val);
                if (unit === 's') return parseFloat(val) * 1000;
                return parseFloat(val);
            };
            
            metrics['http_req_duration'] = {
                avg: convertToMs(httpReqDurationMatch[1], httpReqDurationMatch[2]),
                min: convertToMs(httpReqDurationMatch[3], httpReqDurationMatch[4]),
                med: convertToMs(httpReqDurationMatch[5], httpReqDurationMatch[6]),
                max: convertToMs(httpReqDurationMatch[7], httpReqDurationMatch[8]),
                p90: convertToMs(httpReqDurationMatch[9], httpReqDurationMatch[10]),
                p95: convertToMs(httpReqDurationMatch[11], httpReqDurationMatch[12]),
                p99: convertToMs(httpReqDurationMatch[13], httpReqDurationMatch[14])
            };
        }
        
        // Parse http_reqs (total requests)
        const httpReqsMatch = summaryText.match(/http_reqs[^:]*:\s*(\d+)/);
        if (httpReqsMatch) {
            metrics['http_reqs'] = {
                count: parseInt(httpReqsMatch[1])
            };
        }
        
        // Parse http_req_failed (error rate)
        const httpReqFailedMatch = summaryText.match(/http_req_failed[^:]*:\s*([\d.]+)%/);
        if (httpReqFailedMatch) {
            metrics['http_req_failed'] = {
                rate: parseFloat(httpReqFailedMatch[1]) / 100
            };
        }
        
        // Parse cache_hit (if available in custom metrics)
        const cacheHitMatch = summaryText.match(/cache_hit[^:]*:\s*([\d.]+)%/);
        if (cacheHitMatch) {
            metrics['cache_hit'] = {
                rate: parseFloat(cacheHitMatch[1]) / 100
            };
        }
        
        // Parse iteration_duration if available
        const iterationDurationMatch = summaryText.match(/iteration_duration[^:]*:\s*avg=([\d.]+)(\w+)/);
        if (iterationDurationMatch) {
            const convertToMs = (val, unit) => {
                if (unit === 'ms') return parseFloat(val);
                if (unit === 's') return parseFloat(val) * 1000;
                return parseFloat(val);
            };
            metrics['iteration_duration'] = {
                avg: convertToMs(iterationDurationMatch[1], iterationDurationMatch[2])
            };
        }
    } catch (error) {
        console.error('Error parsing summary file:', error);
    }
}

// Also try to parse JSON results file
if (resultsFile && fs.existsSync(resultsFile)) {
    try {
        const resultsData = fs.readFileSync(resultsFile, 'utf8');
        const lines = resultsData.trim().split('\n').filter(line => line.trim());
        
        // Parse JSON lines
        lines.forEach(line => {
            try {
                const data = JSON.parse(line);
                
                // Parse metric data from JSON
                if (data.type === 'Metric' && data.data) {
                    if (!metrics[data.data.name]) {
                        metrics[data.data.name] = {};
                    }
                    Object.assign(metrics[data.data.name], data.data);
                } else if (data.type === 'Point' && data.data) {
                    const metricName = data.data.metric;
                    if (!metrics[metricName]) {
                        metrics[metricName] = { values: [] };
                    }
                    if (data.data.value !== undefined) {
                        if (!metrics[metricName].values) {
                            metrics[metricName].values = [];
                        }
                        metrics[metricName].values.push(data.data.value);
                    }
                } else if (data.metrics) {
                    // Summary format with metrics object
                    Object.keys(data.metrics).forEach(key => {
                        const metric = data.metrics[key];
                        if (metric.values) {
                            metrics[key] = {
                                avg: metric.values.avg,
                                min: metric.values.min,
                                max: metric.values.max,
                                med: metric.values.med,
                                p90: metric.values['p(90)'],
                                p95: metric.values['p(95)'],
                                p99: metric.values['p(99)'],
                                count: metric.values.count || 0
                            };
                        }
                    });
                }
            } catch (e) {
                // Skip invalid JSON lines
            }
        });
    } catch (error) {
        console.error('Error reading JSON results file:', error);
    }
}

// Calculate statistics
function calculateStats(values) {
    if (!values || values.length === 0) return null;
    const sorted = [...values].sort((a, b) => a - b);
    return {
        min: sorted[0],
        max: sorted[sorted.length - 1],
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        p50: sorted[Math.floor(sorted.length * 0.50)],
        p95: sorted[Math.floor(sorted.length * 0.95)],
        p99: sorted[Math.floor(sorted.length * 0.99)],
        count: values.length
    };
}

// Extract metrics from parsed data
let httpReqDuration = null;
let errorRate = 0;
let cacheHit = 0;
let totalRequests = 0;

// Get http_req_duration metrics
if (metrics['http_req_duration']) {
    if (metrics['http_req_duration'].avg !== undefined) {
        // Already parsed from summary
        httpReqDuration = {
            avg: metrics['http_req_duration'].avg || 0,
            min: metrics['http_req_duration'].min || 0,
            max: metrics['http_req_duration'].max || 0,
            p50: metrics['http_req_duration'].med || metrics['http_req_duration'].p50 || 0,
            p95: metrics['http_req_duration'].p95 || 0,
            p99: metrics['http_req_duration'].p99 || 0,
            count: metrics['http_req_duration'].count || totalRequests || 0
        };
    } else if (metrics['http_req_duration'].values) {
        // Calculate from values array
        httpReqDuration = calculateStats(metrics['http_req_duration'].values);
    }
}

// Get error rate
if (metrics['http_req_failed']) {
    if (metrics['http_req_failed'].rate !== undefined) {
        errorRate = metrics['http_req_failed'].rate * 100;
    } else if (metrics['http_req_failed'].values) {
        const failedValues = metrics['http_req_failed'].values;
        errorRate = failedValues.length > 0 ? (failedValues.filter(v => v === 1).length / failedValues.length * 100) : 0;
    }
}

// Get cache hit rate
if (metrics['cache_hit']) {
    if (metrics['cache_hit'].rate !== undefined) {
        cacheHit = metrics['cache_hit'].rate * 100;
    } else if (metrics['cache_hit'].values) {
        const hitValues = metrics['cache_hit'].values;
        cacheHit = hitValues.length > 0 ? (hitValues.filter(v => v === 1).length / hitValues.length * 100) : 0;
    }
}

// Get total requests
if (metrics['http_reqs']) {
    totalRequests = metrics['http_reqs'].count || 0;
} else if (httpReqDuration && httpReqDuration.count) {
    totalRequests = httpReqDuration.count;
} else {
    // Fallback: estimate from target RPS and duration
    totalRequests = parseInt(targetRps) * parseInt(testDuration);
}

// Calculate successful and failed requests
const successfulRequests = totalRequests - (totalRequests * errorRate / 100);
const failedRequests = totalRequests * errorRate / 100;

// Generate HTML report
const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Load Test Report - pokt.ai Gateway</title>
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
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            background: linear-gradient(135deg, #00d4ff 0%, #5b8def 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .header .subtitle {
            font-size: 1.2em;
            opacity: 0.9;
            margin-top: 10px;
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
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 25px;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
            transition: transform 0.3s ease;
        }
        
        .metric-card:hover {
            transform: translateY(-5px);
        }
        
        .metric-card h3 {
            font-size: 0.9em;
            opacity: 0.9;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .metric-card .value {
            font-size: 2em;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .metric-card .label {
            font-size: 0.9em;
            opacity: 0.8;
        }
        
        .section {
            margin-bottom: 40px;
        }
        
        .section h2 {
            font-size: 1.8em;
            margin-bottom: 20px;
            color: #1a1a2e;
            border-bottom: 3px solid #667eea;
            padding-bottom: 10px;
        }
        
        .table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        
        .table th {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px;
            text-align: left;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .table td {
            padding: 15px;
            border-bottom: 1px solid #e0e0e0;
        }
        
        .table tr:hover {
            background: #f5f5f5;
        }
        
        .status-badge {
            display: inline-block;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 0.9em;
            font-weight: 600;
            text-transform: uppercase;
        }
        
        .status-success {
            background: #4caf50;
            color: white;
        }
        
        .status-warning {
            background: #ff9800;
            color: white;
        }
        
        .status-error {
            background: #f44336;
            color: white;
        }
        
        .footer {
            background: #1a1a2e;
            color: white;
            padding: 20px;
            text-align: center;
        }
        
        .footer a {
            color: #00d4ff;
            text-decoration: none;
        }
        
        .footer a:hover {
            text-decoration: underline;
        }
        
        .progress-bar {
            width: 100%;
            height: 30px;
            background: #e0e0e0;
            border-radius: 15px;
            overflow: hidden;
            margin-top: 10px;
        }
        
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #4caf50 0%, #8bc34a 100%);
            transition: width 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 600;
        }
        
        .config-info {
            background: #f5f5f5;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        
        .config-info h3 {
            margin-bottom: 15px;
            color: #1a1a2e;
        }
        
        .config-info .info-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #e0e0e0;
        }
        
        .config-info .info-row:last-child {
            border-bottom: none;
        }
        
        .config-info .info-label {
            font-weight: 600;
            color: #666;
        }
        
        .config-info .info-value {
            color: #1a1a2e;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⚡ pokt.ai Gateway</h1>
            <div class="subtitle">Load Test Report</div>
            <div class="subtitle" style="margin-top: 20px; font-size: 0.9em; opacity: 0.7;">
                ${new Date().toLocaleString()}
            </div>
        </div>
        
        <div class="content">
            <div class="config-info">
                <h3>Test Configuration</h3>
                <div class="info-row">
                    <span class="info-label">Gateway URL:</span>
                    <span class="info-value">${gatewayUrl}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Endpoint ID:</span>
                    <span class="info-value">${endpointId}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Target RPS:</span>
                    <span class="info-value">${targetRps} req/sec</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Test Duration:</span>
                    <span class="info-value">${testDuration} seconds (~${Math.ceil(testDuration / 60)} minutes)</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Total Relays:</span>
                    <span class="info-value">${(parseInt(targetRps) * parseInt(testDuration)).toLocaleString()}</span>
                </div>
            </div>
            
            <div class="summary">
                <div class="metric-card">
                    <h3>Total Requests</h3>
                    <div class="value">${totalRequests.toLocaleString()}</div>
                    <div class="label">Requests Processed</div>
                </div>
                
                <div class="metric-card">
                    <h3>Success Rate</h3>
                    <div class="value">${(100 - errorRate).toFixed(2)}%</div>
                    <div class="label">${successfulRequests.toLocaleString()} Successful</div>
                </div>
                
                <div class="metric-card">
                    <h3>Error Rate</h3>
                    <div class="value">${errorRate.toFixed(2)}%</div>
                    <div class="label">${failedRequests.toLocaleString()} Failed</div>
                </div>
                
                <div class="metric-card">
                    <h3>Cache Hit Rate</h3>
                    <div class="value">${cacheHit.toFixed(2)}%</div>
                    <div class="label">Cached Responses</div>
                </div>
            </div>
            
            ${httpReqDuration ? `
            <div class="section">
                <h2>Response Time Metrics</h2>
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
                            <td>${httpReqDuration.avg.toFixed(2)} ms</td>
                            <td><span class="status-badge ${httpReqDuration.avg < 500 ? 'status-success' : httpReqDuration.avg < 1000 ? 'status-warning' : 'status-error'}">${httpReqDuration.avg < 500 ? 'Excellent' : httpReqDuration.avg < 1000 ? 'Good' : 'Needs Improvement'}</span></td>
                        </tr>
                        <tr>
                            <td>Minimum Response Time</td>
                            <td>${httpReqDuration.min.toFixed(2)} ms</td>
                            <td><span class="status-badge status-success">Optimal</span></td>
                        </tr>
                        <tr>
                            <td>Maximum Response Time</td>
                            <td>${httpReqDuration.max.toFixed(2)} ms</td>
                            <td><span class="status-badge ${httpReqDuration.max < 1000 ? 'status-success' : httpReqDuration.max < 5000 ? 'status-warning' : 'status-error'}">${httpReqDuration.max < 1000 ? 'Excellent' : httpReqDuration.max < 5000 ? 'Good' : 'Needs Improvement'}</span></td>
                        </tr>
                        <tr>
                            <td>P50 (Median) Response Time</td>
                            <td>${httpReqDuration.p50.toFixed(2)} ms</td>
                            <td><span class="status-badge ${httpReqDuration.p50 < 100 ? 'status-success' : httpReqDuration.p50 < 500 ? 'status-warning' : 'status-error'}">${httpReqDuration.p50 < 100 ? 'Excellent' : httpReqDuration.p50 < 500 ? 'Good' : 'Needs Improvement'}</span></td>
                        </tr>
                        <tr>
                            <td>P95 Response Time</td>
                            <td>${httpReqDuration.p95.toFixed(2)} ms</td>
                            <td><span class="status-badge ${httpReqDuration.p95 < 500 ? 'status-success' : httpReqDuration.p95 < 1000 ? 'status-warning' : 'status-error'}">${httpReqDuration.p95 < 500 ? 'Excellent' : httpReqDuration.p95 < 1000 ? 'Good' : 'Needs Improvement'}</span></td>
                        </tr>
                        <tr>
                            <td>P99 Response Time</td>
                            <td>${httpReqDuration.p99.toFixed(2)} ms</td>
                            <td><span class="status-badge ${httpReqDuration.p99 < 1000 ? 'status-success' : httpReqDuration.p99 < 5000 ? 'status-warning' : 'status-error'}">${httpReqDuration.p99 < 1000 ? 'Excellent' : httpReqDuration.p99 < 5000 ? 'Good' : 'Needs Improvement'}</span></td>
                        </tr>
                    </tbody>
                </table>
            </div>
            ` : ''}
            
            <div class="section">
                <h2>Success Criteria</h2>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Criteria</th>
                            <th>Target</th>
                            <th>Actual</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Error Rate</td>
                            <td>&lt; 1%</td>
                            <td>${errorRate.toFixed(2)}%</td>
                            <td><span class="status-badge ${errorRate < 1 ? 'status-success' : 'status-error'}">${errorRate < 1 ? '✅ Pass' : '❌ Fail'}</span></td>
                        </tr>
                        <tr>
                            <td>P95 Response Time</td>
                            <td>&lt; 500ms</td>
                            <td>${httpReqDuration ? httpReqDuration.p95.toFixed(2) + ' ms' : 'N/A'}</td>
                            <td><span class="status-badge ${httpReqDuration && httpReqDuration.p95 < 500 ? 'status-success' : 'status-error'}">${httpReqDuration && httpReqDuration.p95 < 500 ? '✅ Pass' : '❌ Fail'}</span></td>
                        </tr>
                        <tr>
                            <td>P99 Response Time</td>
                            <td>&lt; 1s</td>
                            <td>${httpReqDuration ? httpReqDuration.p99.toFixed(2) + ' ms' : 'N/A'}</td>
                            <td><span class="status-badge ${httpReqDuration && httpReqDuration.p99 < 1000 ? 'status-success' : 'status-error'}">${httpReqDuration && httpReqDuration.p99 < 1000 ? '✅ Pass' : '❌ Fail'}</span></td>
                        </tr>
                        <tr>
                            <td>Cache Hit Rate</td>
                            <td>&gt; 30%</td>
                            <td>${cacheHit.toFixed(2)}%</td>
                            <td><span class="status-badge ${cacheHit > 30 ? 'status-success' : 'status-warning'}">${cacheHit > 30 ? '✅ Pass' : '⚠️ Warning'}</span></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
        
        <div class="footer">
            <p>Generated by <a href="https://pokt.ai">pokt.ai</a> Gateway Load Test</p>
            <p style="margin-top: 10px; opacity: 0.7; font-size: 0.9em;">
                Report generated on ${new Date().toLocaleString()}
            </p>
        </div>
    </div>
</body>
</html>`;

// Write HTML report
try {
    fs.writeFileSync(outputFile, html, 'utf8');
    console.log('HTML report generated successfully!');
    process.exit(0);
} catch (error) {
    console.error('Error writing HTML report:', error);
    process.exit(1);
}

