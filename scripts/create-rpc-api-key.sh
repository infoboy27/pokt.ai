#!/bin/bash
# Create API Key for rpctest.pokt.ai / rpc.pokt.ai (customer-rpc-gateway)

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "═══════════════════════════════════════════════════════════════"
echo "  Create API Key for rpctest.pokt.ai"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Generate a secure API key
API_KEY=$(node -e "const crypto = require('crypto'); console.log(crypto.randomBytes(32).toString('hex'));")

echo "Generated API Key: ${API_KEY}"
echo ""

# Register the API key
echo "Registering API key..."
RESPONSE=$(curl -s -X POST "http://localhost:4002/api/admin/register-key" \
  -H "Content-Type: application/json" \
  -d "{
    \"api_key\": \"${API_KEY}\",
    \"customer_id\": \"fcaab9be-a74f-46ef-b426-3d49c901894c\",
    \"name\": \"pokt-ai-gateway-key\",
    \"rate_limit\": 10000
  }")

echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# Check if registration was successful
if echo "$RESPONSE" | grep -q "error"; then
  echo -e "${YELLOW}⚠️  Registration failed. The key might already exist.${NC}"
  echo ""
  echo "To use an existing key, check the database:"
  echo "  docker exec customer-gateway-postgres psql -U gateway -d customer_gateway -c \"SELECT id, name FROM api_keys WHERE is_active = true;\""
else
  echo -e "${GREEN}✅ API Key registered successfully!${NC}"
  echo ""
  echo "═══════════════════════════════════════════════════════════════"
  echo "  Use this API key:"
  echo "═══════════════════════════════════════════════════════════════"
  echo ""
  echo "export RPC_API_KEY=${API_KEY}"
  echo ""
  echo "Or add to docker run command:"
  echo "  docker run -e RPC_API_KEY=${API_KEY} ... poktai-web:latest"
  echo ""
  echo "Or add to docker-compose.yml:"
  echo "  environment:"
  echo "    - RPC_API_KEY=${API_KEY}"
  echo ""
fi

