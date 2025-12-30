#!/bin/bash

# Load Test Script for PATH Gateway - Multi-Chain Support
# Usage: ./run-load-test-weaversnodes.sh [TARGET_RPS] [TOTAL_REQUESTS]
# Tests all chains: eth, avax, bsc, opt, base, poly, solana, and more

set -e

# Configuration
TARGET_RPS=${1:-500}
TOTAL_REQUESTS=${2:-100000}
GATEWAY_URL=${GATEWAY_URL:-"https://gateway.weaversnodes.org/v1"}

echo "🚀 Starting PATH Gateway Multi-Chain Load Test"
echo ""
echo "Configuration:"
echo "  Target RPS: $TARGET_RPS"
echo "  Total Requests: $TOTAL_REQUESTS"
echo "  Gateway URL: $GATEWAY_URL"
echo "  Testing: 26 chains (eth, avax, bsc, opt, base, poly, solana, etc.)"
echo ""

# Create results directory
mkdir -p load-test-results

# Test connectivity first (test with ETH chain)
echo "🔍 Testing PATH Gateway connectivity..."
if curl -s -X POST "$GATEWAY_URL" \
  -H "Content-Type: application/json" \
  -H "Target-Service-Id: eth" \
  -H "App-Address: pokt1zp90apxzym50uu6jt89p30urd69gfp7nu2u2w9" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  > /dev/null 2>&1; then
  echo "✅ PATH Gateway is reachable"
else
  echo "❌ WeaversNodes Gateway is not reachable at $GATEWAY_URL"
  echo "   Please check the gateway URL and network connectivity"
  exit 1
fi

echo ""
echo "📊 Running multi-chain load test..."
echo "   This will test all configured chains with weighted distribution"
echo ""

# Run k6 load test
k6 run \
  --env TARGET_RPS=$TARGET_RPS \
  --env TOTAL_REQUESTS=$TOTAL_REQUESTS \
  --env GATEWAY_URL="$GATEWAY_URL" \
  load-test-weaversnodes.js

echo ""
echo "✅ Load test complete!"
echo ""
echo "📄 HTML Report generated in: load-test-results/"
echo "   Open the latest HTML file in your browser to view the results"

