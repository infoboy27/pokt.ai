#!/bin/bash
# Get or Create Test Endpoint Script
# This script gets a valid endpoint ID for load testing, or creates one if none exists

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
GATEWAY_URL="${GATEWAY_URL:-http://localhost:4000}"
API_URL="${API_URL:-http://localhost:3001}"
DATABASE_URL="${DATABASE_URL:-postgresql://pokt_ai:pokt_ai_password@localhost:5432/pokt_ai}"

echo "═══════════════════════════════════════════════════════════════"
echo "  Get or Create Test Endpoint for Load Testing"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Function to get endpoint from database
get_endpoint_from_db() {
    echo "Checking database for existing endpoints..."
    
    # Try to query database directly
    if command -v psql &> /dev/null; then
        ENDPOINT_ID=$(psql "$DATABASE_URL" -t -c "SELECT id FROM endpoints WHERE is_active = true LIMIT 1;" 2>/dev/null | xargs || echo "")
        
        if [ -n "$ENDPOINT_ID" ]; then
            echo -e "${GREEN}✓${NC} Found active endpoint: $ENDPOINT_ID"
            return 0
        fi
    fi
    
    # Try to query via API
    echo "Trying to get endpoint via API..."
    API_RESPONSE=$(curl -s "$API_URL/api/endpoints" 2>/dev/null || echo "ERROR")
    
    if echo "$API_RESPONSE" | grep -q '"id"'; then
        ENDPOINT_ID=$(echo "$API_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
        echo -e "${GREEN}✓${NC} Found endpoint via API: $ENDPOINT_ID"
        return 0
    fi
    
    return 1
}

# Function to test endpoint
test_endpoint() {
    local endpoint_id=$1
    echo "Testing endpoint: $endpoint_id"
    
    TEST_RESPONSE=$(curl -s -X POST "$GATEWAY_URL/api/gateway?endpoint=$endpoint_id" \
        -H "Content-Type: application/json" \
        -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' 2>/dev/null || echo "ERROR")
    
    if echo "$TEST_RESPONSE" | grep -q "jsonrpc.*2.0"; then
        if echo "$TEST_RESPONSE" | grep -q '"error"'; then
            ERROR_MSG=$(echo "$TEST_RESPONSE" | grep -o '"message":"[^"]*"' | cut -d'"' -f4)
            echo -e "${YELLOW}⚠${NC} Endpoint exists but returned error: $ERROR_MSG"
            return 1
        else
            echo -e "${GREEN}✓${NC} Endpoint is valid and accessible"
            return 0
        fi
    else
        echo -e "${RED}✗${NC} Endpoint test failed"
        return 1
    fi
}

# Try to get existing endpoint
if get_endpoint_from_db; then
    if test_endpoint "$ENDPOINT_ID"; then
        echo ""
        echo "═══════════════════════════════════════════════════════════════"
        echo "  Endpoint Found"
        echo "═══════════════════════════════════════════════════════════════"
        echo ""
        echo "Endpoint ID: $ENDPOINT_ID"
        echo ""
        echo "Use this endpoint ID for load testing:"
        echo "  export ENDPOINT_ID=$ENDPOINT_ID"
        echo "  k6 run load-test-10m-relays.js"
        echo ""
        exit 0
    fi
fi

# If no valid endpoint found, suggest creating one
echo -e "${YELLOW}⚠${NC} No valid endpoint found"
echo ""
echo "Please create an endpoint first:"
echo "  1. Use the admin panel: $GATEWAY_URL/admin/endpoints"
echo "  2. Or use the API: POST $API_URL/api/endpoints"
echo "  3. Or use the seed script: cd apps/api && pnpm db:seed"
echo ""
echo "Then set the endpoint ID:"
echo "  export ENDPOINT_ID=your-endpoint-id"
echo "  k6 run load-test-10m-relays.js"
echo ""
exit 1

