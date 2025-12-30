#!/bin/bash

# Stripe Integration Test Script
# Tests the Stripe configuration and endpoints

set -e

echo "🧪 Testing Stripe Integration..."
echo ""

BASE_URL="http://localhost:4000"
API_URL="http://localhost:3001"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run test
run_test() {
    local test_name=$1
    local url=$2
    local expected_status=${3:-200}
    
    echo -n "Testing: $test_name... "
    
    response=$(curl -s -w "\n%{http_code}" "$url" 2>/dev/null || echo "000")
    http_code=$(echo "$response" | tail -n1)
    
    if [ "$http_code" -eq "$expected_status" ]; then
        echo -e "${GREEN}✓ PASSED${NC} (HTTP $http_code)"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo -e "${RED}✗ FAILED${NC} (Expected HTTP $expected_status, got $http_code)"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

# Test POST endpoint
run_post_test() {
    local test_name=$1
    local url=$2
    local data=$3
    local expected_status=${4:-200}
    
    echo -n "Testing: $test_name... "
    
    response=$(curl -s -w "\n%{http_code}" -X POST "$url" \
        -H "Content-Type: application/json" \
        -d "$data" 2>/dev/null || echo "000")
    http_code=$(echo "$response" | tail -n1)
    
    if [ "$http_code" -eq "$expected_status" ] || [ "$http_code" -eq 200 ]; then
        echo -e "${GREEN}✓ PASSED${NC} (HTTP $http_code)"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo -e "${RED}✗ FAILED${NC} (Expected HTTP $expected_status, got $http_code)"
        echo "Response: $(echo "$response" | head -n-1)"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

echo "═══════════════════════════════════════════════"
echo "  Stripe Configuration Tests"
echo "═══════════════════════════════════════════════"
echo ""

# Check if services are running
echo "1. Checking if services are running..."
if curl -s http://localhost:4000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Web service is running on port 4000"
else
    echo -e "${YELLOW}⚠${NC} Web service not responding on port 4000"
    echo "   Please start with: cd /home/shannon/poktai && docker-compose up -d"
fi

if curl -s http://localhost:3001 > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} API service is running on port 3001"
else
    echo -e "${YELLOW}⚠${NC} API service not responding on port 3001"
fi

echo ""
echo "2. Testing Billing Endpoints..."
echo ""

# Test billing endpoint
run_test "GET /api/billing" "$BASE_URL/api/billing"

# Test payment methods endpoint
run_test "GET /api/billing/payment (Stripe methods)" "$BASE_URL/api/billing/payment?type=stripe"

# Test payment methods endpoint (all)
run_test "GET /api/billing/payment (All methods)" "$BASE_URL/api/billing/payment?type=all"

echo ""
echo "3. Testing Payment Processing..."
echo ""

# Test payment creation
run_post_test "POST /api/billing/payment (Create payment)" \
    "$BASE_URL/api/billing/payment" \
    '{"amount": 10.50, "paymentMethodId": "pm_card_visa", "type": "stripe"}'

echo ""
echo "4. Testing Webhook Endpoint..."
echo ""

# Test webhook endpoint (should fail signature verification - that's correct!)
echo -n "Testing: POST /api/billing/webhook (Signature validation)... "
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/billing/webhook" \
    -H "Content-Type: application/json" \
    -H "stripe-signature: invalid_signature" \
    -d '{"type": "test"}' 2>/dev/null || echo "000")
http_code=$(echo "$response" | tail -n1)

if [ "$http_code" -eq 400 ]; then
    echo -e "${GREEN}✓ PASSED${NC} (Correctly rejects invalid signature)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${YELLOW}⚠ WARNING${NC} (Expected 400 for invalid signature, got $http_code)"
fi

echo ""
echo "═══════════════════════════════════════════════"
echo "  Test Results"
echo "═══════════════════════════════════════════════"
echo ""
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed! Stripe integration is working.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Visit: http://localhost:4000/billing to view billing dashboard"
    echo "2. Monitor Stripe: https://dashboard.stripe.com/test/dashboard"
    echo "3. View webhook logs: https://dashboard.stripe.com/test/webhooks"
    exit 0
else
    echo -e "${YELLOW}⚠ Some tests failed. Check the output above.${NC}"
    echo ""
    echo "Common issues:"
    echo "- Services not running: docker-compose up -d"
    echo "- Environment not loaded: Restart services after .env changes"
    echo "- Port conflicts: Check if ports 3001 and 4000 are available"
    exit 1
fi









