#!/bin/bash
# Run Load Test and Generate HTML Report
# This script runs the load test and generates a beautiful HTML report with pokt.ai branding

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
GATEWAY_URL="${GATEWAY_URL:-http://localhost:4000}"
ENDPOINT_ID="${ENDPOINT_ID:-load_test_1762963392_c4621383}"
TEST_DURATION="${TEST_DURATION:-60}" # Default to 60 seconds for quick test, set to 2000 for full 10M relays
TARGET_RPS="${TARGET_RPS:-5000}"
OUTPUT_DIR="${OUTPUT_DIR:-./load-test-results}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RESULTS_FILE="$OUTPUT_DIR/results_${TIMESTAMP}.json"
HTML_REPORT="$OUTPUT_DIR/report_${TIMESTAMP}.html"

# Add k6 to PATH
export PATH="$HOME/.local/bin:$PATH"

echo "═══════════════════════════════════════════════════════════════"
echo "  Load Test: 10M Relays at 5K RPS"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Configuration:"
echo "  Gateway URL: $GATEWAY_URL"
echo "  Endpoint ID: $ENDPOINT_ID"
echo "  Target RPS: $TARGET_RPS"
echo "  Duration: $TEST_DURATION seconds (~$((TEST_DURATION / 60)) minutes)"
echo "  Output Directory: $OUTPUT_DIR"
echo ""

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Check if k6 is installed
if ! command -v k6 &> /dev/null; then
    echo -e "${RED}✗${NC} k6 is not installed"
    echo "Please install k6: ./install-k6-local.sh"
    exit 1
fi

# Check if endpoint is accessible
echo "Verifying endpoint is accessible..."
TEST_RESPONSE=$(curl -s -X POST "$GATEWAY_URL/api/gateway?endpoint=$ENDPOINT_ID" \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' 2>/dev/null || echo "ERROR")

if echo "$TEST_RESPONSE" | grep -q '"error"'; then
    echo -e "${YELLOW}⚠${NC} Endpoint test returned error: $TEST_RESPONSE"
    echo "Continuing with load test anyway..."
elif echo "$TEST_RESPONSE" | grep -q "jsonrpc.*2.0"; then
    echo -e "${GREEN}✓${NC} Endpoint is accessible"
else
    echo -e "${YELLOW}⚠${NC} Endpoint test failed: $TEST_RESPONSE"
    echo "Continuing with load test anyway..."
fi

echo ""
echo "Starting load test..."
echo ""

# Run load test with JSON output
k6 run \
    --out json="$RESULTS_FILE" \
    --env GATEWAY_URL="$GATEWAY_URL" \
    --env ENDPOINT_ID="$ENDPOINT_ID" \
    --env TEST_DURATION="$TEST_DURATION" \
    --env TARGET_RPS="$TARGET_RPS" \
    load-test-10m-relays.js

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓${NC} Load test completed successfully"
    echo ""
    echo "Generating HTML report..."
    
    # Generate HTML report
    node generate-load-test-report.js "$RESULTS_FILE" "$HTML_REPORT" "$GATEWAY_URL" "$ENDPOINT_ID" "$TEST_DURATION" "$TARGET_RPS"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} HTML report generated: $HTML_REPORT"
        echo ""
        echo "═══════════════════════════════════════════════════════════════"
        echo "  Load Test Complete"
        echo "═══════════════════════════════════════════════════════════════"
        echo ""
        echo "Results:"
        echo "  JSON Results: $RESULTS_FILE"
        echo "  HTML Report: $HTML_REPORT"
        echo ""
        echo "Open the report in your browser:"
        echo "  file://$(pwd)/$HTML_REPORT"
        echo "  Or: xdg-open $HTML_REPORT"
        echo ""
    else
        echo -e "${RED}✗${NC} Failed to generate HTML report"
        exit 1
    fi
else
    echo -e "${RED}✗${NC} Load test failed"
    exit 1
fi

