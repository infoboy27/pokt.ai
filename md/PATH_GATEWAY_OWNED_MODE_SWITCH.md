# PATH Gateway Owned Apps Mode Switch

## Date: November 13, 2025

---

## Problem

PATH gateway in **delegated mode** was not finding the `App-Address` header, causing:
- PATH gateway usage: 0.02% (should be > 50%)
- Error: `"getAppAddrFromHTTPReq: no HTTP headers supplied"`
- System falling back to direct `rpctest.pokt.ai` calls
- Rate limit errors (99% of failures)

---

## Solution: Switch to Owned Apps Mode

**Owned apps mode** doesn't require the `App-Address` header because it uses configured app private keys directly.

### Benefits:
- ✅ No `App-Address` header required
- ✅ Bypasses header parsing bug
- ✅ Uses configured app private key (`owned_apps_private_keys_hex`)
- ✅ Simpler request flow

---

## Changes Applied

### 1. PATH Gateway Configuration

**File:** `/home/shannon/shannon/gateway/config/gateway_config.yaml`

**Change:**
```yaml
# Before
gateway_mode: "delegated"

# After
gateway_mode: "owned"
```

**Configuration Already Present:**
- ✅ `owned_apps_private_keys_hex` configured with app private key
- ✅ App address: `pokt1q6rg35u5a65ddjr9hx59xvfka8pj3kxs2d5uwd`
- ✅ Gateway address: `pokt12uyvsdt8x5q00zk0vtqceym9x2nxgcjtqe3tvx`

---

## How Owned Apps Mode Works

1. **PATH Gateway:**
   - Uses app private key from `owned_apps_private_keys_hex` config
   - Signs protocol relay requests with the app's private key
   - No need for `App-Address` header in requests

2. **Customer-RPC-Gateway:**
   - Can still send `App-Address` header (for compatibility)
   - But PATH gateway will ignore it in owned mode
   - Only `Target-Service-Id` header is required

3. **Request Flow:**
   ```
   customer-rpc-gateway → PATH Gateway (owned mode)
   ├─ Target-Service-Id: eth ✅
   └─ App-Address: (optional, ignored in owned mode)
   ```

---

## Testing

### Test 1: Direct PATH Gateway (No App-Address Header)
```bash
curl -X POST "http://localhost:3069/v1/rpc" \
  -H "Content-Type: application/json" \
  -H "Target-Service-Id: eth" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

**Expected:** ✅ Success (no header parsing error)

### Test 2: Customer-RPC-Gateway → PATH Gateway
```bash
curl -X POST "http://localhost:4002/v1/rpc/eth" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: ..." \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

**Expected:** ✅ Success via PATH gateway

---

## Status

✅ **PATH Gateway switched to owned apps mode**

**Next Steps:**
1. Verify PATH gateway is working correctly
2. Run validation load test
3. Monitor PATH gateway usage (should increase from 0.02%)

---

## Notes

- **Owned Apps Mode:** PATH gateway uses configured app private keys
- **No Header Required:** `App-Address` header not needed (but can still be sent)
- **App Private Key:** Already configured in `gateway_config.yaml`
- **Gateway Address:** Still required for gateway identification

---

## Files Modified

1. ✅ `/home/shannon/shannon/gateway/config/gateway_config.yaml`
   - Changed `gateway_mode: "delegated"` → `"owned"`

---

## Containers Restarted

1. ✅ `shannon-testnet-gateway` (PATH gateway)

---

## Expected Improvements

After switching to owned apps mode:
- **PATH Gateway Usage:** 0.02% → **> 50%** (target)
- **Success Rate:** 0.21% → **> 50%** (target: > 95%)
- **Error Rate:** 99.79% → **< 50%** (target: < 5%)
- **Rate Limit Errors:** Should decrease significantly

---

## Verification

Check PATH gateway logs for:
- ✅ No "no HTTP headers supplied" errors
- ✅ Protocol endpoint usage
- ✅ Session availability
- ✅ Successful relay requests

---

## Rollback

If owned apps mode doesn't work, revert to delegated mode:
```yaml
gateway_mode: "delegated"
```

But this will bring back the header parsing issue.

