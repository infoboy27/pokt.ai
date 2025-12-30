# Load Test Readiness - 10M Requests at 5K RPS

## ✅ All Optimizations Applied

### Configuration Summary

**Target Load:**
- **Total Requests**: 10,000,000
- **Request Rate**: 5,000 RPS
- **Duration**: ~33 minutes (10M / 5K RPS)
- **Multi-chain**: eth, avax, bsc, poly, opt, arb-one, base

---

## 1. Database Connection Pools ✅

### pokt-ai-web (Main Gateway)
- **Max Connections**: 200
- **Min Connections**: 20
- **Idle Timeout**: 60s
- **Connection Timeout**: 10s
- **Query Timeout**: 5s
- **Status**: ✅ Optimized for 5K RPS

### customer-rpc-gateway
- **Max Connections**: 200 (increased from 100)
- **Min Connections**: 20 (increased from 10)
- **Idle Timeout**: 60s
- **Connection Timeout**: 10s
- **Query Timeout**: 5s
- **Status**: ✅ Optimized for 5K RPS

---

## 2. Circuit Breakers ✅

### Configuration
- **Failure Threshold**: 5 consecutive failures → OPEN circuit
- **Success Threshold**: 2 consecutive successes → CLOSED circuit
- **Recovery Timeout**: 60 seconds
- **State Storage**: Redis-based
- **Status**: ✅ Enabled and working

### Benefits
- Automatically skips failing endpoints
- Auto-recovery after timeout
- Prevents cascading failures
- Reduces latency by skipping bad endpoints

---

## 3. Endpoint Configuration ✅

### RPC Provider
- **Provider**: `rpctest.pokt.ai` only
- **Format**: `https://rpctest.pokt.ai/v1/rpc/{chain}`
- **API Key**: Configured via `RPC_API_KEY` env var
- **Timeout**: 15s (optimized for routing overhead)
- **HTTP Keep-Alive**: Enabled
- **Connection Pooling**: Optimized (maxSockets: 50)

### Supported Chains
- `eth`, `avax`, `bsc`, `poly`, `opt`, `arb-one`, `base`, `linea`, `mantle`, `solana`, `sui`

---

## 4. PATH Gateway ✅

### Configuration
- **All chains**: Configured to use `rpctest.pokt.ai`
- **Read Timeout**: 60s (increased from 30s)
- **Write Timeout**: 60s (increased from 30s)
- **Idle Timeout**: 180s (increased from 120s)
- **Status**: ✅ Optimized for high throughput

---

## 5. Rate Limiting ✅

### customer-rpc-gateway
- **Window**: 1000ms (1 second)
- **Max Requests**: 10,000 per second
- **Per Endpoint**: Yes (endpoint ID + IP)
- **Status**: ✅ 2x buffer for 5K RPS target

### pokt-ai-web
- **Window**: 1000ms (1 second)
- **Max Requests**: 10,000 per second
- **Storage**: Redis-based (distributed)
- **Status**: ✅ 2x buffer for 5K RPS target

---

## 6. Caching ✅

### Redis Cache
- **Storage**: Redis-based
- **Cache Size**: 100,000+ entries
- **TTL Strategy**: Method-based (2s to 1h)
- **Status**: ✅ Enabled and optimized

---

## 7. Connection Optimizations ✅

### HTTP Keep-Alive
- **Enabled**: Yes
- **Connection Reuse**: Optimized
- **Max Sockets**: 50 per endpoint
- **Max Free Sockets**: 10

### Timeouts
- **RPC Timeout**: 15s (pokt-ai-web → customer-rpc-gateway)
- **Direct RPC Timeout**: 15s (customer-rpc-gateway → rpctest.pokt.ai)
- **Database Query Timeout**: 5s
- **Connection Timeout**: 10s

---

## Capacity Analysis

### Database Capacity
- **Max Connections**: 200 per service (400 total)
- **Queries per Request**: 2-3 queries
- **At 5K RPS**: ~10,000-15,000 queries/second
- **Per Connection**: ~50-75 queries/second
- **Status**: ✅ Sufficient capacity

### Rate Limiting Capacity
- **Configured**: 10,000 RPS per endpoint
- **Target Load**: 5,000 RPS
- **Safety Margin**: 2x buffer
- **Status**: ✅ Sufficient capacity

### Network Capacity
- **HTTP Keep-Alive**: Enabled
- **Connection Pooling**: Optimized
- **Circuit Breakers**: Enabled
- **Status**: ✅ Optimized

---

## Service Status

### Running Services
- ✅ `customer-rpc-gateway`: Running (port 4002)
- ✅ `shannon-testnet-gateway`: Running (port 3069)
- ✅ `customer-gateway-postgres`: Running (port 5433)
- ✅ `customer-gateway-redis`: Running (port 6379)
- ✅ `pokt-ai-web`: Running (via Docker Compose)

### Health Checks
```bash
# Check customer-rpc-gateway
curl http://localhost:4002/health

# Check circuit breaker status
curl http://localhost:4002/api/circuit-breaker/status?network=eth
```

---

## Load Test Execution

### Prerequisites
1. ✅ All services running and healthy
2. ✅ Database pools optimized
3. ✅ Circuit breakers enabled
4. ✅ Rate limiting configured (10K RPS)
5. ✅ Endpoints configured for rpctest.pokt.ai

### Run Load Test
```bash
cd /home/shannon/poktai

# Set test parameters
export ENDPOINT_ID="eth_1760726811471_1760726811479"
export TEST_DURATION=2000  # ~33 minutes for 10M requests at 5K RPS
export TARGET_RPS=5000
export GATEWAY_URL="https://pokt.ai"

# Run load test
./run-load-test-with-report.sh 2>&1 | tee load-test-5k-rps-$(date +%Y%m%d_%H%M%S).log
```

### Multi-Chain Load Test
```bash
# Create endpoints for multiple chains
./create-load-test-endpoints.sh

# Run load test for each chain
for chain in eth poly bsc avax arb-one opt base; do
  export ENDPOINT_ID="load_test_${chain}_..."
  export TARGET_RPS=714  # ~5K RPS / 7 chains
  ./run-load-test-with-report.sh
done
```

---

## Monitoring During Load Test

### Key Metrics to Watch
1. **Request Rate**: Should maintain ~5K RPS
2. **Success Rate**: Target >95%
3. **Response Time**: p95 < 1s
4. **Circuit Breaker Status**: Monitor endpoint health
5. **Database Connections**: Should stay < 200 per service
6. **Rate Limit Hits**: Should be minimal (<1%)

### Monitoring Commands
```bash
# Watch circuit breaker status
watch -n 2 'curl -s http://localhost:4002/api/circuit-breaker/status?network=eth | jq'

# Monitor database connections
docker exec customer-gateway-postgres psql -U gateway -d customer_gateway -c "SELECT count(*) FROM pg_stat_activity;"

# Monitor Redis
docker exec customer-gateway-redis redis-cli INFO stats

# Monitor gateway logs
docker logs -f customer-rpc-gateway | grep -E "(error|Error|429|timeout)"
```

---

## Expected Results

### Success Criteria
- ✅ **Throughput**: Maintains 5K RPS consistently
- ✅ **Success Rate**: >95% successful requests
- ✅ **Response Time**: p95 < 1s, p99 < 2s
- ✅ **Error Rate**: <5% (mostly timeouts, not failures)
- ✅ **Circuit Breakers**: Auto-recovery working
- ✅ **Database**: No connection pool exhaustion
- ✅ **Rate Limiting**: Minimal rate limit hits

### Potential Issues & Mitigations
1. **Rate Limiting**: If hit, increase limit (currently 10K RPS)
2. **Database Pool Exhaustion**: Increase max connections (currently 200)
3. **Circuit Breaker Opens**: Check rpctest.pokt.ai health
4. **Timeout Errors**: Increase RPC timeout (currently 15s)

---

## Summary

✅ **All optimizations applied and verified**
✅ **Services running and healthy**
✅ **Ready for 10M requests at 5K RPS load test**

**Next Step**: Run the load test and monitor results.
