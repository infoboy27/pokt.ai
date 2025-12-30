#!/bin/bash

# Script to fix endpoints missing network configurations

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Database connection
DB_CONTAINER="${DB_CONTAINER:-poktai-postgres}"
DB_USER="${DB_USER:-pokt_ai}"
DB_NAME="${DB_NAME:-pokt_ai}"

# Chain mapping (from database.ts)
declare -A CHAIN_MAP=(
    ["1"]="eth:https://rpctest.pokt.ai"
    ["250"]="fantom:https://rpctest.pokt.ai"
    ["10"]="opt:https://rpctest.pokt.ai"
    ["248"]="oasys:https://rpctest.pokt.ai"
    ["43114"]="avax:https://rpctest.pokt.ai"
    ["56"]="bsc:https://rpctest.pokt.ai"
    ["42161"]="arb-one:https://rpctest.pokt.ai"
    ["8453"]="base:https://rpctest.pokt.ai"
    ["59144"]="linea:https://rpctest.pokt.ai"
    ["5000"]="mantle:https://rpctest.pokt.ai"
    ["80094"]="bera:https://rpctest.pokt.ai"
    ["122"]="fuse:https://rpctest.pokt.ai"
    ["252"]="fraxtal:https://rpctest.pokt.ai"
    ["1088"]="metis:https://rpctest.pokt.ai"
    ["81457"]="blast:https://rpctest.pokt.ai"
    ["288"]="boba:https://rpctest.pokt.ai"
    ["100"]="gnosis:https://rpctest.pokt.ai"
    ["57073"]="ink:https://rpctest.pokt.ai"
    ["2222"]="kava:https://rpctest.pokt.ai"
    ["137"]="poly:https://rpctest.pokt.ai"
    ["146"]="sonic:https://rpctest.pokt.ai"
)

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Fix Missing Network Configurations${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if database container is running
if ! docker ps | grep -q "$DB_CONTAINER"; then
    echo -e "${RED}✗ Database container '$DB_CONTAINER' is not running${NC}"
    exit 1
fi

# Function to create network for endpoint
create_network_for_endpoint() {
    local endpoint_id=$1
    local chain_id=$2
    local chain_code=$3
    local rpc_url=$4
    
    echo -e "${YELLOW}Creating network for endpoint: ${endpoint_id}${NC}"
    echo -e "  Chain ID: ${chain_id}"
    echo -e "  Chain Code: ${chain_code}"
    echo -e "  RPC URL: ${rpc_url}"
    
    # Generate network ID
    local network_id="network_$(date +%s)_$(openssl rand -hex 4)"
    
    # Create network record
    docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" << EOF
        INSERT INTO networks (
            id, code, chain_id, rpc_url, ws_url, path_app_address, 
            is_testnet, is_enabled, endpoint_id, created_at, updated_at
        )
        VALUES (
            '$network_id',
            '$chain_code',
            $chain_id,
            '$rpc_url',
            NULL,
            NULL,
            false,
            true,
            '$endpoint_id',
            NOW(),
            NOW()
        )
        ON CONFLICT DO NOTHING;
EOF
    
    if [ $? -eq 0 ]; then
        echo -e "  ${GREEN}✓ Network created successfully${NC}"
        return 0
    else
        echo -e "  ${RED}✗ Failed to create network${NC}"
        return 1
    fi
}

# Function to detect chain from endpoint name
detect_chain_from_name() {
    local endpoint_id=$1
    local name=$(docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -t -A -c \
        "SELECT name FROM endpoints WHERE id = '$endpoint_id';" | tr -d ' ')
    
    # Try to detect chain from endpoint ID or name
    if echo "$endpoint_id" | grep -qi "fantom"; then
        echo "250"
    elif echo "$endpoint_id" | grep -qi "optimism\|opt"; then
        echo "10"
    elif echo "$endpoint_id" | grep -qi "oasys"; then
        echo "248"
    elif echo "$endpoint_id" | grep -qi "eth"; then
        echo "1"
    else
        echo ""
    fi
}

# Find all endpoints without networks
echo -e "${BLUE}Finding endpoints without networks...${NC}"
echo ""

orphaned_endpoints=$(docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -t -A -F'|' -c \
    "SELECT e.id, e.name FROM endpoints e LEFT JOIN networks n ON e.id = n.endpoint_id WHERE n.id IS NULL;")

if [ -z "$orphaned_endpoints" ]; then
    echo -e "${GREEN}✓ No endpoints without networks found${NC}"
    exit 0
fi

# Process each orphaned endpoint
echo "$orphaned_endpoints" | while IFS='|' read -r endpoint_id name; do
    if [ -z "$endpoint_id" ]; then
        continue
    fi
    
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}Endpoint: ${endpoint_id}${NC}"
    echo -e "Name: ${name}"
    
    # Try to detect chain ID
    chain_id=$(detect_chain_from_name "$endpoint_id")
    
    if [ -z "$chain_id" ]; then
        echo -e "  ${RED}✗ Could not detect chain ID from endpoint name${NC}"
        echo -e "  ${YELLOW}Please specify chain ID manually or skip this endpoint${NC}"
        echo ""
        continue
    fi
    
    # Get chain info
    chain_info="${CHAIN_MAP[$chain_id]}"
    if [ -z "$chain_info" ]; then
        echo -e "  ${RED}✗ Chain ID ${chain_id} not in mapping${NC}"
        echo ""
        continue
    fi
    
    IFS=':' read -r chain_code rpc_url <<< "$chain_info"
    
    # Create network
    create_network_for_endpoint "$endpoint_id" "$chain_id" "$chain_code" "$rpc_url"
    echo ""
done

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Fix Complete${NC}"
echo -e "${BLUE}========================================${NC}"

