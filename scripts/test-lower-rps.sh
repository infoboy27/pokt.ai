#!/bin/bash
# Test with lower RPS to identify PATH gateway limits

ENDPOINT_ID="ethpath_1764014188689_1764014188693"
TARGET_RPS=500  # Reduced from 2000
TOTAL_REQUESTS=50000  # Reduced from 1000000

echo "╔═══════════════════════════════════════════════════════╗"
echo "║ PATH Gateway Load Test - Lower RPS                  ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""
echo "Target: $TOTAL_REQUESTS requests at $TARGET_RPS RPS"
echo "Gateway: https://pokt.ai/api/gateway?endpoint=$ENDPOINT_ID"
echo ""

k6 run --vus $TARGET_RPS --duration 100s \
  -e ENDPOINT_ID=$ENDPOINT_ID \
  -e TARGET_RPS=$TARGET_RPS \
  -e TOTAL_REQUESTS=$TOTAL_REQUESTS \
  load-test-path-1m-5krps.js

