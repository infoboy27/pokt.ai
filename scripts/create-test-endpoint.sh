#!/bin/bash
# Create Test Endpoint Script
# This script creates a test endpoint for load testing

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
GATEWAY_URL="${GATEWAY_URL:-http://localhost:4000}"
DATABASE_URL="${DATABASE_URL:-postgresql://pokt_ai:pokt_ai_password@localhost:5432/pokt_ai}"

echo "═══════════════════════════════════════════════════════════════"
echo "  Create Test Endpoint for Load Testing"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Function to create endpoint via database
create_endpoint_via_db() {
    echo "Creating endpoint via database..."
    
    # Generate endpoint ID
    ENDPOINT_ID="load_test_$(date +%s)_$(openssl rand -hex 4)"
    ENDPOINT_NAME="Load Test Endpoint"
    ORG_ID="org-1"
    CHAIN_ID=1  # Ethereum mainnet
    
    # Create endpoint in database
    if command -v psql &> /dev/null; then
        psql "$DATABASE_URL" << EOF
        INSERT INTO endpoints (id, name, base_url, health_url, description, is_active, org_id, created_at, updated_at)
        VALUES (
            '$ENDPOINT_ID',
            '$ENDPOINT_NAME',
            'https://pokt.ai/api/gateway?endpoint=$ENDPOINT_ID',
            'https://pokt.ai/api/health?endpoint=$ENDPOINT_ID',
            'Test endpoint for load testing',
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
            'eth',
            1,
            'https://rpctest.pokt.ai',
            NULL,
            false,
            true,
            '$ENDPOINT_ID',
            NOW(),
            NOW()
        )
        ON CONFLICT DO NOTHING;
EOF
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓${NC} Endpoint created: $ENDPOINT_ID"
            echo "$ENDPOINT_ID"
            return 0
        else
            echo -e "${RED}✗${NC} Failed to create endpoint"
            return 1
        fi
    else
        echo -e "${RED}✗${NC} psql not found - cannot create endpoint via database"
        return 1
    fi
}

# Function to create endpoint via API
create_endpoint_via_api() {
    echo "Creating endpoint via API..."
    
    # Try to create endpoint via API
    API_RESPONSE=$(curl -s -X POST "$GATEWAY_URL/api/endpoints" \
        -H "Content-Type: application/json" \
        -d '{
            "name": "Load Test Endpoint",
            "chainId": 1,
            "organizationId": "org-1",
            "rateLimit": 10000
        }' 2>/dev/null || echo "ERROR")
    
    if echo "$API_RESPONSE" | grep -q '"id"'; then
        ENDPOINT_ID=$(echo "$API_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
        echo -e "${GREEN}✓${NC} Endpoint created via API: $ENDPOINT_ID"
        echo "$ENDPOINT_ID"
        return 0
    else
        echo -e "${YELLOW}⚠${NC} API endpoint creation failed: $API_RESPONSE"
        return 1
    fi
}

# Try to create endpoint via database first
if create_endpoint_via_db; then
    ENDPOINT_ID=$(create_endpoint_via_db)
else
    # Fallback to API
    if create_endpoint_via_api; then
        ENDPOINT_ID=$(create_endpoint_via_api)
    else
        echo -e "${RED}✗${NC} Failed to create endpoint via database or API"
        echo ""
        echo "Please create an endpoint manually:"
        echo "  1. Use the admin panel: $GATEWAY_URL/admin/endpoints"
        echo "  2. Or use the API: POST $GATEWAY_URL/api/endpoints"
        echo "  3. Or use the seed script: cd apps/api && pnpm db:seed"
        exit 1
    fi
fi

# Test endpoint
echo ""
echo "Testing endpoint: $ENDPOINT_ID"
TEST_RESPONSE=$(curl -s -X POST "$GATEWAY_URL/api/gateway?endpoint=$ENDPOINT_ID" \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' 2>/dev/null || echo "ERROR")

if echo "$TEST_RESPONSE" | grep -q "jsonrpc.*2.0"; then
    if echo "$TEST_RESPONSE" | grep -q '"error"'; then
        ERROR_MSG=$(echo "$TEST_RESPONSE" | grep -o '"message":"[^"]*"' | cut -d'"' -f4)
        echo -e "${YELLOW}⚠${NC} Endpoint created but returned error: $ERROR_MSG"
    else
        echo -e "${GREEN}✓${NC} Endpoint is valid and accessible"
    fi
else
    echo -e "${YELLOW}⚠${NC} Endpoint test failed - may need network configuration"
fi

# Display endpoint ID
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  Endpoint Created"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Endpoint ID: $ENDPOINT_ID"
echo ""
echo "Use this endpoint ID for load testing:"
echo "  export ENDPOINT_ID=$ENDPOINT_ID"
echo "  k6 run load-test-10m-relays.js"
echo ""
echo "Or set it in your environment:"
echo "  export GATEWAY_URL=$GATEWAY_URL"
echo "  export ENDPOINT_ID=$ENDPOINT_ID"
echo "  ./check-load-test-readiness.sh"
echo ""

