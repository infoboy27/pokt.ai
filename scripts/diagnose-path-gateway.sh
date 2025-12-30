#!/bin/bash

# Script to diagnose PATH gateway service configuration issues

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PATH_GATEWAY_URL="${PATH_GATEWAY_URL:-https://gateway.weaversnodes.org/v1}"
PATH_GATEWAY_APP_ADDRESS="${PATH_GATEWAY_APP_ADDRESS:-pokt1q89a5tyhaq5xh49ec5n2wqn5zhynw6fmve06sv}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}PATH Gateway Service Diagnostics${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "PATH Gateway URL: ${PATH_GATEWAY_URL}"
echo -e "App Address: ${PATH_GATEWAY_APP_ADDRESS}"
echo ""

# Test service IDs with their WeaversNodes app addresses
declare -A SERVICES=(
    ["eth"]="Ethereum"
    ["opt"]="Optimism"
    ["oasys"]="Oasys"
    ["fantom"]="Fantom"
    ["bsc"]="BSC"
    ["poly"]="Polygon"
)

# WeaversNodes Gateway app addresses (from CHAIN_APP_ADDRESSES)
declare -A SERVICE_APP_ADDRESSES=(
    ["eth"]="pokt1zp90apxzym50uu6jt89p30urd69gfp7nu2u2w9"
    ["opt"]="pokt1hcn484sc9w3xqdwajv7cz06wys3r4az999ds36"
    ["oasys"]="pokt1nnkjgpzzuuadyexuepuewj97p7s8hcdqapamgt"
    ["fantom"]="pokt14fnfvne4mh0m8lh63nremuxmdl5qp2kxtljkfs"
    ["bsc"]="pokt1du5ve83cj92qx0swvym7s6934a2rver68jje2z"
    ["poly"]="pokt1904q7y3v23h7gur02d6ple97celg5ysgedcw6t"
)

test_service() {
    local service_id=$1
    local service_name=$2
    
    # Get service-specific app address, fallback to default
    local app_address="${SERVICE_APP_ADDRESSES[$service_id]:-$PATH_GATEWAY_APP_ADDRESS}"
    
    echo -e "${YELLOW}Testing ${service_name} (service: ${service_id})${NC}"
    echo -e "  App Address: ${app_address}"
    
    # Test with eth_blockNumber (standard RPC call)
    # Note: PATH gateway URL already includes /v1 if using WeaversNodes
    local gateway_url="${PATH_GATEWAY_URL}"
    if [[ ! "$gateway_url" =~ /v1$ ]]; then
        gateway_url="${PATH_GATEWAY_URL}/v1"
    fi
    
    response=$(curl -s -w "\n%{http_code}" -X POST "${gateway_url}" \
        -H "Content-Type: application/json" \
        -H "Target-Service-Id: ${service_id}" \
        -H "App-Address: ${app_address}" \
        -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}')
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -eq 200 ]; then
        if echo "$body" | grep -q '"error"'; then
            error_msg=$(echo "$body" | jq -r '.error.message // .error' 2>/dev/null || echo "$body")
            if echo "$error_msg" | grep -qi "no protocol endpoint responses\|no responses received"; then
                echo -e "  ${RED}✗ Service not available${NC}"
                echo -e "  ${RED}Error: ${error_msg}${NC}"
                echo -e "  ${YELLOW}→ App address may not have staked services for ${service_id}${NC}"
                echo -e "  ${YELLOW}→ PATH gateway may not have nodes configured for ${service_id}${NC}"
            else
                echo -e "  ${YELLOW}⚠ Service responded with error${NC}"
                echo -e "  Error: ${error_msg}"
            fi
        else
            result=$(echo "$body" | jq -r '.result' 2>/dev/null || echo "N/A")
            echo -e "  ${GREEN}✓ Service working${NC}"
            echo -e "  Result: ${result}"
        fi
    else
        echo -e "  ${RED}✗ HTTP Error: ${http_code}${NC}"
        echo -e "  Response: ${body}"
    fi
    echo ""
}

# Test each service
for service_id in "${!SERVICES[@]}"; do
    service_name="${SERVICES[$service_id]}"
    test_service "$service_id" "$service_name"
done

# Summary
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Diagnostics Complete${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}If services show 'no protocol endpoint responses':${NC}"
echo -e "1. Verify app address ${PATH_GATEWAY_APP_ADDRESS} has staked services"
echo -e "2. Check PATH gateway configuration for service endpoints"
echo -e "3. Verify service IDs match PATH gateway expectations"
echo -e "4. Check PATH gateway logs for service-specific errors"

