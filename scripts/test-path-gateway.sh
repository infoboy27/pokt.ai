#!/bin/bash

# PATH Gateway Test Script
# Tests PATH gateway integration through the pokt.ai portal

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "🧪 PATH Gateway Test Script"
echo "============================"
echo ""

# Configuration
PATH_GATEWAY_URL="http://localhost:3069"
APP_ADDRESS="pokt1q89a5tyhaq5xh49ec5n2wqn5zhynw6fmve06sv"
WEB_CONTAINER="pokt-ai-web"
PORTAL_URL="${PORTAL_URL:-http://localhost:3005}"

# Get endpoint ID (you'll need to provide this)
if [ -z "$ENDPOINT_ID" ]; then
    echo -e "${YELLOW}⚠️  ENDPOINT_ID not set${NC}"
    echo "Please set ENDPOINT_ID environment variable:"
    echo "  export ENDPOINT_ID=your-endpoint-id"
    echo ""
    echo "Or provide it now:"
    read -p "Endpoint ID: " ENDPOINT_ID
fi

echo "📋 Test Configuration:"
echo "  Portal URL: $PORTAL_URL"
echo "  PATH Gateway: $PATH_GATEWAY_URL"
echo "  App Address: $APP_ADDRESS"
echo "  Endpoint ID: $ENDPOINT_ID"
echo ""

# Test 1: Check PATH gateway is accessible
echo "Test 1: PATH Gateway Direct Connection"
echo "----------------------------------------"
echo "Testing: POST $PATH_GATEWAY_URL/v1"
echo "Headers:"
echo "  Target-Service-Id: eth"
echo "  App-Address: $APP_ADDRESS"
echo ""

RESPONSE1=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$PATH_GATEWAY_URL/v1" \
    -H "Content-Type: application/json" \
    -H "Target-Service-Id: eth" \
    -H "App-Address: $APP_ADDRESS" \
    -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}')

HTTP_CODE1=$(echo "$RESPONSE1" | grep "HTTP_CODE" | cut -d: -f2)
BODY1=$(echo "$RESPONSE1" | sed '/HTTP_CODE/d')

if [ "$HTTP_CODE1" = "200" ] && echo "$BODY1" | grep -q "result"; then
    echo -e "${GREEN}✅ PATH gateway direct test: SUCCESS${NC}"
    echo "Response:"
    echo "$BODY1" | jq . 2>/dev/null || echo "$BODY1"
else
    echo -e "${RED}❌ PATH gateway direct test: FAILED${NC}"
    echo "HTTP Code: $HTTP_CODE1"
    echo "Response: $BODY1"
fi
echo ""

# Test 2: Check web container environment variables
echo "Test 2: Web Container Configuration"
echo "------------------------------------"
echo "Checking environment variables in $WEB_CONTAINER..."

USE_LOCAL_NODE=$(docker exec "$WEB_CONTAINER" printenv USE_LOCAL_NODE 2>/dev/null || echo "")
LOCAL_GATEWAY_URL=$(docker exec "$WEB_CONTAINER" printenv LOCAL_GATEWAY_URL 2>/dev/null || echo "")
PATH_GATEWAY_APP_ADDRESS=$(docker exec "$WEB_CONTAINER" printenv PATH_GATEWAY_APP_ADDRESS 2>/dev/null || echo "")

if [ "$USE_LOCAL_NODE" = "true" ]; then
    echo -e "${GREEN}✅ USE_LOCAL_NODE=true${NC}"
else
    echo -e "${RED}❌ USE_LOCAL_NODE not set or not 'true'${NC}"
    echo "   Current value: ${USE_LOCAL_NODE:-'(not set)'}"
fi

if [ -n "$LOCAL_GATEWAY_URL" ]; then
    echo -e "${GREEN}✅ LOCAL_GATEWAY_URL=$LOCAL_GATEWAY_URL${NC}"
else
    echo -e "${RED}❌ LOCAL_GATEWAY_URL not set${NC}"
fi

if [ -n "$PATH_GATEWAY_APP_ADDRESS" ]; then
    echo -e "${GREEN}✅ PATH_GATEWAY_APP_ADDRESS=$PATH_GATEWAY_APP_ADDRESS${NC}"
else
    echo -e "${RED}❌ PATH_GATEWAY_APP_ADDRESS not set${NC}"
fi

if [ "$USE_LOCAL_NODE" != "true" ] || [ -z "$LOCAL_GATEWAY_URL" ] || [ -z "$PATH_GATEWAY_APP_ADDRESS" ]; then
    echo ""
    echo -e "${YELLOW}⚠️  Configuration incomplete!${NC}"
    echo "Please set these environment variables:"
    echo "  USE_LOCAL_NODE=true"
    echo "  LOCAL_GATEWAY_URL=$PATH_GATEWAY_URL"
    echo "  PATH_GATEWAY_APP_ADDRESS=$APP_ADDRESS"
    echo ""
    echo "Then restart the container:"
    echo "  docker restart $WEB_CONTAINER"
    echo ""
fi
echo ""

# Test 3: Test through portal (if configured)
if [ "$USE_LOCAL_NODE" = "true" ] && [ -n "$LOCAL_GATEWAY_URL" ] && [ -n "$PATH_GATEWAY_APP_ADDRESS" ]; then
    echo "Test 3: Portal Integration Test"
    echo "-------------------------------"
    echo "Testing: POST $PORTAL_URL/api/gateway?endpoint=$ENDPOINT_ID"
    echo ""
    
    RESPONSE3=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$PORTAL_URL/api/gateway?endpoint=$ENDPOINT_ID" \
        -H "Content-Type: application/json" \
        -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}')
    
    HTTP_CODE3=$(echo "$RESPONSE3" | grep "HTTP_CODE" | cut -d: -f2)
    BODY3=$(echo "$RESPONSE3" | sed '/HTTP_CODE/d')
    
    if [ "$HTTP_CODE3" = "200" ] && echo "$BODY3" | grep -q "result"; then
        echo -e "${GREEN}✅ Portal test: SUCCESS${NC}"
        echo "Response:"
        echo "$BODY3" | jq . 2>/dev/null || echo "$BODY3"
        
        # Check if it went through PATH gateway
        if echo "$BODY3" | grep -q "X-RPC-Latency"; then
            echo ""
            echo "Response headers indicate successful routing!"
        fi
    else
        echo -e "${RED}❌ Portal test: FAILED${NC}"
        echo "HTTP Code: $HTTP_CODE3"
        echo "Response: $BODY3"
    fi
else
    echo "Test 3: Portal Integration Test"
    echo "-------------------------------"
    echo -e "${YELLOW}⏭️  Skipped - configuration incomplete${NC}"
fi
echo ""

# Summary
echo "============================"
echo "📊 Test Summary"
echo "============================"
echo ""

if [ "$HTTP_CODE1" = "200" ]; then
    echo -e "${GREEN}✅ PATH Gateway: Working${NC}"
else
    echo -e "${RED}❌ PATH Gateway: Not working${NC}"
fi

if [ "$USE_LOCAL_NODE" = "true" ] && [ -n "$LOCAL_GATEWAY_URL" ] && [ -n "$PATH_GATEWAY_APP_ADDRESS" ]; then
    echo -e "${GREEN}✅ Portal Configuration: Complete${NC}"
else
    echo -e "${RED}❌ Portal Configuration: Incomplete${NC}"
fi

if [ "$HTTP_CODE3" = "200" ] 2>/dev/null; then
    echo -e "${GREEN}✅ Portal Integration: Working${NC}"
elif [ -n "$HTTP_CODE3" ]; then
    echo -e "${RED}❌ Portal Integration: Failed${NC}"
else
    echo -e "${YELLOW}⏭️  Portal Integration: Not tested${NC}"
fi

echo ""
echo "Done! 🎉"

