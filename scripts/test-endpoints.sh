#!/bin/bash

# Test script for multiple pokt.ai gateway endpoints
# Tests: Oasys, Optimism, Fantom, and Ethereum endpoints

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Endpoints to test
declare -A ENDPOINTS=(
    ["Oasys"]="oasys_1764640848837_1764640848845"
    ["Optimism"]="optimism_1764640349512_1764640349517"
    ["Fantom"]="fantom_1764640134244_1764640134249"
    ["Ethereum"]="eth_1760726811471_1760726811479"
)

BASE_URL="https://pokt.ai/api/gateway"

# Test RPC methods
declare -a RPC_METHODS=(
    "eth_blockNumber"
    "eth_gasPrice"
)

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Testing pokt.ai Gateway Endpoints${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to test an endpoint
test_endpoint() {
    local chain_name=$1
    local endpoint_id=$2
    local method=$3
    
    local url="${BASE_URL}?endpoint=${endpoint_id}"
    local payload="{\"jsonrpc\":\"2.0\",\"method\":\"${method}\",\"params\":[],\"id\":1}"
    
    echo -e "${YELLOW}Testing ${chain_name} (${endpoint_id})${NC}"
    echo -e "  Method: ${method}"
    echo -e "  URL: ${url}"
    
    # Make the request and capture response
    response=$(curl -s -w "\n%{http_code}" -X POST "$url" \
        -H "Content-Type: application/json" \
        -d "$payload")
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    # Check HTTP status code
    if [ "$http_code" -eq 200 ]; then
        # Check if response contains error
        if echo "$body" | grep -q '"error"'; then
            echo -e "  ${RED}✗ Failed${NC}"
            echo -e "  ${RED}Error Response:${NC}"
            echo "$body" | jq '.' 2>/dev/null || echo "$body"
        else
            echo -e "  ${GREEN}✓ Success${NC}"
            echo -e "  ${GREEN}Response:${NC}"
            echo "$body" | jq '.' 2>/dev/null || echo "$body"
        fi
    else
        echo -e "  ${RED}✗ HTTP Error: ${http_code}${NC}"
        echo -e "  ${RED}Response:${NC}"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
    fi
    echo ""
}

# Test each endpoint
for chain in "${!ENDPOINTS[@]}"; do
    endpoint_id="${ENDPOINTS[$chain]}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}Chain: ${chain}${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    # Test each RPC method
    for method in "${RPC_METHODS[@]}"; do
        test_endpoint "$chain" "$endpoint_id" "$method"
        sleep 1  # Small delay between requests
    done
done

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Testing Complete${NC}"
echo -e "${BLUE}========================================${NC}"

