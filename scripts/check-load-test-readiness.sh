#!/bin/bash
# Load Test Readiness Check Script
# This script verifies that the gateway is ready for 10M relay load testing

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "═══════════════════════════════════════════════════════════════"
echo "  Load Test Readiness Check: 10M Relays at 5K RPS"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Configuration
GATEWAY_URL="${GATEWAY_URL:-http://localhost:4000}"
ENDPOINT_ID="${ENDPOINT_ID:-endpoint-1}"
TARGET_RPS=5000
TOTAL_RELAYS=10000000
DURATION_SECONDS=$((TOTAL_RELAYS / TARGET_RPS)) # ~33 minutes

# Track readiness status
READY=true
ISSUES=0
WARNINGS=0

# Function to check status
check_status() {
    local name=$1
    local status=$2
    local message=$3
    
    if [ "$status" = "true" ]; then
        echo -e "${GREEN}✓${NC} $name: $message"
    elif [ "$status" = "warning" ]; then
        echo -e "${YELLOW}⚠${NC} $name: $message"
        WARNINGS=$((WARNINGS + 1))
    else
        echo -e "${RED}✗${NC} $name: $message"
        READY=false
        ISSUES=$((ISSUES + 1))
    fi
}

# 1. Check Redis
echo "1. Checking Redis..."
if docker ps --filter "name=redis" --format "{{.Names}}" | grep -q redis; then
    REDIS_CONTAINER=$(docker ps --filter "name=redis" --format "{{.Names}}" | head -1)
    REDIS_STATUS=$(docker inspect --format='{{.State.Health.Status}}' "$REDIS_CONTAINER" 2>/dev/null || echo "unknown")
    
    if [ "$REDIS_STATUS" = "healthy" ]; then
        check_status "Redis" "true" "Running and healthy ($REDIS_CONTAINER)"
        
        # Check Redis memory
        REDIS_MEMORY=$(docker exec "$REDIS_CONTAINER" redis-cli INFO memory 2>/dev/null | grep "used_memory_human" | cut -d: -f2 | tr -d '\r' || echo "unknown")
        if [ "$REDIS_MEMORY" != "unknown" ]; then
            echo "   Memory usage: $REDIS_MEMORY"
        fi
    else
        check_status "Redis" "warning" "Running but status unknown ($REDIS_CONTAINER)"
    fi
else
    check_status "Redis" "false" "Not found - Please ensure Redis is running"
fi

# 2. Check PostgreSQL
echo ""
echo "2. Checking PostgreSQL..."
if docker ps --filter "name=postgres" --format "{{.Names}}" | grep -q postgres; then
    POSTGRES_CONTAINER=$(docker ps --filter "name=postgres" --format "{{.Names}}" | head -1)
    POSTGRES_STATUS=$(docker inspect --format='{{.State.Health.Status}}' "$POSTGRES_CONTAINER" 2>/dev/null || echo "unknown")
    
    if [ "$POSTGRES_STATUS" = "healthy" ]; then
        check_status "PostgreSQL" "true" "Running and healthy ($POSTGRES_CONTAINER)"
    else
        check_status "PostgreSQL" "warning" "Running but status unknown ($POSTGRES_CONTAINER)"
    fi
else
    check_status "PostgreSQL" "false" "Not found - Please ensure PostgreSQL is running"
fi

# 3. Check Gateway URL
echo ""
echo "3. Checking Gateway URL..."
if curl -s -f -o /dev/null -w "%{http_code}" "$GATEWAY_URL/api/gateway?endpoint=$ENDPOINT_ID" -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' | grep -q "200\|404\|400"; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$GATEWAY_URL/api/gateway?endpoint=$ENDPOINT_ID" -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}')
    
    if [ "$HTTP_CODE" = "200" ]; then
        check_status "Gateway URL" "true" "Accessible ($GATEWAY_URL) - HTTP $HTTP_CODE"
    elif [ "$HTTP_CODE" = "404" ]; then
        check_status "Gateway URL" "warning" "Accessible but endpoint not found ($ENDPOINT_ID) - HTTP $HTTP_CODE"
    else
        check_status "Gateway URL" "warning" "Accessible but returned HTTP $HTTP_CODE"
    fi
else
    check_status "Gateway URL" "false" "Not accessible ($GATEWAY_URL)"
fi

# 4. Check Endpoint ID
echo ""
echo "4. Checking Endpoint ID..."
TEST_RESPONSE=$(curl -s -X POST "$GATEWAY_URL/api/gateway?endpoint=$ENDPOINT_ID" \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' 2>/dev/null || echo "ERROR")

if echo "$TEST_RESPONSE" | grep -q "jsonrpc.*2.0"; then
    if echo "$TEST_RESPONSE" | grep -q '"error"'; then
        ERROR_MSG=$(echo "$TEST_RESPONSE" | grep -o '"message":"[^"]*"' | cut -d'"' -f4)
        check_status "Endpoint ID" "warning" "Endpoint exists but returned error: $ERROR_MSG"
    else
        check_status "Endpoint ID" "true" "Valid and accessible ($ENDPOINT_ID)"
    fi
else
    check_status "Endpoint ID" "false" "Invalid or not accessible ($ENDPOINT_ID)"
fi

# 5. Check Environment Variables
echo ""
echo "5. Checking Environment Variables..."
if [ -f "apps/web/.env" ] || [ -f ".env" ]; then
    ENV_FILE="apps/web/.env"
    if [ ! -f "$ENV_FILE" ]; then
        ENV_FILE=".env"
    fi
    
    if grep -q "REDIS_URL" "$ENV_FILE" 2>/dev/null; then
        check_status "REDIS_URL" "true" "Configured in $ENV_FILE"
    else
        check_status "REDIS_URL" "warning" "Not found in $ENV_FILE (may be set via Docker)"
    fi
    
    if grep -q "DATABASE_URL" "$ENV_FILE" 2>/dev/null; then
        check_status "DATABASE_URL" "true" "Configured in $ENV_FILE"
    else
        check_status "DATABASE_URL" "warning" "Not found in $ENV_FILE (may be set via Docker)"
    fi
else
    check_status "Environment File" "warning" "Not found (may be set via Docker)"
fi

# 6. Check Rate Limiting Configuration
echo ""
echo "6. Checking Rate Limiting Configuration..."
if [ -f "apps/web/lib/rate-limit.ts" ]; then
    if grep -q "maxRequests: 10000" apps/web/lib/rate-limit.ts; then
        check_status "Rate Limiting" "true" "Configured: 10,000 req/sec (2x buffer for 5K RPS)"
    else
        RATE_LIMIT=$(grep -o "maxRequests: [0-9]*" apps/web/lib/rate-limit.ts | head -1 | awk '{print $2}' || echo "unknown")
        if [ "$RATE_LIMIT" != "unknown" ] && [ "$RATE_LIMIT" -ge 5000 ]; then
            check_status "Rate Limiting" "true" "Configured: $RATE_LIMIT req/sec (sufficient for 5K RPS)"
        else
            check_status "Rate Limiting" "warning" "Configured: $RATE_LIMIT req/sec (may not be sufficient for 5K RPS)"
        fi
    fi
else
    check_status "Rate Limiting" "warning" "Configuration file not found"
fi

# 7. Check Database Pool Configuration
echo ""
echo "7. Checking Database Pool Configuration..."
if [ -f "apps/web/lib/database.ts" ]; then
    if grep -q "max: parseInt(process.env.DB_POOL_MAX || '100')" apps/web/lib/database.ts; then
        check_status "Database Pool" "true" "Configured: 100 connections (default)"
    else
        POOL_MAX=$(grep -o "max: [0-9]*" apps/web/lib/database.ts | head -1 | awk '{print $2}' || echo "unknown")
        if [ "$POOL_MAX" != "unknown" ] && [ "$POOL_MAX" -ge 50 ]; then
            check_status "Database Pool" "true" "Configured: $POOL_MAX connections (sufficient)"
        else
            check_status "Database Pool" "warning" "Configured: $POOL_MAX connections (may not be sufficient)"
        fi
    fi
else
    check_status "Database Pool" "warning" "Configuration file not found"
fi

# 8. Check Cache Configuration
echo ""
echo "8. Checking Cache Configuration..."
if [ -f "apps/web/lib/cache.ts" ]; then
    if grep -q "new ResponseCache(100000)" apps/web/lib/cache.ts; then
        check_status "Cache" "true" "Configured: 100,000 entries"
    else
        CACHE_SIZE=$(grep -o "new ResponseCache([0-9]*)" apps/web/lib/cache.ts | head -1 | grep -o "[0-9]*" || echo "unknown")
        if [ "$CACHE_SIZE" != "unknown" ] && [ "$CACHE_SIZE" -ge 10000 ]; then
            check_status "Cache" "true" "Configured: $CACHE_SIZE entries (sufficient)"
        else
            check_status "Cache" "warning" "Configured: $CACHE_SIZE entries (may not be sufficient)"
        fi
    fi
else
    check_status "Cache" "warning" "Configuration file not found"
fi

# 9. Check Usage Logging Optimization
echo ""
echo "9. Checking Usage Logging Optimization..."
if [ -f "apps/web/lib/database.ts" ]; then
    if grep -q "ON CONFLICT (endpoint_id, date)" apps/web/lib/database.ts; then
        check_status "Usage Logging" "true" "Optimized: UPSERT implemented (eliminates lock contention)"
    else
        check_status "Usage Logging" "warning" "Not optimized: Using SELECT + UPDATE/INSERT (may cause lock contention)"
    fi
else
    check_status "Usage Logging" "warning" "Configuration file not found"
fi

# 10. Check k6 Installation
echo ""
echo "10. Checking k6 Installation..."
if command -v k6 &> /dev/null; then
    K6_VERSION=$(k6 version | head -1 | awk '{print $2}' || echo "unknown")
    check_status "k6" "true" "Installed: $K6_VERSION"
else
    check_status "k6" "warning" "Not installed - Install with: curl https://github.com/grafana/k6/releases/download/v0.47.0/k6-v0.47.0-linux-amd64.tar.gz -L | tar xvz && sudo mv k6-v0.47.0-linux-amd64/k6 /usr/local/bin/"
fi

# Summary
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  Readiness Check Summary"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Configuration:"
echo "  Gateway URL: $GATEWAY_URL"
echo "  Endpoint ID: $ENDPOINT_ID"
echo "  Target RPS: $TARGET_RPS"
echo "  Total Relays: $TOTAL_RELAYS"
echo "  Duration: $DURATION_SECONDS seconds (~$((DURATION_SECONDS / 60)) minutes)"
echo ""
echo "Status:"
if [ "$READY" = "true" ]; then
    echo -e "${GREEN}✓ READY${NC} - Gateway is ready for load testing"
    if [ "$WARNINGS" -gt 0 ]; then
        echo -e "${YELLOW}⚠ WARNINGS: $WARNINGS${NC} - Review warnings above"
    fi
    echo ""
    echo "Next Steps:"
    echo "  1. Run load test: k6 run load-test-10m-relays.js"
    echo "  2. Monitor metrics during load test"
    echo "  3. Verify success criteria are met"
    exit 0
else
    echo -e "${RED}✗ NOT READY${NC} - $ISSUES issue(s) found, $WARNINGS warning(s)"
    echo ""
    echo "Please fix the issues above before running the load test"
    exit 1
fi

