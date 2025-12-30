# PATH Gateway Mode Limitation

## Date: November 13, 2025

---

## Discovery

Attempted to switch PATH gateway from **delegated mode** to **owned mode** to bypass the `App-Address` header parsing issue.

### Result: ❌ Failed

**Error:**
```
invalid shannon gateway mode: owned
failed to load config
```

---

## Finding

**PATH gateway only supports `delegated` mode**, not `owned` mode.

### Supported Modes:
- ✅ `delegated` - Requires `App-Address` header
- ❌ `owned` - Not supported (invalid mode)

---

## Impact

Cannot bypass the header parsing bug by switching to owned mode. Must either:

1. **Fix the delegated mode header issue** (requires PATH gateway team support)
2. **Work around with direct `rpctest.pokt.ai` calls** (current approach)
3. **Wait for PATH gateway update** that fixes header parsing or adds owned mode support

---

## Current Status

✅ **Reverted to delegated mode:**
- `gateway_mode: "delegated"`
- PATH gateway restarted and running
- System working with fallback to direct blockchain calls

---

## Next Steps

1. **Report bug to PATH gateway team:**
   - Header parsing issue in delegated mode
   - Request owned mode support or header parsing fix

2. **Continue with current approach:**
   - Use direct `rpctest.pokt.ai` calls with API key
   - Implement rate limit handling
   - Optimize fallback mechanisms

3. **Monitor PATH gateway updates:**
   - Check for new versions that fix header parsing
   - Check for owned mode support

---

## Files Modified

1. ✅ `/home/shannon/shannon/gateway/config/gateway_config.yaml`
   - Reverted: `gateway_mode: "delegated"`

---

## References

- PATH Gateway Image: `ghcr.io/buildwithgrove/path:main`
- Error: `invalid shannon gateway mode: owned`
- Previous investigation: `PATH_GATEWAY_HEADER_INVESTIGATION.md`

