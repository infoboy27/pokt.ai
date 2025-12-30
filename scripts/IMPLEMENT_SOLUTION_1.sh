#!/bin/bash

# Solution 1 Implementation: Add App Private Key to PATH Gateway
# This allows PATH gateway to use 50 protocol endpoints directly

set -e

echo "═══════════════════════════════════════════════════════════════"
echo "  Solution 1: Configure PATH Gateway Protocol Endpoints"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Check if private key is provided
if [ -z "$1" ]; then
    echo "❌ Error: App private key (hex) required"
    echo ""
    echo "Usage: $0 <app_private_key_hex>"
    echo ""
    echo "Example:"
    echo "  $0 abc123def456..."
    echo ""
    echo "This will configure PATH gateway to use protocol endpoints"
    echo "for app: pokt1q6rg35u5a65ddjr9hx59xvfka8pj3kxs2d5uwd"
    exit 1
fi

APP_PRIVATE_KEY="$1"
GATEWAY_CONFIG="/home/shannon/shannon/gateway/config/gateway_config.yaml"

echo "📋 Configuration:"
echo "   App: pokt1q6rg35u5a65ddjr9hx59xvfka8pj3kxs2d5uwd"
echo "   Gateway: pokt12uyvsdt8x5q00zk0vtqceym9x2nxgcjtqe3tvx"
echo "   Config file: $GATEWAY_CONFIG"
echo ""

# Backup config
echo "📦 Creating backup..."
cp "$GATEWAY_CONFIG" "${GATEWAY_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
echo "   ✅ Backup created"
echo ""

# Check if owned_apps_private_keys_hex exists
if grep -q "owned_apps_private_keys_hex:" "$GATEWAY_CONFIG"; then
    echo "🔧 Updating existing owned_apps_private_keys_hex..."
    # Replace empty array with array containing the key
    sed -i 's/owned_apps_private_keys_hex: \[\]/owned_apps_private_keys_hex:\n      - "'"$APP_PRIVATE_KEY"'"/' "$GATEWAY_CONFIG"
else
    echo "🔧 Adding owned_apps_private_keys_hex..."
    # Add after gateway_private_key_hex line
    sed -i '/gateway_private_key_hex:/a\    owned_apps_private_keys_hex:\n      - "'"$APP_PRIVATE_KEY"'"' "$GATEWAY_CONFIG"
fi

echo "   ✅ Configuration updated"
echo ""

# Verify the change
echo "🔍 Verifying configuration..."
if grep -A 2 "owned_apps_private_keys_hex:" "$GATEWAY_CONFIG" | grep -q "$APP_PRIVATE_KEY"; then
    echo "   ✅ Private key found in config"
else
    echo "   ❌ Error: Private key not found in config"
    exit 1
fi
echo ""

# Restart PATH gateway
echo "🔄 Restarting PATH gateway..."
docker restart shannon-testnet-gateway
echo "   ✅ PATH gateway restarted"
echo ""

# Wait for gateway to start
echo "⏳ Waiting for PATH gateway to initialize (10 seconds)..."
sleep 10
echo ""

# Test PATH gateway
echo "🧪 Testing PATH gateway..."
TEST_RESULT=$(curl -s -X POST "http://localhost:3069/v1/rpc" \
  -H "Content-Type: application/json" \
  -H "Target-Service-Id: eth" \
  -H "App-Address: pokt1q6rg35u5a65ddjr9hx59xvfka8pj3kxs2d5uwd" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  --max-time 30)

if echo "$TEST_RESULT" | grep -q "result"; then
    echo "   ✅ PATH gateway is working!"
    echo "   Response: $(echo "$TEST_RESULT" | jq -r '.result // .error.message' 2>/dev/null || echo "$TEST_RESULT")"
else
    echo "   ⚠️  PATH gateway test failed"
    echo "   Response: $TEST_RESULT"
    echo ""
    echo "   Check logs: docker logs shannon-testnet-gateway --tail 20"
fi
echo ""

echo "═══════════════════════════════════════════════════════════════"
echo "  ✅ Solution 1 Implementation Complete"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "  1. Monitor PATH gateway logs: docker logs -f shannon-testnet-gateway"
echo "  2. Test via customer-rpc-gateway: curl -X POST http://localhost:4002/v1/rpc/eth ..."
echo "  3. Run load test once confirmed working"
echo ""

