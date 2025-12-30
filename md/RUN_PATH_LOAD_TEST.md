# How to Run PATH Gateway Load Test

## Quick Start

### Option 1: Simple Command (Recommended)

```bash
# Run with default settings (1M requests @ 5K RPS)
k6 run load-test-path-1m-5krps.js
```

This will:
- ✅ Run 1,000,000 requests at 5,000 RPS
- ✅ Test across 4 chains (ETH, BSC, Kava, text-to-text)
- ✅ Generate HTML report automatically with pokt.ai branding
- ✅ Save results to `load-test-results/` directory

### Option 2: Using Helper Script

```bash
# Make script executable (first time only)
chmod +x run-path-load-test.sh

# Run the test
./run-path-load-test.sh
```

## Custom Configuration

### Custom RPS and Total Requests

```bash
# Run with custom RPS and total requests
TARGET_RPS=3000 TOTAL_REQUESTS=500000 k6 run load-test-path-1m-5krps.js
```

### Custom Gateway URL

```bash
# Test against a different gateway
PATH_GATEWAY_URL=http://localhost:3069/v1 k6 run load-test-path-1m-5krps.js
```

### Quick Test (Smaller Load)

```bash
# Quick test: 1,000 requests at 100 RPS (~10 seconds)
TARGET_RPS=100 TOTAL_REQUESTS=1000 k6 run load-test-path-1m-5krps.js
```

## Test Configuration

**Default Settings:**
- **Total Requests**: 1,000,000
- **Target RPS**: 5,000 requests/second
- **Duration**: ~200 seconds (~3.3 minutes)
- **Gateway URL**: `http://localhost:3069/v1`

**Chain Distribution:**
- Ethereum (eth): 40% of traffic
- BSC (bsc): 30% of traffic
- Kava (kava): 20% of traffic
- text-to-text: 10% of traffic

**App Addresses:**
- ETH: `pokt1q89a5tyhaq5xh49ec5n2wqn5zhynw6fmve06sv`
- BSC: `pokt17uus8phtheqhz9dv5dlcmv0y7s95d3fn59xg5w`
- Kava: `pokt1u4lvv3z5yla272vdqv7grp37ltaz7rmkzdkksp`
- text-to-text: `pokt14ng2mx2uux8cg8yr0dfp3kkna9apntkg6mtxpw`

## Output Files

After running the test, you'll find:

1. **HTML Report** (with pokt.ai branding):
   ```
   load-test-results/path-1m-5krps-YYYY-MM-DDTHH-MM-SS-sssZ.html
   ```

2. **JSON Summary**:
   ```
   load-test-results/path-1m-5krps-YYYY-MM-DDTHH-MM-SS-sssZ.json
   ```

3. **Console Output**: Real-time metrics displayed in terminal

## Viewing Results

### Open HTML Report

```bash
# Find the latest HTML report
LATEST_REPORT=$(ls -t load-test-results/path-1m-5krps-*.html | head -1)

# Open in browser
xdg-open "$LATEST_REPORT"  # Linux
# or
open "$LATEST_REPORT"      # macOS
```

### Serve HTML Report via HTTP

```bash
# Start a simple HTTP server
cd load-test-results
python3 -m http.server 8000

# Then open: http://localhost:8000/path-1m-5krps-*.html
```

## Prerequisites

1. **k6 installed** (already installed at `/home/shannon/.local/bin/k6`)
   ```bash
   k6 version  # Verify installation
   ```

2. **PATH Gateway running** on port 3069
   ```bash
   # Check if gateway is running
   curl -s http://localhost:3069/v1 \
     -H "Content-Type: application/json" \
     -H "Target-Service-Id: eth" \
     -H "App-Address: pokt1q89a5tyhaq5xh49ec5n2wqn5zhynw6fmve06sv" \
     -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
   ```

3. **Results directory** (created automatically)
   ```bash
   mkdir -p load-test-results
   ```

## Example Commands

### Full Load Test (1M @ 5K RPS)
```bash
k6 run load-test-path-1m-5krps.js
```

### Quick Test (10K @ 1K RPS)
```bash
TARGET_RPS=1000 TOTAL_REQUESTS=10000 k6 run load-test-path-1m-5krps.js
```

### Stress Test (5M @ 10K RPS)
```bash
TARGET_RPS=10000 TOTAL_REQUESTS=5000000 k6 run load-test-path-1m-5krps.js
```

### Test Specific Gateway
```bash
PATH_GATEWAY_URL=http://192.168.1.100:3069/v1 k6 run load-test-path-1m-5krps.js
```

## Troubleshooting

### Gateway Not Accessible
```bash
# Check if gateway is running
docker ps | grep gateway

# Test connectivity
curl -v http://localhost:3069/v1
```

### k6 Not Found
```bash
# Add to PATH
export PATH="$HOME/.local/bin:$PATH"

# Or install k6
curl https://github.com/grafana/k6/releases/download/v0.47.0/k6-v0.47.0-linux-amd64.tar.gz -L | tar xvz
mv k6-v0.47.0-linux-amd64/k6 ~/.local/bin/
```

### Out of Memory
If you encounter memory issues with large tests, reduce the load:
```bash
# Lower RPS and total requests
TARGET_RPS=2000 TOTAL_REQUESTS=500000 k6 run load-test-path-1m-5krps.js
```

## HTML Report Features

The generated HTML report includes:

- ✅ **pokt.ai Branding**: Beautiful header with pokt.ai logo and colors
- ✅ **Summary Metrics**: Success rate, total requests, response times, error rate
- ✅ **Chain Distribution**: Table showing requests per chain
- ✅ **Performance Metrics**: Average, P95, P99 response times with status badges
- ✅ **Test Configuration**: Gateway URL, RPS, duration, etc.
- ✅ **Responsive Design**: Works on desktop and mobile

## Next Steps

After running the test:

1. Review the HTML report for detailed metrics
2. Check console output for real-time results
3. Analyze chain distribution to verify load balancing
4. Monitor error rates and response times
5. Compare results across different test runs

