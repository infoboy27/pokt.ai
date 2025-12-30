#!/bin/bash

# Run Load Test Against pokt.ai Gateway Endpoint
# Usage: ./run-load-test-pokt-ai.sh [endpoint-id]

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║   pokt.ai Gateway Load Test                                   ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Configuration
ENDPOINT_ID="${1:-ethpath_1764014188689_1764014188693}"
POKT_AI_GATEWAY_URL="${POKT_AI_GATEWAY_URL:-https://pokt.ai/api/gateway}"
TARGET_RPS="${TARGET_RPS:-2000}"
TOTAL_REQUESTS="${TOTAL_REQUESTS:-1000000}"
USE_POKT_AI_GATEWAY="${USE_POKT_AI_GATEWAY:-true}"

echo "📋 Test Configuration:"
echo "   Endpoint ID: ${ENDPOINT_ID}"
echo "   Gateway URL: ${POKT_AI_GATEWAY_URL}"
echo "   Target RPS: ${TARGET_RPS}"
echo "   Total Requests: ${TOTAL_REQUESTS}"
echo "   Estimated Duration: ~$((TOTAL_REQUESTS / TARGET_RPS)) seconds (~$((TOTAL_REQUESTS / TARGET_RPS / 60)) minutes)"
echo ""

# Check if k6 is installed
if ! command -v k6 &> /dev/null; then
    echo -e "${RED}❌ k6 is not installed${NC}"
    echo "Please install k6: https://k6.io/docs/getting-started/installation/"
    exit 1
fi

# Check endpoint is accessible
echo "🔍 Checking endpoint accessibility..."
TEST_RESPONSE=$(curl -s -X POST "${POKT_AI_GATEWAY_URL}?endpoint=${ENDPOINT_ID}" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' 2>&1)

if echo "$TEST_RESPONSE" | grep -q "error"; then
    echo -e "${YELLOW}⚠️  Endpoint test returned error:${NC}"
    echo "$TEST_RESPONSE" | jq '.' 2>/dev/null || echo "$TEST_RESPONSE"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Test cancelled."
        exit 1
    fi
else
    echo -e "${GREEN}✅ Endpoint is accessible${NC}"
    echo "$TEST_RESPONSE" | jq '.' 2>/dev/null | head -5 || echo "$TEST_RESPONSE" | head -3
fi

echo ""
echo "⏳ Starting load test..."
echo ""

# Create results directory
mkdir -p load-test-results

# Run k6 test
export ENDPOINT_ID
export POKT_AI_GATEWAY_URL
export TARGET_RPS
export TOTAL_REQUESTS
export USE_POKT_AI_GATEWAY

k6 run load-test-path-1m-5krps.js

echo ""
echo -e "${GREEN}✅ Load test completed!${NC}"
echo "📊 Results saved to: load-test-results/"
echo ""

# Find latest report
LATEST_REPORT=$(ls -t load-test-results/path-1m-5krps-*.html 2>/dev/null | head -1)
if [ -n "$LATEST_REPORT" ]; then
    echo "📄 Latest HTML report: $LATEST_REPORT"
    echo ""
    echo "To view:"
    echo "  xdg-open \"$LATEST_REPORT\"  # Linux"
    echo "  open \"$LATEST_REPORT\"      # macOS"
fi

