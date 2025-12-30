#!/bin/bash
# Create Load Test Endpoints for Multiple Chains

set -e

POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-customer-gateway-postgres}"
ORG_ID="org_load_test_$(date +%s)"

# Chain configurations: code, chain_id, rpc_url
declare -a CHAINS=(
    "eth:1:https://rpctest.pokt.ai/v1/rpc/eth"
    "poly:137:https://rpctest.pokt.ai/v1/rpc/poly"
    "bsc:56:https://rpctest.pokt.ai/v1/rpc/bsc"
    "arb-one:42161:https://rpctest.pokt.ai/v1/rpc/arb-one"
    "opt:10:https://rpctest.pokt.ai/v1/rpc/opt"
    "base:8453:https://rpctest.pokt.ai/v1/rpc/base"
    "avax:43114:https://rpctest.pokt.ai/v1/rpc/avax"
)

echo "═══════════════════════════════════════════════════════════════"
echo "  Creating Load Test Endpoints for Multiple Chains"
echo "═══════════════════════════════════════════════════════════════"
echo ""

ENDPOINT_IDS=()

for chain_config in "${CHAINS[@]}"; do
    IFS=':' read -r code chain_id rpc_url <<< "$chain_config"
    ENDPOINT_ID="load_test_${code}_$(date +%s)_$(openssl rand -hex 4 | head -c 8)"
    ENDPOINT_NAME="Load Test - ${code^^}"
    
    echo "Creating endpoint for $code (chain_id: $chain_id)..."
    
    docker exec -i "$POSTGRES_CONTAINER" psql -U gateway -d pokt_ai << SQL
-- Create endpoint
INSERT INTO endpoints (id, name, base_url, health_url, description, is_active, org_id, created_at, updated_at)
VALUES (
    '$ENDPOINT_ID',
    '$ENDPOINT_NAME',
    'https://pokt.ai/api/gateway?endpoint=$ENDPOINT_ID',
    'https://pokt.ai/api/health?endpoint=$ENDPOINT_ID',
    'Load test endpoint for $code (10M relays at 5K RPS)',
    true,
    '$ORG_ID',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Create network record
INSERT INTO networks (id, code, chain_id, rpc_url, ws_url, is_testnet, is_enabled, endpoint_id, created_at, updated_at)
VALUES (
    'network_${ENDPOINT_ID}',
    '$code',
    $chain_id,
    '$rpc_url',
    NULL,
    false,
    true,
    '$ENDPOINT_ID',
    NOW(),
    NOW()
)
ON CONFLICT DO NOTHING;
SQL
    
    ENDPOINT_IDS+=("$ENDPOINT_ID")
    echo "  ✓ Created: $ENDPOINT_ID"
done

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  Endpoints Created"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Created ${#ENDPOINT_IDS[@]} endpoints:"
for endpoint_id in "${ENDPOINT_IDS[@]}"; do
    echo "  - $endpoint_id"
done

echo ""
echo "Save endpoints for load testing:"
echo "export LOAD_TEST_ENDPOINTS=\"${ENDPOINT_IDS[*]}\""
echo "export ORG_ID=\"$ORG_ID\""
echo ""
