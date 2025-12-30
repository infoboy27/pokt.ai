# rpctest.pokt.ai & PATH Gateway Investigation

## Summary

Investigation of connectivity and configuration for `rpctest.pokt.ai` and PATH gateway to determine if they can work together for the load test.

---

## Issues Found

### 🔴 Critical Issue #1: shannon-testnet-node Not Running

**Problem:**
- `shannon-testnet-node` container is **NOT running**
- PATH gateway **requires** the node for delegated mode operation
- Without the node, PATH gateway cannot:
  - Get current block height
  - Get sessions for apps
  - Initialize protocol context
  - Use fallback endpoints (even though configured)

**Evidence:**
```
Error: dial tcp: lookup shannon-testnet-node on 127.0.0.11:53: server misbehaving
Error: GetCurrentBlockHeight: error getting latest block height
Error: no available endpoints could be found for the request
```

**Impact:**
- PATH gateway returns HTTP 500 errors
- Cannot route requests even with fallback endpoints configured
- All PATH gateway requests fail

---

### 🔴 Critical Issue #2: PATH Gateway Cannot Use Fallbacks Without Node

**Problem:**
- PATH gateway is configured with fallback endpoints (`rpctest.pokt.ai`)
- But PATH gateway **must initialize** before it can use fallbacks
- Initialization requires connection to `shannon-testnet-node`
- Since node is not running, PATH gateway never initializes

**Configuration:**
```yaml
service_fallback:
  - service_id: eth
    send_all_traffic: true
    fallback_endpoints:
      - default_url: "https://rpctest.pokt.ai/v1/rpc/eth"
```

**Impact:**
- Fallback endpoints configured but unusable
- PATH gateway completely non-functional

---

### 🟡 Issue #3: rpctest.pokt.ai Timeout

**Problem:**
- `rpctest.pokt.ai` connects successfully (TLS handshake OK)
- But requests timeout after 30+ seconds
- May be:
  - Rate limiting
  - Service overloaded
  - Network/firewall issue
  - Service not responding

**Evidence:**
- Direct curl test: Timeout after 30s
- Circuit breaker: OPEN (21 failures, timeout exceeded)
- Connection established but no response

**Impact:**
- Cannot use `rpctest.pokt.ai` directly
- Circuit breaker correctly skipping it

---

## Current Architecture

```
pokt-ai-web
    ↓
customer-rpc-gateway
    ↓
    ├─→ PATH Gateway (http://shannon-testnet-gateway:3069)
    │       ↓
    │       ├─→ Needs: shannon-testnet-node (NOT RUNNING) ❌
    │       └─→ Fallback: rpctest.pokt.ai (configured but unusable)
    │
    └─→ Direct: rpctest.pokt.ai (https://rpctest.pokt.ai/v1/rpc/eth)
            ↓
            └─→ Timeout (>30s) ❌
```

---

## Solutions

### Option 1: Start shannon-testnet-node ✅ RECOMMENDED

**Steps:**
1. Start `shannon-testnet-node` container
2. PATH gateway will initialize successfully
3. PATH gateway can then use fallback endpoints (`rpctest.pokt.ai`)
4. Requests will flow: customer-rpc-gateway → PATH → rpctest.pokt.ai

**Pros:**
- PATH gateway will work as designed
- Can use fallback endpoints
- Proper delegated mode operation

**Cons:**
- Requires running the Shannon testnet node
- May need additional configuration

**Command:**
```bash
cd /home/shannon/shannon
docker compose -f docker-compose.customer-gateway.yml up -d shannon-testnet-node
```

---

### Option 2: Use rpctest.pokt.ai Directly (Bypass PATH)

**Steps:**
1. Skip PATH gateway entirely
2. Use `rpctest.pokt.ai` directly from `customer-rpc-gateway`
3. Fix `rpctest.pokt.ai` timeout issue

**Pros:**
- Simpler architecture
- No dependency on Shannon node

**Cons:**
- `rpctest.pokt.ai` is currently timing out
- Need to resolve timeout issue first
- Lose PATH gateway benefits (load balancing, etc.)

**Current Status:**
- Already configured in `customer-rpc-gateway`
- But `rpctest.pokt.ai` is timing out
- Circuit breaker is OPEN

---

### Option 3: Fix rpctest.pokt.ai Timeout

**Investigation Needed:**
1. Check if `rpctest.pokt.ai` is rate limiting
2. Verify network connectivity
3. Check firewall rules
4. Test with different API keys
5. Check service status/health

**Possible Causes:**
- Rate limiting (too many requests)
- Service overloaded
- Network latency
- Firewall blocking
- Service down/degraded

---

## Recommendations

### Immediate Action: Start shannon-testnet-node

**Why:**
- PATH gateway is designed to work with the node
- Fallback endpoints are configured but unusable without node
- This is the quickest path to getting PATH gateway working

**Steps:**
```bash
# Check if node container exists
docker ps -a | grep shannon-testnet-node

# Start the node
cd /home/shannon/shannon
docker compose -f docker-compose.customer-gateway.yml up -d shannon-testnet-node

# Wait for node to sync
docker logs -f shannon-testnet-node

# Verify PATH gateway can connect
docker logs shannon-testnet-gateway | grep -E "(block height|session)"
```

### Then: Test PATH Gateway with Fallbacks

Once node is running:
1. PATH gateway should initialize
2. Test PATH gateway directly
3. Verify fallback endpoints work
4. Test full flow: customer-rpc-gateway → PATH → rpctest.pokt.ai

### If rpctest.pokt.ai Still Times Out

1. Check service status
2. Test with lower RPS (may be rate limiting)
3. Verify API key is valid
4. Check network connectivity
5. Consider using PATH gateway's load balancing instead

---

## Testing Plan

### Phase 1: Start Node
```bash
docker compose -f docker-compose.customer-gateway.yml up -d shannon-testnet-node
```

### Phase 2: Verify PATH Gateway
```bash
# Test PATH gateway directly
curl -X POST "http://localhost:3069/v1/rpc" \
  -H "Content-Type: application/json" \
  -H "Target-Service-Id: eth" \
  -H "App-Address: pokt1rxh9slrj6wd3nvp8jf4u9g5sx83udvkrj7248d" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

### Phase 3: Test Full Flow
```bash
# Test via customer-rpc-gateway
curl -X POST "http://localhost:4002/v1/rpc/eth" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_KEY" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

### Phase 4: Load Test
Once everything works, run load test again.

---

## Conclusion

**Can we work with rpctest.pokt.ai and PATH?**

**Answer: YES, but we need to:**

1. ✅ **Start shannon-testnet-node** - Required for PATH gateway
2. ✅ **PATH gateway is configured correctly** - Fallback endpoints set
3. ⚠️ **rpctest.pokt.ai timeout needs investigation** - May be rate limiting or service issue

**Next Steps:**
1. Start `shannon-testnet-node`
2. Verify PATH gateway initializes
3. Test PATH gateway → rpctest.pokt.ai flow
4. If rpctest.pokt.ai still times out, investigate timeout cause
5. Once working, re-run load test

---

## Current Status

- ❌ `shannon-testnet-node`: NOT RUNNING
- ⚠️ PATH Gateway: Configured but non-functional (needs node)
- ⚠️ `rpctest.pokt.ai`: Timeout issue (needs investigation)
- ✅ `customer-rpc-gateway`: Configured correctly
- ✅ Circuit breakers: Working correctly

