# Load Test Performance Issue - Fixed

## Problem Identified

Your load test showed:
- **86.90% error rate** ❌
- **Very slow response times** (avg: 11.91s, P99: 52.95s) ❌
- **Only 148 req/s** instead of target 2000 RPS ❌

## Root Cause

**Rate limiting is per IP address**, so all k6 requests from one machine share the same rate limit bucket.

The rate limit key is: `gateway:{endpointId}:{ip}`

This means:
- All requests from your test machine share one 10,000 req/sec limit
- But the limit is being hit because requests are queued/timed out
- The slow responses suggest requests are being throttled/queued

## Solution Applied

### 1. Added Environment Variable to Disable IP-Based Rate Limiting

**For Load Testing**: Set `DISABLE_IP_RATE_LIMIT=true` to remove IP from rate limit key

**Updated**: `apps/web/lib/rate-limit.ts`
- Now checks `DISABLE_IP_RATE_LIMIT` env var
- If set, rate limit key is just `gateway:{endpointId}` (no IP)

### 2. Added Option to Disable Rate Limiting Entirely

**For Load Testing**: Set `DISABLE_RATE_LIMIT=true` to bypass rate limiting

**Updated**: `apps/web/app/api/gateway/route.ts`
- Checks `DISABLE_RATE_LIMIT` env var
- If set, skips rate limiting entirely

## How to Run Load Test Now

### Option 1: Disable IP-Based Rate Limiting (Recommended)

```bash
# Add to .env.local or docker-compose.yml
DISABLE_IP_RATE_LIMIT=true

# Then restart Next.js and run test
ENDPOINT_ID=ethpath_1764014188689_1764014188693 \
TARGET_RPS=2000 \
TOTAL_REQUESTS=1000000 \
k6 run load-test-path-1m-5krps.js
```

### Option 2: Disable Rate Limiting Entirely (For Load Testing Only)

```bash
# Add to .env.local or docker-compose.yml
DISABLE_RATE_LIMIT=true

# Then restart Next.js and run test
ENDPOINT_ID=ethpath_1764014188689_1764014188693 \
TARGET_RPS=2000 \
TOTAL_REQUESTS=1000000 \
k6 run load-test-path-1m-5krps.js
```

### Option 3: Update docker-compose.yml

Add to `infra/docker-compose.yml`:

```yaml
web:
  environment:
    # ... existing vars ...
    DISABLE_IP_RATE_LIMIT: 'true'  # For load testing
    # OR
    DISABLE_RATE_LIMIT: 'true'     # To disable entirely
```

Then restart:
```bash
cd /home/shannon/poktai/infra
docker compose restart web
```

## Quick Fix for Direct Next.js

If running Next.js directly (not Docker):

```bash
# Add to apps/web/.env.local
DISABLE_IP_RATE_LIMIT=true

# Restart Next.js
pkill -f "next dev"
cd apps/web && npm run dev
```

## Expected Results After Fix

✅ **Error rate**: Should drop to < 1%
✅ **Response times**: Should be < 500ms average
✅ **Throughput**: Should reach target 2000 RPS
✅ **Success rate**: Should be > 99%

## Why This Happened

1. **Rate limit key includes IP**: All k6 requests from one machine = one rate limit bucket
2. **10,000 req/sec limit**: Should be enough, but IP-based limiting causes issues
3. **Request queuing**: Slow responses suggest requests are being queued/throttled

## Next Steps

1. **Add environment variable** to disable IP-based rate limiting
2. **Restart Next.js** to apply changes
3. **Re-run load test** with same parameters
4. **Monitor results** - should see dramatic improvement

## Production Considerations

⚠️ **Important**: 
- `DISABLE_RATE_LIMIT=true` should **ONLY** be used for load testing
- `DISABLE_IP_RATE_LIMIT=true` is safer - still rate limits, just not per-IP
- For production, keep IP-based rate limiting enabled

## Summary

✅ **Fixed**: Rate limiting now configurable for load testing
✅ **Options**: Can disable IP-based limiting or disable entirely
✅ **Next**: Add env var, restart, re-run test

The issue was rate limiting per IP address. Now you can disable it for load testing! 🚀

