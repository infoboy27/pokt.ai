# PATH Gateway Fallback Endpoint Test Results

## Test: Setting `send_all_traffic: true`

### Configuration Change
Changed all services from `send_all_traffic: false` to `send_all_traffic: true` to force use of fallback endpoints.

### Expected Behavior
- PATH Gateway should bypass protocol endpoints
- PATH Gateway should use fallback endpoints (`rpctest.pokt.ai`) directly
- No signing errors (fallback endpoints don't require signing)

### Actual Behavior
- ❌ PATH Gateway still tries protocol endpoints first
- ❌ Still getting signing errors
- ❌ Fallback endpoints not being used
- ❌ Same error: "no protocol endpoint responses"

### Logs Show
```
"Successfully built 1 protocol contexts for the request with 1 selected endpoints"
"error signing relay request: Sign: error signing using the ring of application"
"Failed to send a single relay request"
```

### Conclusion
**`send_all_traffic: true` does NOT bypass protocol endpoints**

PATH Gateway appears to:
1. Always try protocol endpoints first (regardless of `send_all_traffic` setting)
2. Only use fallback endpoints if protocol endpoints are completely unavailable (not just failing)
3. Require protocol endpoints to initialize before fallback endpoints can be used

### Next Steps
1. PATH Gateway may need protocol endpoints to be disabled/unavailable for fallbacks to work
2. Fallback endpoints may only work when PATH Gateway can't connect to the node at all
3. This appears to be a PATH Gateway limitation/bug
4. Current workaround (direct endpoints) is the best solution for now

## Recommendation
**Continue using direct endpoints via customer-rpc-gateway** - PATH Gateway fallback mechanism doesn't work as expected in delegated mode.

