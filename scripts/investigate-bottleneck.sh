#!/bin/bash

# Script to investigate latency bottlenecks in the gateway

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Bottleneck Investigation${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 1. Check usage logging status
echo -e "${YELLOW}1. Checking Usage Logging Configuration${NC}"
usage_disabled=false
if grep -q "DISABLE_USAGE_LOGGING=true" apps/web/.env.local 2>/dev/null; then
    echo -e "  ${RED}✗ Usage logging is DISABLED in apps/web/.env.local${NC}"
    usage_disabled=true
fi
if grep -q "DISABLE_USAGE_LOGGING.*'true'" infra/docker-compose.yml 2>/dev/null; then
    echo -e "  ${RED}✗ Usage logging is DISABLED in infra/docker-compose.yml${NC}"
    usage_disabled=true
fi
if [ "$usage_disabled" = false ]; then
    echo -e "  ${GREEN}✓ Usage logging is ENABLED${NC}"
    echo -e "  ${YELLOW}→ Note: Service may need restart to apply changes${NC}"
else
    echo -e "  ${YELLOW}→ This is why requests aren't being counted!${NC}"
    echo -e "  ${YELLOW}→ Fix: Set DISABLE_USAGE_LOGGING=false or remove it${NC}"
fi
echo ""

# 2. Check database usage records
echo -e "${YELLOW}2. Checking Database Usage Records${NC}"
if docker ps | grep -q poktai-postgres; then
    recent_usage=$(docker exec poktai-postgres psql -U pokt_ai -d pokt_ai -t -c \
        "SELECT COUNT(*) FROM usage_daily WHERE date >= CURRENT_DATE - INTERVAL '1 day';" 2>/dev/null | tr -d ' ')
    if [ "$recent_usage" -gt 0 ]; then
        echo -e "  ${GREEN}✓ Found ${recent_usage} usage records in last 24 hours${NC}"
    else
        echo -e "  ${RED}✗ No usage records found in last 24 hours${NC}"
        echo -e "  ${YELLOW}→ Usage logging may be disabled or not working${NC}"
    fi
else
    echo -e "  ${YELLOW}⚠ Database container not running - cannot check usage${NC}"
fi
echo ""

# 3. Test individual request latency breakdown
echo -e "${YELLOW}3. Testing Individual Request Latency${NC}"
ENDPOINT_ID="eth_1760726811471_1760726811479"
echo -e "  Testing endpoint: ${ENDPOINT_ID}"

# Time DNS lookup
dns_start=$(date +%s%N)
host pokt.ai > /dev/null 2>&1
dns_time=$((($(date +%s%N) - dns_start) / 1000000))

# Time full request
request_start=$(date +%s%N)
response=$(curl -s -w "\n%{time_total}\n%{time_connect}\n%{time_starttransfer}\n%{time_namelookup}" \
    -X POST "https://pokt.ai/api/gateway?endpoint=${ENDPOINT_ID}" \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' 2>&1)
request_time=$(echo "$response" | tail -1 | awk '{print $1*1000}')
connect_time=$(echo "$response" | tail -2 | head -1 | awk '{print $1*1000}')
transfer_time=$(echo "$response" | tail -3 | head -1 | awk '{print $1*1000}')
name_lookup=$(echo "$response" | tail -4 | head -1 | awk '{print $1*1000}')

echo -e "  DNS Lookup: ${name_lookup}ms"
echo -e "  Connect: ${connect_time}ms"
echo -e "  Transfer Start: ${transfer_time}ms"
echo -e "  Total Request: ${request_time}ms"
echo ""

# 4. Check PATH gateway latency
echo -e "${YELLOW}4. Testing PATH Gateway (WeaversNodes) Latency${NC}"
path_start=$(date +%s%N)
path_response=$(curl -s -w "\n%{time_total}" \
    -X POST "https://gateway.weaversnodes.org/v1" \
    -H "Content-Type: application/json" \
    -H "Target-Service-Id: eth" \
    -H "App-Address: pokt1zp90apxzym50uu6jt89p30urd69gfp7nu2u2w9" \
    -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' 2>&1)
path_time=$(echo "$path_response" | tail -1 | awk '{print $1*1000}')
echo -e "  PATH Gateway Direct: ${path_time}ms"
echo ""

# 5. Calculate overhead
echo -e "${YELLOW}5. Overhead Analysis${NC}"
echo -e "  pokt.ai Gateway: ${request_time}ms"
echo -e "  PATH Gateway Direct: ${path_time}ms"

# Use awk for floating point comparison
overhead_result=$(awk "BEGIN {
    overhead = $request_time - $path_time;
    if (overhead > 0) {
        printf \"%.0f\", overhead
    } else {
        printf \"%.0f\", -overhead
    }
}" 2>/dev/null || echo "0")

overhead_abs=$(awk "BEGIN {printf \"%.0f\", ($request_time > $path_time) ? ($request_time - $path_time) : ($path_time - $request_time)}" 2>/dev/null || echo "0")

if awk "BEGIN {exit ($request_time > $path_time) ? 0 : 1}" 2>/dev/null; then
    overhead=$overhead_result
    overhead_percent=$(awk "BEGIN {printf \"%.1f\", ($overhead/$request_time)*100}" 2>/dev/null || echo "N/A")
    echo -e "  Overhead: ${overhead}ms (${YELLOW}${overhead_percent}%${NC})"
    
    if awk "BEGIN {exit ($overhead > 1000) ? 0 : 1}" 2>/dev/null; then
        echo -e "  ${RED}⚠ High overhead detected (>1s)${NC}"
        echo -e "  ${YELLOW}→ Possible bottlenecks:${NC}"
        echo -e "    - Next.js request processing"
        echo -e "    - Database queries"
        echo -e "    - Cache lookups"
        echo -e "    - Network routing"
    else
        echo -e "  ${GREEN}✓ Overhead is reasonable (<1s)${NC}"
    fi
else
    echo -e "  ${GREEN}✓ pokt.ai Gateway is FASTER than PATH Gateway direct${NC}"
    echo -e "  ${YELLOW}→ This suggests caching or optimization is working${NC}"
    speedup=$(awk "BEGIN {printf \"%.1f\", ($path_time/$request_time)}" 2>/dev/null || echo "N/A")
    echo -e "  Speedup: ${speedup}x faster"
fi
echo ""

# 6. Check Next.js logs for slow operations
echo -e "${YELLOW}6. Checking for Slow Operations in Logs${NC}"
if docker ps | grep -q poktai-web; then
    slow_ops=$(docker logs poktai-web --tail 1000 2>&1 | grep -iE "(slow|timeout|bottleneck|latency)" | head -5)
    if [ -n "$slow_ops" ]; then
        echo -e "  ${YELLOW}Found slow operation warnings:${NC}"
        echo "$slow_ops" | sed 's/^/    /'
    else
        echo -e "  ${GREEN}✓ No slow operation warnings found${NC}"
    fi
else
    echo -e "  ${YELLOW}⚠ Next.js container not found - cannot check logs${NC}"
fi
echo ""

# 7. Recommendations
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Recommendations${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if grep -q "DISABLE_USAGE_LOGGING=true" apps/web/.env.local 2>/dev/null; then
    echo -e "${RED}1. FIX USAGE LOGGING:${NC}"
    echo -e "   ${YELLOW}Edit apps/web/.env.local:${NC}"
    echo -e "   ${GREEN}DISABLE_USAGE_LOGGING=false${NC}"
    echo ""
fi

if [ $overhead -gt 1000 ] 2>/dev/null; then
    echo -e "${YELLOW}2. INVESTIGATE HIGH OVERHEAD:${NC}"
    echo -e "   - Check Next.js request processing time"
    echo -e "   - Verify database queries are cached"
    echo -e "   - Check cache hit rates"
    echo -e "   - Monitor PATH gateway response times"
    echo ""
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Investigation Complete${NC}"
echo -e "${BLUE}========================================${NC}"

