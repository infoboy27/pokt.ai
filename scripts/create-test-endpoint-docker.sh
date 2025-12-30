#!/bin/bash
# Create Test Endpoint Script (Using Docker)
# This script creates a test endpoint for load testing using Docker

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
GATEWAY_URL="${GATEWAY_URL:-http://localhost:4000}"
POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-customer-gateway-postgres}"

echo "═══════════════════════════════════════════════════════════════"
echo "  Create Test Endpoint for Load Testing"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Check if PostgreSQL container is running
if ! docker ps --format "{{.Names}}" | grep -q "^${POSTGRES_CONTAINER}$"; then
    echo -e "${RED}✗${NC} PostgreSQL container '$POSTGRES_CONTAINER' is not running"
    echo "Please start the container: docker-compose up -d postgres"
    exit 1
fi

# Generate endpoint ID
ENDPOINT_ID="load_test_$(date +%s)_$(openssl rand -hex 4 | head -c 8)"
ENDPOINT_NAME="Load Test Endpoint"
ORG_ID="org-1"
CHAIN_ID=1  # Ethereum mainnet
NETWORK_CODE="eth"

echo "Creating endpoint: $ENDPOINT_ID"
echo "Name: $ENDPOINT_NAME"
echo "Organization: $ORG_ID"
echo "Chain: Ethereum (chain_id: $CHAIN_ID)"
echo ""

# Create endpoint in database
echo "Creating endpoint in database..."
docker exec -i "$POSTGRES_CONTAINER" psql -U gateway -d pokt_ai << EOF
-- Create endpoint
INSERT INTO endpoints (id, name, base_url, health_url, description, is_active, org_id, created_at, updated_at)
VALUES (
    '$ENDPOINT_ID',
    '$ENDPOINT_NAME',
    'https://pokt.ai/api/gateway?endpoint=$ENDPOINT_ID',
    'https://pokt.ai/api/health?endpoint=$ENDPOINT_ID',
    'Test endpoint for load testing (10M relays at 5K RPS)',
    true,
    '$ORG_ID',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Create network record for Ethereum
INSERT INTO networks (id, code, chain_id, rpc_url, ws_url, is_testnet, is_enabled, endpoint_id, created_at, updated_at)
VALUES (
    'network_${ENDPOINT_ID}_$(date +%s)',
    '$NETWORK_CODE',
    $CHAIN_ID,
    'https://rpctest.pokt.ai',
    NULL,
    false,
    true,
    '$ENDPOINT_ID',
    NOW(),
    NOW()
)
ON CONFLICT DO NOTHING;

-- Verify endpoint was created
SELECT id, name, is_active, org_id FROM endpoints WHERE id = '$ENDPOINT_ID';

-- Verify network was created
SELECT id, code, chain_id, endpoint_id, is_enabled FROM networks WHERE endpoint_id = '$ENDPOINT_ID';
EOF

# Check if endpoint was created
ENDPOINT_EXISTS=$(docker exec "$POSTGRES_CONTAINER" psql -U gateway -d pokt_ai -t -c "SELECT COUNT(*) FROM endpoints WHERE id = '$ENDPOINT_ID';" 2>/dev/null | xargs || echo "0")

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Endpoint created: $ENDPOINT_ID"
else
    echo -e "${RED}✗${NC} Failed to create endpoint"
    exit 1
fi

# Test endpoint
echo ""
echo "Testing endpoint: $ENDPOINT_ID"
TEST_RESPONSE=$(curl -s -X POST "$GATEWAY_URL/api/gateway?endpoint=$ENDPOINT_ID" \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' 2>/dev/null || echo "ERROR")

if echo "$TEST_RESPONSE" | grep -q "jsonrpc.*2.0"; then
    if echo "$TEST_RESPONSE" | grep -q '"error"'; then
        ERROR_MSG=$(echo "$TEST_RESPONSE" | grep -o '"message":"[^"]*"' | cut -d'"' -f4 || echo "Unknown error")
        echo -e "${YELLOW}⚠${NC} Endpoint created but returned error: $ERROR_MSG"
        echo ""
        echo "Response: $TEST_RESPONSE"
    else
        echo -e "${GREEN}✓${NC} Endpoint is valid and accessible"
        RESULT=$(echo "$TEST_RESPONSE" | grep -o '"result":"[^"]*"' | cut -d'"' -f4 || echo "N/A")
        echo "   Test result: $RESULT"
    fi
else
    echo -e "${YELLOW}⚠${NC} Endpoint test failed - may need network configuration"
    echo "Response: $TEST_RESPONSE"
fi

# Display endpoint ID
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  Endpoint Created"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Endpoint ID: $ENDPOINT_ID"
echo "Endpoint Name: $ENDPOINT_NAME"
echo "Gateway URL: $GATEWAY_URL/api/gateway?endpoint=$ENDPOINT_ID"
echo ""
echo "Use this endpoint ID for load testing:"
echo "  export ENDPOINT_ID=$ENDPOINT_ID"
echo "  export GATEWAY_URL=$GATEWAY_URL"
echo "  export PATH=\"\$HOME/.local/bin:\$PATH\""
echo "  k6 run load-test-10m-relays.js"
echo ""
echo "Or run the readiness check:"
echo "  export ENDPOINT_ID=$ENDPOINT_ID"
echo "  ./check-load-test-readiness.sh"
echo ""
echo "Save endpoint ID to file:"
echo "  echo 'export ENDPOINT_ID=$ENDPOINT_ID' >> .env.loadtest"
echo "  echo 'export GATEWAY_URL=$GATEWAY_URL' >> .env.loadtest"
echo "  source .env.loadtest"
echo ""

