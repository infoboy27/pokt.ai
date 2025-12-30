#!/bin/bash

# Script to check endpoint configurations and identify issues

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Database connection (adjust if needed)
DB_CONTAINER="${DB_CONTAINER:-poktai-postgres}"
DB_USER="${DB_USER:-pokt_ai}"
DB_NAME="${DB_NAME:-pokt_ai}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Endpoint Configuration Check${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if database container is running
if ! docker ps | grep -q "$DB_CONTAINER"; then
    echo -e "${RED}✗ Database container '$DB_CONTAINER' is not running${NC}"
    echo "Start it with: docker-compose up -d postgres"
    exit 1
fi

# Function to check endpoint
check_endpoint() {
    local endpoint_id=$1
    
    echo -e "${YELLOW}Checking endpoint: ${endpoint_id}${NC}"
    
    # Check if endpoint exists
    endpoint_exists=$(docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -t -c \
        "SELECT COUNT(*) FROM endpoints WHERE id = '$endpoint_id';" | tr -d ' ')
    
    if [ "$endpoint_exists" -eq 0 ]; then
        echo -e "  ${RED}✗ Endpoint does not exist${NC}"
        return 1
    fi
    
    echo -e "  ${GREEN}✓ Endpoint exists${NC}"
    
    # Get endpoint details
    endpoint_info=$(docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -t -A -F'|' -c \
        "SELECT id, name, is_active, org_id FROM endpoints WHERE id = '$endpoint_id';")
    
    IFS='|' read -r id name is_active org_id <<< "$endpoint_info"
    echo -e "  Name: ${name}"
    echo -e "  Active: ${is_active}"
    echo -e "  Org ID: ${org_id}"
    
    # Check networks
    network_count=$(docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -t -c \
        "SELECT COUNT(*) FROM networks WHERE endpoint_id = '$endpoint_id';" | tr -d ' ')
    
    if [ "$network_count" -eq 0 ]; then
        echo -e "  ${RED}✗ NO NETWORKS FOUND - This is the problem!${NC}"
        return 2
    fi
    
    echo -e "  ${GREEN}✓ Found ${network_count} network(s)${NC}"
    
    # Get network details
    echo -e "  Network details:"
    docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c \
        "SELECT id, code, chain_id, rpc_url, path_app_address, is_enabled FROM networks WHERE endpoint_id = '$endpoint_id';" | \
        sed 's/^/    /'
    
    return 0
}

# Check specific endpoints from test
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Checking Test Endpoints${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

declare -A ENDPOINTS=(
    ["Oasys"]="oasys_1764640848837_1764640848845"
    ["Optimism"]="optimism_1764640349512_1764640349517"
    ["Fantom"]="fantom_1764640134244_1764640134249"
    ["Ethereum"]="eth_1760726811471_1760726811479"
)

for chain in "${!ENDPOINTS[@]}"; do
    endpoint_id="${ENDPOINTS[$chain]}"
    echo -e "${YELLOW}${chain}${NC}"
    check_endpoint "$endpoint_id"
    echo ""
done

# Summary: Find all endpoints without networks
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Finding All Endpoints Without Networks${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

orphaned_count=$(docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -t -c \
    "SELECT COUNT(*) FROM endpoints e LEFT JOIN networks n ON e.id = n.endpoint_id WHERE n.id IS NULL;" | tr -d ' ')

if [ "$orphaned_count" -gt 0 ]; then
    echo -e "${RED}Found ${orphaned_count} endpoint(s) without networks:${NC}"
    docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c \
        "SELECT e.id, e.name, e.is_active FROM endpoints e LEFT JOIN networks n ON e.id = n.endpoint_id WHERE n.id IS NULL;"
else
    echo -e "${GREEN}✓ All endpoints have network configurations${NC}"
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Check Complete${NC}"
echo -e "${BLUE}========================================${NC}"

