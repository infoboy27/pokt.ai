# PATH Gateway Investigation Summary - November 18, 2025

## ✅ What's Working

1. **Node Fixed**: `shannon-testnet-node` upgraded to v0.1.30 ✅
2. **PATH Gateway Running**: Connected to node successfully ✅
3. **Headers Working**: PATH Gateway receives `App-Address` and `Target-Service-Id` headers ✅
4. **Sessions Found**: PATH Gateway finds sessions and endpoints for the app ✅

## ❌ Current Issues

### Issue 1: Signing Error in Delegated Mode

**Problem**: PATH Gateway is trying to sign relay requests even in delegated mode

**Error**:
```
SignRequest: error signing relay request: Sign: error signing using the ring of application 
with address pokt1q6rg35u5a65ddjr9hx59xvfka8pj3kxs2d5uwd: 
failed to find given key in public key set
```

**Root Cause**:
- PATH Gateway requires signing for protocol endpoints (Pocket Network native relays)
- In delegated mode, PATH Gateway doesn't have the app's private key
- PATH Gateway tries to sign with the app address from the header, but can't find the key

**Attempted Fix**:
- Removed `owned_apps_private_keys_hex` from config (delegated mode shouldn't need it)
- Still getting signing error

**Why This Happens**:
- PATH Gateway uses protocol endpoints (Pocket Network relay miners)
- Protocol endpoints require signed relay requests
- In delegated mode, PATH Gateway doesn't have the app's private key to sign
- This is a fundamental limitation of delegated mode with protocol endpoints

### Issue 2: Fallback Endpoints Not Working

**Problem**: Fallback endpoints are configured but not being used

**Configuration**:
```yaml
service_fallback:
  - service_id: eth
    send_all_traffic: false
    fallback_endpoints:
      - default_url: "https://rpctest.pokt.ai/v1/rpc/eth"
```

**Error**: `"no fallback endpoints available"`

**Why Fallback Doesn't Work**:
1. PATH Gateway tries protocol endpoints first
2. Protocol endpoints fail due to signing error
3. PATH Gateway should fallback to `rpctest.pokt.ai`
4. But PATH Gateway says "no fallback endpoints available"
5. This suggests fallback endpoints aren't being loaded/parsed correctly

**Possible Causes**:
- Fallback endpoints may only work when protocol endpoints are completely unavailable (not just failing)
- PATH Gateway may need `send_all_traffic: true` to use fallbacks
- Fallback endpoints may require different configuration format
- PATH Gateway version may have a bug with fallback endpoints

## Current Behavior

### Request Flow:
```
Request → PATH Gateway
    ↓
1. Receives headers ✅ (App-Address, Target-Service-Id)
2. Finds sessions ✅ (session 8325, 50 endpoints)
3. Selects protocol endpoint ✅
4. Tries to sign relay request ❌ (fails - no private key)
5. Should fallback to rpctest.pokt.ai ❌ (fallback not found)
6. Returns error ❌
```

### Error Response:
```json
{
  "error": "no protocol endpoint responses",
  "msg": "no-op qos service error: no responses received from any service endpoints"
}
```

## Solutions

### Option 1: Use Direct Endpoints (Current Workaround) ✅

**Status**: Working

**Flow**:
```
customer-rpc-gateway → PATH Gateway (fails) → Direct blockchain endpoints (works)
```

**Pros**:
- ✅ Works reliably
- ✅ No PATH Gateway dependency
- ✅ Handles 5K RPS via public RPC providers
- ✅ Ready for load testing

**Cons**:
- ⚠️ Doesn't use PATH Gateway benefits (load balancing, protocol endpoints)
- ⚠️ May hit rate limits on public RPC providers

### Option 2: Fix PATH Gateway Signing (Requires PATH Gateway Team)

**Problem**: PATH Gateway shouldn't require signing in delegated mode for protocol endpoints

**Possible Solutions**:
1. PATH Gateway bug fix - delegated mode shouldn't require app private key
2. Use owned mode (but PATH Gateway doesn't support it per docs)
3. Get app's private key and configure it (security risk, defeats delegated mode purpose)

**Status**: Requires PATH Gateway team support

### Option 3: Fix Fallback Endpoints

**Possible Solutions**:
1. Set `send_all_traffic: true` (may bypass protocol endpoints entirely)
2. Check PATH Gateway config schema for correct fallback format
3. Update PATH Gateway version (may have fallback bug fix)
4. Use different fallback endpoint format

**Status**: Needs investigation

### Option 4: Use PATH Gateway Without Protocol Endpoints

**Idea**: Configure PATH Gateway to skip protocol endpoints and use fallbacks only

**Challenge**: PATH Gateway may require protocol endpoints to initialize

**Status**: Untested

## Recommendations

### For Immediate Load Testing:
✅ **Use Option 1** - Direct endpoints via customer-rpc-gateway
- System is working
- Can handle load testing
- PATH Gateway integration can be fixed later

### For PATH Gateway Integration:
1. **Report Issues to PATH Gateway Team**:
   - Signing error in delegated mode
   - Fallback endpoints not working
   - Request documentation on delegated mode requirements

2. **Investigate Fallback Configuration**:
   - Try `send_all_traffic: true`
   - Check PATH Gateway config schema
   - Test with different fallback endpoint formats

3. **Consider Alternative Architecture**:
   - Use PATH Gateway only for load balancing (if it supports it)
   - Use direct endpoints for actual relay requests
   - Or wait for PATH Gateway fixes

## Summary

**Good News**:
- ✅ Node is fixed
- ✅ PATH Gateway is running
- ✅ Headers are working
- ✅ System works via direct endpoints

**Remaining Issues**:
- ❌ PATH Gateway signing error (delegated mode limitation)
- ❌ Fallback endpoints not working

**Current Status**: System is functional for load testing via direct endpoints. PATH Gateway integration needs PATH Gateway team support or configuration changes.

