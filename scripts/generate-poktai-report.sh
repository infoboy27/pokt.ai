#!/bin/bash
# Generate Branded pokt.ai Load Test Report
# This script generates a beautiful HTML report with pokt.ai branding

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
RESULTS_DIR="${RESULTS_DIR:-./load-test-results}"
TIMESTAMP="${1:-$(ls -t ${RESULTS_DIR}/results_*.json 2>/dev/null | head -1 | grep -oP 'results_\K[0-9_]+' || date +%Y%m%d_%H%M%S)}"
RESULTS_FILE="${RESULTS_DIR}/results_${TIMESTAMP}.json"
HTML_REPORT="${RESULTS_DIR}/report_poktai_${TIMESTAMP}.html"

echo "═══════════════════════════════════════════════════════════════"
echo "  📊 Generating pokt.ai Branded Load Test Report"
echo "═══════════════════════════════════════════════════════════════"
echo ""

if [ ! -f "$RESULTS_FILE" ]; then
    echo "❌ Results file not found: $RESULTS_FILE"
    echo "Available files:"
    ls -1 ${RESULTS_DIR}/results_*.json 2>/dev/null | head -5 || echo "  No results files found"
    exit 1
fi

echo "📄 Input: $RESULTS_FILE"
echo "📊 Output: $HTML_REPORT"
echo ""

# Generate report using Node.js (from JSON output)
node generate-report-from-json.js "$RESULTS_FILE" "$HTML_REPORT" "pokt.ai Load Test" "10M ETH Requests at 5K RPS"

if [ -f "$HTML_REPORT" ]; then
    echo ""
    echo "✅ Report generated successfully!"
    echo ""
    echo "📊 Report: $HTML_REPORT"
    echo ""
    echo "Open in browser:"
    echo "  file://$(realpath $HTML_REPORT)"
    echo ""
    echo "Or serve with:"
    echo "  python3 -m http.server 8000"
    echo "  Then open: http://localhost:8000/load-test-results/report_poktai_${TIMESTAMP}.html"
else
    echo "❌ Report generation failed"
    exit 1
fi

