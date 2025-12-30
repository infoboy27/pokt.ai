#!/bin/bash

# Test script to check if chat.pokt.ai endpoints are reachable

echo "=== Testing chat.pokt.ai Reachability ==="
echo ""

# Test 1: Check if localhost:8000 (Llama API) is reachable
echo "1. Testing Llama API (localhost:8000)..."
if curl -s -f -m 5 http://localhost:8000/api/llm/query -X POST \
  -H "Content-Type: application/json" \
  -d '{"query":"test","network":"eth"}' > /dev/null 2>&1; then
    echo "   ✅ Llama API is reachable"
else
    echo "   ❌ Llama API is not reachable (may be normal if service is down)"
fi

echo ""

# Test 2: Check Pocket Network Shannon API
echo "2. Testing Pocket Network Shannon API..."
SHANNON_API="https://shannon-grove-api.mainnet.poktroll.com"
if curl -s -f -m 10 "$SHANNON_API" > /dev/null 2>&1; then
    echo "   ✅ Shannon API is reachable"
else
    echo "   ❌ Shannon API is not reachable"
fi

echo ""

# Test 3: Check pokt.ai Gateway
echo "3. Testing pokt.ai Gateway..."
POKTAI_GATEWAY="https://pokt.ai/api/gateway"
if curl -s -f -m 10 "$POKTAI_GATEWAY" > /dev/null 2>&1; then
    echo "   ✅ pokt.ai Gateway is reachable"
else
    echo "   ⚠️  pokt.ai Gateway returned error (may require auth)"
fi

echo ""

# Test 4: Check RPC endpoints
echo "4. Testing RPC endpoints..."
RPC_URL="http://135.125.163.236:4000/v1/rpc/eth"
if curl -s -f -m 5 -X POST "$RPC_URL" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' > /dev/null 2>&1; then
    echo "   ✅ RPC endpoint is reachable"
else
    echo "   ❌ RPC endpoint is not reachable"
fi

echo ""
echo "=== Test Complete ==="

