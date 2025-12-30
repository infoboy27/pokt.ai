# Run Load Test Against pokt.ai Gateway Endpoint

## Quick Start

### Test Specific Endpoint

```bash
# Test ETH endpoint
ENDPOINT_ID=ethpath_1764014188689_1764014188693 \
TARGET_RPS=2000 \
TOTAL_REQUESTS=1000000 \
k6 run load-test-path-1m-5krps.js
```

### Test BSC Endpoint

```bash
# Test BSC endpoint
ENDPOINT_ID=bnb_smart_chain_1764015972515_1764015972520 \
TARGET_RPS=2000 \
TOTAL_REQUESTS=1000000 \
k6 run load-test-path-1m-5krps.js
```

## Configuration Options

### Environment Variables

- **`ENDPOINT_ID`**: Endpoint ID to test (default: `ethpath_1764014188689_1764014188693`)
- **`POKT_AI_GATEWAY_URL`**: pokt.ai gateway URL (default: `https://pokt.ai/api/gateway`)
- **`TARGET_RPS`**: Target requests per second (default: `5000`)
- **`TOTAL_REQUESTS`**: Total number of requests (default: `1000000`)
- **`USE_POKT_AI_GATEWAY`**: Use pokt.ai gateway (default: `true`, set to `false` to test PATH gateway directly)

### Examples

#### Example 1: Test ETH Endpoint at 2K RPS

```bash
ENDPOINT_ID=ethpath_1764014188689_1764014188693 \
TARGET_RPS=2000 \
TOTAL_REQUESTS=1000000 \
k6 run load-test-path-1m-5krps.js
```

#### Example 2: Test BSC Endpoint at 5K RPS

```bash
ENDPOINT_ID=bnb_smart_chain_1764015972515_1764015972520 \
TARGET_RPS=5000 \
TOTAL_REQUESTS=1000000 \
k6 run load-test-path-1m-5krps.js
```

#### Example 3: Quick Test (10K requests at 1K RPS)

```bash
ENDPOINT_ID=ethpath_1764014188689_1764014188693 \
TARGET_RPS=1000 \
TOTAL_REQUESTS=10000 \
k6 run load-test-path-1m-5krps.js
```

## How It Works

### When Using pokt.ai Gateway (Default)

1. **Request URL**: `https://pokt.ai/api/gateway?endpoint={ENDPOINT_ID}`
2. **Headers**: Only `Content-Type: application/json`
3. **Routing**: pokt.ai gateway handles:
   - Chain detection from endpoint configuration
   - PATH gateway routing
   - App address selection (per-chain defaults)
   - Service ID mapping

### When Using PATH Gateway Directly

Set `USE_POKT_AI_GATEWAY=false`:

```bash
USE_POKT_AI_GATEWAY=false \
PATH_GATEWAY_URL=http://localhost:3069/v1 \
TARGET_RPS=2000 \
TOTAL_REQUESTS=1000000 \
k6 run load-test-path-1m-5krps.js
```

This will:
- Use PATH gateway directly
- Send `Target-Service-Id` and `App-Address` headers
- Test multiple chains with weighted distribution

## Test Your Endpoint

### Test ETH Endpoint

```bash
ENDPOINT_ID=ethpath_1764014188689_1764014188693 \
TARGET_RPS=2000 \
TOTAL_REQUESTS=1000000 \
k6 run load-test-path-1m-5krps.js
```

**Expected Behavior:**
- All requests go to: `https://pokt.ai/api/gateway?endpoint=ethpath_1764014188689_1764014188693`
- pokt.ai gateway routes through PATH gateway
- Uses `ETH_APP_ADDRESS` = `pokt1q89a5tyhaq5xh49ec5n2wqn5zhynw6fmve06sv`
- Returns Ethereum blockchain data

### Test BSC Endpoint

```bash
ENDPOINT_ID=bnb_smart_chain_1764015972515_1764015972520 \
TARGET_RPS=2000 \
TOTAL_REQUESTS=1000000 \
k6 run load-test-path-1m-5krps.js
```

**Expected Behavior:**
- All requests go to: `https://pokt.ai/api/gateway?endpoint=bnb_smart_chain_1764015972515_1764015972520`
- pokt.ai gateway routes through PATH gateway
- Uses `BSC_APP_ADDRESS` = `pokt17uus8phtheqhz9dv5dlcmv0y7s95d3fn59xg5w`
- Returns BSC blockchain data

## Output

After the test completes, you'll find:

1. **HTML Report**: `load-test-results/path-1m-5krps-*.html`
2. **JSON Summary**: `load-test-results/path-1m-5krps-*.json`
3. **Console Output**: Real-time metrics

## View Results

```bash
# Find latest HTML report
LATEST_REPORT=$(ls -t load-test-results/path-1m-5krps-*.html | head -1)

# Open in browser
xdg-open "$LATEST_REPORT"  # Linux
# or
open "$LATEST_REPORT"      # macOS
```

## Summary

✅ **Updated**: Script now supports testing pokt.ai gateway endpoints
✅ **Default**: Uses pokt.ai gateway (set `USE_POKT_AI_GATEWAY=false` for PATH gateway direct)
✅ **Flexible**: Can test any endpoint by setting `ENDPOINT_ID`
✅ **Multi-chain**: Still supports multi-chain testing when using PATH gateway directly

The script is ready to test your endpoints! 🚀

