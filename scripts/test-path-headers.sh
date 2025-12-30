#!/bin/bash

# Test script to demonstrate sending headers to PATH Gateway
# This shows how headers work even if PATH Gateway isn't fully running

echo "🧪 Testing PATH Gateway Headers"
echo "================================"
echo ""

# Configuration
PATH_GATEWAY_URL="http://localhost:3069"
APP_ADDRESS="pokt1q6rg35u5a65ddjr9hx59xvfka8pj3kxs2d5uwd"
SERVICE_ID="eth"

echo "📋 Configuration:"
echo "  PATH Gateway URL: $PATH_GATEWAY_URL"
echo "  App Address: $APP_ADDRESS"
echo "  Service ID: $SERVICE_ID"
echo ""

echo "📤 Test 1: Sending headers with curl (direct to PATH Gateway)"
echo "--------------------------------------------------------------"
echo "Command:"
echo "curl -X POST \"$PATH_GATEWAY_URL/v1/rpc\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -H \"Target-Service-Id: $SERVICE_ID\" \\"
echo "  -H \"App-Address: $APP_ADDRESS\" \\"
echo "  -d '{\"jsonrpc\":\"2.0\",\"method\":\"eth_blockNumber\",\"params\":[],\"id\":1}'"
echo ""
echo "Headers being sent:"
echo "  ✅ Content-Type: application/json"
echo "  ✅ Target-Service-Id: $SERVICE_ID"
echo "  ✅ App-Address: $APP_ADDRESS"
echo ""

# Try to send the request
echo "Sending request..."
response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$PATH_GATEWAY_URL/v1/rpc" \
  -H "Content-Type: application/json" \
  -H "Target-Service-Id: $SERVICE_ID" \
  -H "App-Address: $APP_ADDRESS" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' 2>&1)

http_code=$(echo "$response" | grep "HTTP_CODE" | cut -d: -f2)
body=$(echo "$response" | sed '/HTTP_CODE/d')

echo ""
echo "Response HTTP Code: $http_code"
echo "Response Body:"
echo "$body" | head -20
echo ""

if [ "$http_code" = "200" ] || [ "$http_code" = "000" ]; then
    echo "✅ Headers sent successfully!"
    if [ "$http_code" = "200" ]; then
        echo "✅ PATH Gateway responded!"
    else
        echo "⚠️  PATH Gateway may be down (connection refused/timeout)"
    fi
else
    echo "⚠️  Got HTTP $http_code - PATH Gateway may be having issues"
fi

echo ""
echo "📤 Test 2: Via customer-rpc-gateway (port 4002)"
echo "------------------------------------------------"
echo "This gateway forwards headers to PATH Gateway"
echo ""

# Test via customer-rpc-gateway
echo "Testing via customer-rpc-gateway..."
response2=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "http://localhost:4002/v1/rpc/eth" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' 2>&1)

http_code2=$(echo "$response2" | grep "HTTP_CODE" | cut -d: -f2)
body2=$(echo "$response2" | sed '/HTTP_CODE/d')

echo "Response HTTP Code: $http_code2"
if [ "$http_code2" = "200" ]; then
    echo "✅ Request successful!"
    echo "Response: $body2" | head -5
elif [ "$http_code2" = "401" ]; then
    echo "⚠️  Authentication required (need valid API key)"
else
    echo "Response: $body2" | head -5
fi

echo ""
echo "📝 Summary:"
echo "----------"
echo "Headers are metadata sent with HTTP requests:"
echo "  • Target-Service-Id: Tells PATH Gateway which blockchain (eth, bsc, etc.)"
echo "  • App-Address: Your Pocket Network application address"
echo "  • Content-Type: Tells the server the data format (JSON)"
echo ""
echo "These headers are sent automatically by customer-rpc-gateway"
echo "when PATH_GATEWAY_APP_ADDRESS is configured."

