#!/bin/bash

# PATH Gateway Setup Script
# This script helps configure and test PATH gateway integration

set -e

echo "🚀 PATH Gateway Setup Script"
echo "=============================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
PATH_GATEWAY_URL="http://localhost:3069"
APP_ADDRESS="pokt1q89a5tyhaq5xh49ec5n2wqn5zhynw6fmve06sv"
WEB_CONTAINER="pokt-ai-web"

echo "📋 Configuration:"
echo "  PATH Gateway URL: $PATH_GATEWAY_URL"
echo "  App Address: $APP_ADDRESS"
echo "  Web Container: $WEB_CONTAINER"
echo ""

# Step 1: Check PATH gateway is running
echo "Step 1: Checking PATH gateway..."
if curl -s -f "$PATH_GATEWAY_URL/v1" -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PATH gateway is accessible${NC}"
else
    echo -e "${YELLOW}⚠️  PATH gateway may not be running or accessible${NC}"
    echo "   Testing connection to $PATH_GATEWAY_URL..."
    if curl -s --connect-timeout 2 "$PATH_GATEWAY_URL" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PATH gateway is responding${NC}"
    else
        echo -e "${RED}❌ Cannot connect to PATH gateway at $PATH_GATEWAY_URL${NC}"
        echo "   Please ensure PATH gateway is running on port 3069"
        exit 1
    fi
fi
echo ""

# Step 2: Check if web container is running
echo "Step 2: Checking web container..."
if docker ps --format "{{.Names}}" | grep -q "^${WEB_CONTAINER}$"; then
    echo -e "${GREEN}✅ Web container '$WEB_CONTAINER' is running${NC}"
else
    echo -e "${RED}❌ Web container '$WEB_CONTAINER' is not running${NC}"
    echo "   Available containers:"
    docker ps --format "  - {{.Names}}"
    exit 1
fi
echo ""

# Step 3: Set environment variables
echo "Step 3: Setting environment variables..."
echo ""

# Check current environment
echo "Current environment variables:"
docker exec "$WEB_CONTAINER" printenv | grep -E "(USE_LOCAL_NODE|LOCAL_GATEWAY_URL|PATH_GATEWAY_APP_ADDRESS)" || echo "  (none set)"

echo ""
echo "Setting new environment variables..."

# Method 1: Try to update docker-compose file if it exists
COMPOSE_FILE=""
if [ -f "infra/docker-compose.yml" ]; then
    COMPOSE_FILE="infra/docker-compose.yml"
elif [ -f "docker-compose.yml" ]; then
    COMPOSE_FILE="docker-compose.yml"
fi

if [ -n "$COMPOSE_FILE" ]; then
    echo "Found docker-compose file: $COMPOSE_FILE"
    echo ""
    echo "Please add these environment variables to the 'web' service in $COMPOSE_FILE:"
    echo ""
    echo "  environment:"
    echo "    USE_LOCAL_NODE: 'true'"
    echo "    LOCAL_GATEWAY_URL: '$PATH_GATEWAY_URL'"
    echo "    PATH_GATEWAY_APP_ADDRESS: '$APP_ADDRESS'"
    echo ""
    read -p "Do you want me to add these automatically? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # This is a simple approach - in production you'd want to use yq or similar
        echo "⚠️  Manual edit recommended. Please add the environment variables manually."
        echo "   Or restart the container with:"
        echo ""
        echo "   docker stop $WEB_CONTAINER"
        echo "   docker run -d --name $WEB_CONTAINER \\"
        echo "     -e USE_LOCAL_NODE=true \\"
        echo "     -e LOCAL_GATEWAY_URL=$PATH_GATEWAY_URL \\"
        echo "     -e PATH_GATEWAY_APP_ADDRESS=$APP_ADDRESS \\"
        echo "     ... (other env vars) ..."
    fi
else
    echo "No docker-compose file found. Setting environment variables directly..."
    echo ""
    echo "To set environment variables, you can:"
    echo ""
    echo "Option 1: Restart container with env vars:"
    echo "  docker stop $WEB_CONTAINER"
    echo "  docker start $WEB_CONTAINER  # (with env vars in docker-compose or run command)"
    echo ""
    echo "Option 2: Set in .env file (if using docker-compose):"
    echo "  USE_LOCAL_NODE=true"
    echo "  LOCAL_GATEWAY_URL=$PATH_GATEWAY_URL"
    echo "  PATH_GATEWAY_APP_ADDRESS=$APP_ADDRESS"
fi

echo ""
echo "Step 4: Testing PATH gateway directly..."
echo ""

# Test PATH gateway directly
echo "Testing PATH gateway with your curl example..."
RESPONSE=$(curl -s -X POST "$PATH_GATEWAY_URL/v1" \
    -H "Content-Type: application/json" \
    -H "Target-Service-Id: eth" \
    -H "App-Address: $APP_ADDRESS" \
    -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}')

if echo "$RESPONSE" | grep -q "result"; then
    echo -e "${GREEN}✅ PATH gateway test successful!${NC}"
    echo "Response:"
    echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"
else
    echo -e "${YELLOW}⚠️  PATH gateway returned:${NC}"
    echo "$RESPONSE"
fi

echo ""
echo "=============================="
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Set environment variables in your docker-compose.yml or .env file"
echo "2. Restart the web container: docker restart $WEB_CONTAINER"
echo "3. Run test script: ./test-path-gateway.sh"
echo ""

