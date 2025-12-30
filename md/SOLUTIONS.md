# Solutions for PATH Gateway & rpctest.pokt.ai Issues

## Current Status

✅ **Working:**
- Node: Running & synced
- PATH gateway: Getting sessions successfully
- App found: `pokt1q6rg35u5a65ddjr9hx59xvfka8pj3kxs2d5uwd`
- Delegation: Working perfectly
- 50 protocol endpoints available

⚠️ **Issues:**
- PATH gateway can't sign protocol relays (needs app private key)
- rpctest.pokt.ai timing out (likely rate-limited)

---

## Solution 1: Use PATH Gateway Protocol Endpoints ⭐ RECOMMENDED

### Overview
PATH gateway found **50 protocol endpoints** that are available. These are likely more reliable than rpctest.pokt.ai. We just need the app's private key to sign relay requests.

### Steps

1. **Get App Private Key**
   - Private key for app: `pokt1q6rg35u5a65ddjr9hx59xvfka8pj3kxs2d5uwd`
   - This is the private key that corresponds to the app address

2. **Update gateway_config.yaml**
   ```yaml
   gateway_config:
     gateway_mode: "delegated"
     gateway_address: "pokt12uyvsdt8x5q00zk0vtqceym9x2nxgcjtqe3tvx"
     gateway_private_key_hex: "d8792230b030c8483e7d2045f6773c61148df89161a3b818ee9999bed6b75e65"
     owned_apps_private_keys_hex:
       - "<app_private_key_hex_here>"  # Add this
   ```

3. **Restart PATH Gateway**
   ```bash
   docker restart shannon-testnet-gateway
   ```

4. **Test**
   ```bash
   curl -X POST "http://localhost:3069/v1/rpc" \
     -H "Content-Type: application/json" \
     -H "Target-Service-Id: eth" \
     -H "App-Address: pokt1q6rg35u5a65ddjr9hx59xvfka8pj3kxs2d5uwd" \
     -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
   ```

### Benefits
- ✅ Use 50 protocol endpoints directly
- ✅ Bypass rpctest.pokt.ai entirely
- ✅ More reliable (distributed endpoints)
- ✅ No rate limiting issues
- ✅ Better performance

### Requirements
- Need app private key (hex format)

---

## Solution 2: Wait for rpctest.pokt.ai Rate Limit Reset

### Overview
If rpctest.pokt.ai is rate-limited, wait for the rate limit window to reset.

### Steps

1. **Monitor Circuit Breaker**
   ```bash
   # Check circuit breaker status
   curl -s http://localhost:4002/api/circuit-breaker/status?network=eth | jq
   
   # Watch for circuit breaker to close
   watch -n 10 'curl -s http://localhost:4002/api/circuit-breaker/status?network=eth | jq ".endpoints[0].state"'
   ```

2. **Test Periodically**
   ```bash
   # Test with low request rate
   curl -X POST "https://rpctest.pokt.ai/v1/rpc/eth" \
     -H "Content-Type: application/json" \
     -H "X-API-Key: d1d88d946f38cd9c37535be03a7772cbac20d8313ade5190618beaa8dad6e80f" \
     -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
     --max-time 10
   ```

3. **Once Circuit Breaker Closes**
   - PATH gateway fallback will work
   - Full flow will be operational

### Timeline
- Rate limits typically reset: 1 hour, 24 hours, or monthly
- Monitor circuit breaker to know when it resets

### Benefits
- ✅ No configuration changes needed
- ✅ Uses existing fallback setup
- ✅ Simple solution

### Drawbacks
- ⏳ Requires waiting
- ⚠️ May hit rate limits again under load

---

## Solution 3: Configure PATH Gateway to Skip Protocol Endpoints

### Overview
Force PATH gateway to use fallback endpoints only, skipping protocol endpoints entirely.

### Current Config
```yaml
service_fallback:
  - service_id: eth
    send_all_traffic: true  # Should send all traffic to fallback
    fallback_endpoints:
      - default_url: "https://rpctest.pokt.ai/v1/rpc/eth"
```

### Issue
PATH gateway is still trying protocol endpoints first, even with `send_all_traffic: true`.

### Possible Solutions

**Option A: Check PATH Gateway Documentation**
- Verify `send_all_traffic: true` behavior
- May need different configuration format
- May need PATH gateway version update

**Option B: Disable Protocol Endpoints**
- Remove or comment out protocol endpoint configuration
- Force PATH gateway to use fallbacks only

**Option C: Contact PATH Gateway Support**
- May be a bug in PATH gateway
- Or configuration misunderstanding

### Benefits
- ✅ Uses fallback endpoints (rpctest.pokt.ai)
- ✅ No app private key needed

### Drawbacks
- ⚠️ Depends on rpctest.pokt.ai availability
- ⚠️ May still hit rate limits

---

## Solution 4: Use Different API Key for rpctest.pokt.ai

### Overview
If current API key is rate-limited, try a different API key.

### Steps

1. **Get New API Key**
   - Generate or obtain new API key for rpctest.pokt.ai
   - Ensure it has sufficient rate limits

2. **Update Configuration**
   ```bash
   # Update docker-compose.customer-gateway.yml
   RPC_API_KEY=<new_api_key>
   ```

3. **Restart Services**
   ```bash
   docker compose -f docker-compose.customer-gateway.yml restart customer-gateway
   ```

4. **Reset Circuit Breaker**
   ```bash
   # Clear circuit breaker state in Redis
   docker exec customer-gateway-redis redis-cli DEL "circuit:https://rpctest.pokt.ai/v1/rpc/eth"
   ```

5. **Test**
   ```bash
   curl -X POST "https://rpctest.pokt.ai/v1/rpc/eth" \
     -H "Content-Type: application/json" \
     -H "X-API-Key: <new_api_key>" \
     -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
   ```

### Benefits
- ✅ May bypass rate limits
- ✅ Quick solution if new key available

### Drawbacks
- ⚠️ Requires new API key
- ⚠️ May hit rate limits again

---

## Solution 5: Hybrid Approach - Protocol + Fallback

### Overview
Use protocol endpoints when available, fallback to rpctest.pokt.ai when protocol endpoints fail.

### Configuration

1. **Add App Private Key** (for protocol endpoints)
2. **Keep Fallback Config** (for backup)
3. **PATH Gateway Will:**
   - Try protocol endpoints first (with signing)
   - Fallback to rpctest.pokt.ai if protocol fails
   - Best of both worlds

### Benefits
- ✅ Primary: Protocol endpoints (50 available, reliable)
- ✅ Fallback: rpctest.pokt.ai (backup)
- ✅ Redundancy and reliability

### Requirements
- Need app private key

---

## Recommended Solution

### ⭐ **Solution 1: Use PATH Gateway Protocol Endpoints**

**Why:**
- PATH gateway already found 50 protocol endpoints
- More reliable than single fallback endpoint
- No rate limiting issues
- Better performance and distribution

**Requirements:**
- App private key for `pokt1q6rg35u5a65ddjr9hx59xvfka8pj3kxs2d5uwd`

**Steps:**
1. Get app private key
2. Add to `gateway_config.yaml`
3. Restart PATH gateway
4. Test - should work immediately

---

## Quick Implementation Guide

### If You Have App Private Key:

```bash
# 1. Edit gateway config
nano /home/shannon/shannon/gateway/config/gateway_config.yaml

# 2. Add private key under owned_apps_private_keys_hex:
#    owned_apps_private_keys_hex:
#      - "<your_app_private_key_hex>"

# 3. Restart PATH gateway
docker restart shannon-testnet-gateway

# 4. Wait 10 seconds, then test
curl -X POST "http://localhost:3069/v1/rpc" \
  -H "Content-Type: application/json" \
  -H "Target-Service-Id: eth" \
  -H "App-Address: pokt1q6rg35u5a65ddjr9hx59xvfka8pj3kxs2d5uwd" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

### If You Don't Have App Private Key:

```bash
# Option 1: Wait for rate limit reset
# Monitor circuit breaker
watch -n 30 'curl -s http://localhost:4002/api/circuit-breaker/status?network=eth | jq ".endpoints[0].state"'

# Option 2: Try different API key
# Update RPC_API_KEY in docker-compose.customer-gateway.yml
# Restart customer-gateway
```

---

## Testing After Solution

Once solution is applied:

```bash
# 1. Test PATH gateway directly
curl -X POST "http://localhost:3069/v1/rpc" \
  -H "Content-Type: application/json" \
  -H "Target-Service-Id: eth" \
  -H "App-Address: pokt1q6rg35u5a65ddjr9hx59xvfka8pj3kxs2d5uwd" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# 2. Test via customer-rpc-gateway
curl -X POST "http://localhost:4002/v1/rpc/eth" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: d1d88d946f38cd9c37535be03a7772cbac20d8313ade5190618beaa8dad6e80f" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# 3. Test via pokt.ai gateway
curl -X POST "https://pokt.ai/api/gateway?endpoint=eth_1760726811471_1760726811479" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

---

## Summary

**Best Solution:** Use PATH Gateway Protocol Endpoints (Solution 1)
- Most reliable
- 50 endpoints available
- No rate limiting
- Requires app private key

**Alternative:** Wait for rpctest.pokt.ai rate limit reset (Solution 2)
- No configuration changes
- Simple solution
- Requires waiting

**Question:** Do you have the private key for app `pokt1q6rg35u5a65ddjr9hx59xvfka8pj3kxs2d5uwd`?

If yes → Implement Solution 1  
If no → Implement Solution 2 (wait) or Solution 4 (new API key)

