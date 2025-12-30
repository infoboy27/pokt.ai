#!/bin/bash

# PATH Gateway Load Test Runner
# Target: 1M requests at 5K RPS across multiple chains

set -e

echo "╔═══════════════════════════════════════════════════════╗"
echo "║     PATH Gateway Load Test - 1M Requests @ 5K RPS    ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

# Configuration
PATH_GATEWAY_URL="${PATH_GATEWAY_URL:-http://localhost:3069/v1}"
TARGET_RPS="${TARGET_RPS:-5000}"
TOTAL_REQUESTS="${TOTAL_REQUESTS:-1000000}"

# Check if k6 is installed
if ! command -v k6 &> /dev/null; then
    echo "❌ k6 is not installed. Installing..."
    curl https://github.com/grafana/k6/releases/download/v0.47.0/k6-v0.47.0-linux-amd64.tar.gz -L | tar xvz
    sudo mv k6-v0.47.0-linux-amd64/k6 /usr/local/bin/ || mv k6-v0.47.0-linux-amd64/k6 ~/.local/bin/
    echo "✅ k6 installed"
fi

# Check PATH gateway is accessible
echo "🔍 Checking PATH gateway connectivity..."
if ! curl -s -f "${PATH_GATEWAY_URL}" -H "Content-Type: application/json" \
  -H "Target-Service-Id: eth" \
  -H "App-Address: pokt1q89a5tyhaq5xh49ec5n2wqn5zhynw6fmve06sv" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' > /dev/null 2>&1; then
    echo "❌ PATH gateway is not accessible at ${PATH_GATEWAY_URL}"
    echo "   Please ensure the gateway is running: docker ps | grep shannon-testnet-gateway"
    exit 1
fi
echo "✅ PATH gateway is accessible"
echo ""

# Display configuration
echo "📋 Test Configuration:"
echo "   Gateway URL: ${PATH_GATEWAY_URL}"
echo "   Target RPS: ${TARGET_RPS}"
echo "   Total Requests: ${TOTAL_REQUESTS}"
echo "   Estimated Duration: ~$((TOTAL_REQUESTS / TARGET_RPS)) seconds (~$((TOTAL_REQUESTS / TARGET_RPS / 60)) minutes)"
echo "   Chains: eth (40%), bsc (30%), kava (20%), text-to-text (10%)"
echo ""

# Confirm before starting
read -p "🚀 Start load test? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Test cancelled"
    exit 1
fi

echo ""
echo "⏳ Starting load test..."
echo ""

# Run k6 test
export PATH_GATEWAY_URL
export TARGET_RPS
export TOTAL_REQUESTS

k6 run \
  --out json=load-test-results/path-1m-5krps-raw.json \
  load-test-path-1m-5krps.js

echo ""
echo "✅ Load test completed!"
echo "📊 Results saved to: load-test-results/"
echo ""

