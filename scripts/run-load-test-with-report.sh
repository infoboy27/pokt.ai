#!/bin/bash
# Run Load Test and Generate Beautiful HTML Report
# This script runs the load test and generates a beautiful HTML report with pokt.ai branding

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration - Use shorter test for demonstration (can be changed to full 10M relay test)
GATEWAY_URL="${GATEWAY_URL:-http://localhost:4000}"
ENDPOINT_ID="${ENDPOINT_ID:-load_test_1762963392_c4621383}"
TEST_DURATION="${TEST_DURATION:-120}" # 2 minutes for quick test, set to 2000 for full 10M relays
TARGET_RPS="${TARGET_RPS:-100}" # Start with 100 RPS for testing, set to 5000 for full test
OUTPUT_DIR="${OUTPUT_DIR:-./load-test-results}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RESULTS_FILE="$OUTPUT_DIR/results_${TIMESTAMP}.json"
SUMMARY_FILE="$OUTPUT_DIR/summary_${TIMESTAMP}.txt"
HTML_REPORT="$OUTPUT_DIR/report_${TIMESTAMP}.html"

# Add k6 to PATH
export PATH="$HOME/.local/bin:$PATH"

echo "═══════════════════════════════════════════════════════════════"
echo "  ⚡ pokt.ai Gateway Load Test"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Configuration:"
echo "  Gateway URL: $GATEWAY_URL"
echo "  Endpoint ID: $ENDPOINT_ID"
echo "  Target RPS: $TARGET_RPS req/sec"
echo "  Duration: $TEST_DURATION seconds (~$((TEST_DURATION / 60)) minutes)"
echo "  Expected Relays: $((TARGET_RPS * TEST_DURATION))"
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

# Run load test and capture both JSON and summary output
echo "Starting load test..."
echo ""

# Run k6 with JSON output and summary
k6 run \
    --out json="$RESULTS_FILE" \
    --env GATEWAY_URL="$GATEWAY_URL" \
    --env ENDPOINT_ID="$ENDPOINT_ID" \
    --env TEST_DURATION="$TEST_DURATION" \
    --env TARGET_RPS="$TARGET_RPS" \
    load-test-10m-relays.js 2>&1 | tee "$SUMMARY_FILE"

if [ ${PIPESTATUS[0]} -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓${NC} Load test completed successfully"
    echo ""
    echo "Generating HTML report..."
    
    # Extract metrics from summary file for report generation
    # Parse k6 summary output
    SUMMARY_DATA=$(cat "$SUMMARY_FILE")
    
    # Generate HTML report using Node.js
    if command -v node &> /dev/null; then
        node generate-load-test-report-enhanced.js "$SUMMARY_FILE" "$HTML_REPORT" "$GATEWAY_URL" "$ENDPOINT_ID" "$TEST_DURATION" "$TARGET_RPS"
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓${NC} HTML report generated: $HTML_REPORT"
            echo ""
            echo "═══════════════════════════════════════════════════════════════"
            echo "  Load Test Complete"
            echo "═══════════════════════════════════════════════════════════════"
            echo ""
            echo "Results:"
            echo "  JSON Results: $RESULTS_FILE"
            echo "  Summary: $SUMMARY_FILE"
            echo "  HTML Report: $HTML_REPORT"
            echo ""
            echo "Open the report in your browser:"
            echo "  file://$(pwd)/$HTML_REPORT"
            echo ""
            
            # Try to open the report in browser
            if command -v xdg-open &> /dev/null; then
                xdg-open "$HTML_REPORT" 2>/dev/null &
            elif command -v open &> /dev/null; then
                open "$HTML_REPORT" 2>/dev/null &
            fi
        else
            echo -e "${RED}✗${NC} Failed to generate HTML report"
            exit 1
        fi
    else
        echo -e "${YELLOW}⚠${NC} Node.js not found - cannot generate HTML report"
        echo "Please install Node.js to generate HTML reports"
        echo "Summary saved to: $SUMMARY_FILE"
    fi
else
    echo -e "${RED}✗${NC} Load test failed"
    exit 1
fi

