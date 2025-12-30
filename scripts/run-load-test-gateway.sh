#!/bin/bash

# Load Test Script for pokt.ai Gateway Endpoint
# Usage: ./run-load-test-gateway.sh [TARGET_RPS] [TOTAL_REQUESTS]
# Example: ./run-load-test-gateway.sh 100 10000
# Example: ./run-load-test-gateway.sh 500 100000

set -e

# Configuration
TARGET_RPS=${1:-100}
TOTAL_REQUESTS=${2:-10000}
ENDPOINT_ID=${ENDPOINT_ID:-eth_1760726811471_1760726811479}
POKT_AI_GATEWAY_URL=${POKT_AI_GATEWAY_URL:-"https://pokt.ai/api/gateway"}

echo "🚀 Starting pokt.ai Gateway Load Test"
echo ""
echo "Configuration:"
echo "  Endpoint ID: $ENDPOINT_ID"
echo "  Target RPS: $TARGET_RPS"
echo "  Total Requests: $TOTAL_REQUESTS"
echo "  Gateway URL: $POKT_AI_GATEWAY_URL"
echo ""

# Create results directory
mkdir -p load-test-results

# Test connectivity first
echo "🔍 Testing endpoint connectivity..."
TEST_URL="${POKT_AI_GATEWAY_URL}?endpoint=${ENDPOINT_ID}"
if curl -s -X POST "$TEST_URL" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  > /dev/null 2>&1; then
  echo "✅ Endpoint is reachable"
else
  echo "❌ Endpoint is not reachable at $TEST_URL"
  echo "   Please check the endpoint ID and network connectivity"
  exit 1
fi

echo ""
echo "📊 Running load test..."
echo "   This will send $TOTAL_REQUESTS requests at $TARGET_RPS RPS"
echo "   Estimated duration: ~$((TOTAL_REQUESTS / TARGET_RPS + 90)) seconds"
echo ""

# Check if k6 is installed
if ! command -v k6 &> /dev/null; then
  echo "❌ k6 is not installed. Installing..."
  if command -v curl &> /dev/null; then
    sudo gpg -k
    sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
    echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
    sudo apt-get update
    sudo apt-get install k6
  else
    echo "Please install k6: https://k6.io/docs/getting-started/installation/"
    exit 1
  fi
fi

# Run k6 load test
k6 run \
  --env TARGET_RPS=$TARGET_RPS \
  --env TOTAL_REQUESTS=$TOTAL_REQUESTS \
  --env ENDPOINT_ID="$ENDPOINT_ID" \
  --env POKT_AI_GATEWAY_URL="$POKT_AI_GATEWAY_URL" \
  scripts/load-test-gateway-endpoint.js

echo ""
echo "✅ Load test complete!"
echo ""
echo "📄 HTML Report generated in: load-test-results/"
echo "   Open the latest HTML file in your browser to view the results"
echo ""
echo "   Latest report:"
ls -t load-test-results/gateway-*.html 2>/dev/null | head -1 | xargs -I {} echo "   {}"
