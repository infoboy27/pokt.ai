# How to Run Load Test Against pokt.ai Gateway Endpoint

## ✅ Script Updated!

The load test script has been updated to support testing pokt.ai gateway endpoints.

## Quick Start

### Test Your ETH Endpoint

```bash
ENDPOINT_ID=ethpath_1764014188689_1764014188693 \
TARGET_RPS=2000 \
TOTAL_REQUESTS=1000000 \
k6 run load-test-path-1m-5krps.js
```

### Test Your BSC Endpoint

```bash
ENDPOINT_ID=bnb_smart_chain_1764015972515_1764015972520 \
TARGET_RPS=2000 \
TOTAL_REQUESTS=1000000 \
k6 run load-test-path-1m-5krps.js
```

### Using Helper Script

```bash
# Test default endpoint (ETH)
./run-load-test-pokt-ai.sh

# Test specific endpoint
./run-load-test-pokt-ai.sh ethpath_1764014188689_1764014188693
```

## What Changed

✅ **Updated**: Script now tests pokt.ai gateway endpoints by default
✅ **URL**: Uses `https://pokt.ai/api/gateway?endpoint={ENDPOINT_ID}`
✅ **Headers**: No PATH gateway headers needed (pokt.ai handles routing)
✅ **Flexible**: Can test any endpoint by setting `ENDPOINT_ID`

## Configuration Options

### Environment Variables

- **`ENDPOINT_ID`**: Endpoint ID to test (required)
  - Example: `ethpath_1764014188689_1764014188693`
  - Example: `bnb_smart_chain_1764015972515_1764015972520`

- **`TARGET_RPS`**: Target requests per second
  - Default: `5000`
  - Your example: `2000`

- **`TOTAL_REQUESTS`**: Total number of requests
  - Default: `1000000`
  - Your example: `1000000`

- **`POKT_AI_GATEWAY_URL`**: pokt.ai gateway URL (optional)
  - Default: `https://pokt.ai/api/gateway`

- **`USE_POKT_AI_GATEWAY`**: Use pokt.ai gateway (optional)
  - Default: `true`
  - Set to `false` to test PATH gateway directly

## Example Commands

### Full Load Test (Your Request)

```bash
ENDPOINT_ID=ethpath_1764014188689_1764014188693 \
TARGET_RPS=2000 \
TOTAL_REQUESTS=1000000 \
k6 run load-test-path-1m-5krps.js
```

**What this does:**
- Sends 1,000,000 requests to `https://pokt.ai/api/gateway?endpoint=ethpath_1764014188689_1764014188693`
- Targets 2,000 requests per second
- Duration: ~500 seconds (~8.3 minutes)
- Generates HTML report with pokt.ai branding

### Quick Test (10K requests)

```bash
ENDPOINT_ID=ethpath_1764014188689_1764014188693 \
TARGET_RPS=1000 \
TOTAL_REQUESTS=10000 \
k6 run load-test-path-1m-5krps.js
```

### Test BSC Endpoint

```bash
ENDPOINT_ID=bnb_smart_chain_1764015972515_1764015972520 \
TARGET_RPS=2000 \
TOTAL_REQUESTS=1000000 \
k6 run load-test-path-1m-5krps.js
```

## How It Works

### When Testing pokt.ai Gateway (Default)

1. **Request URL**: `https://pokt.ai/api/gateway?endpoint={ENDPOINT_ID}`
2. **Headers**: Only `Content-Type: application/json`
3. **pokt.ai Gateway**:
   - Detects chain from endpoint configuration
   - Routes through PATH gateway
   - Uses correct app address (per-chain default)
   - Returns blockchain data

### When Testing PATH Gateway Directly

Set `USE_POKT_AI_GATEWAY=false`:

```bash
USE_POKT_AI_GATEWAY=false \
PATH_GATEWAY_URL=http://localhost:3069/v1 \
TARGET_RPS=2000 \
TOTAL_REQUESTS=1000000 \
k6 run load-test-path-1m-5krps.js
```

This will:
- Test PATH gateway directly
- Send `Target-Service-Id` and `App-Address` headers
- Test multiple chains with weighted distribution

## Output

After completion:

1. **HTML Report**: `load-test-results/path-1m-5krps-*.html`
   - Beautiful pokt.ai branded report
   - Performance metrics
   - Chain distribution
   - Response time analysis

2. **JSON Summary**: `load-test-results/path-1m-5krps-*.json`
   - Raw metrics data
   - Test configuration

3. **Console Output**: Real-time metrics during test

## View Results

```bash
# Find latest HTML report
LATEST_REPORT=$(ls -t load-test-results/path-1m-5krps-*.html | head -1)

# Open in browser
xdg-open "$LATEST_REPORT"  # Linux
open "$LATEST_REPORT"      # macOS
```

## Test Verification

✅ **Quick test completed**: 10 requests successful
✅ **Endpoint accessible**: `ethpath_1764014188689_1764014188693` working
✅ **Script updated**: Ready to test pokt.ai gateway endpoints

## Summary

**Your Command:**
```bash
ENDPOINT_ID=ethpath_1764014188689_1764014188693 \
TARGET_RPS=2000 \
TOTAL_REQUESTS=1000000 \
k6 run load-test-path-1m-5krps.js
```

**What it does:**
- ✅ Tests your ETH endpoint through pokt.ai gateway
- ✅ Sends 1M requests at 2K RPS
- ✅ Generates HTML report
- ✅ Shows performance metrics

Ready to run! 🚀

