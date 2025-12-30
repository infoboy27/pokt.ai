# Quick Load Test Guide

## Test Your Endpoint

### Simple Command

```bash
# Test ETH endpoint at 2K RPS, 1M requests
ENDPOINT_ID=ethpath_1764014188689_1764014188693 \
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

# Test BSC endpoint
./run-load-test-pokt-ai.sh bnb_smart_chain_1764015972515_1764015972520
```

## Configuration

The script now supports:

- **`ENDPOINT_ID`**: Endpoint to test (default: `ethpath_1764014188689_1764014188693`)
- **`POKT_AI_GATEWAY_URL`**: Gateway URL (default: `https://pokt.ai/api/gateway`)
- **`TARGET_RPS`**: Target RPS (default: `5000`, your example: `2000`)
- **`TOTAL_REQUESTS`**: Total requests (default: `1000000`)

## What Changed

✅ **Updated**: Script now tests pokt.ai gateway endpoints instead of PATH gateway directly
✅ **Simplified**: No need to send PATH gateway headers (pokt.ai handles routing)
✅ **Flexible**: Can test any endpoint by setting `ENDPOINT_ID`

## Example Run

```bash
ENDPOINT_ID=ethpath_1764014188689_1764014188693 \
TARGET_RPS=2000 \
TOTAL_REQUESTS=1000000 \
k6 run load-test-path-1m-5krps.js
```

This will:
1. Send 1M requests to `https://pokt.ai/api/gateway?endpoint=ethpath_1764014188689_1764014188693`
2. Target 2K RPS
3. Generate HTML report with pokt.ai branding
4. Show chain distribution and performance metrics

## Results

After completion, check:
- `load-test-results/path-1m-5krps-*.html` - HTML report
- `load-test-results/path-1m-5krps-*.json` - JSON summary

Ready to test! 🚀

