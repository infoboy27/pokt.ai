# Billing/Invoice Fix - Relay Counting

## 🔴 Issue Identified

**Problem:** Relays are not being counted for invoice purposes

**Root Cause:**
- Usage logging may be disabled via `DISABLE_USAGE_LOGGING=true` environment variable
- This was set for load testing but needs to be re-enabled for production

## ✅ Fix Applied

### 1. Enhanced Usage Logging

**Updated:** `apps/web/app/api/gateway/route.ts`
- Added warning when usage logging is disabled in production
- Improved error handling and logging
- Ensured usage logging is enabled by default

### 2. Usage Logging Flow

**How it works:**
1. Every successful RPC request logs usage via `usageQueries.logUsage()`
2. Data stored in `usage_daily` table with:
   - `endpoint_id` (using endpointId as apiKeyId)
   - `date` (today's date)
   - `relays` (incremented for each request)
   - `p95_ms` (response time)
   - `error_rate`

3. Billing system reads from `usage_daily` table to calculate costs

## 🔧 Configuration

### Enable Usage Logging (Production)

**In `apps/web/.env.local` or environment:**
```bash
# Remove or set to false to enable usage logging
DISABLE_USAGE_LOGGING=false
```

**Or remove the variable entirely** (defaults to enabled)

### Disable Usage Logging (Load Testing Only)

**Only for load testing:**
```bash
DISABLE_USAGE_LOGGING=true
```

**⚠️ IMPORTANT:** Re-enable after load testing!

## 📊 Verification

**Check if usage is being logged:**
```sql
-- Check usage_daily table
SELECT endpoint_id, date, relays, p95_ms, error_rate 
FROM usage_daily 
WHERE endpoint_id = 'ethpath_1764014188689_1764014188693'
ORDER BY date DESC 
LIMIT 10;
```

**Check billing endpoint:**
```bash
curl https://pokt.ai/api/billing
```

## 🎯 Next Steps

1. ✅ **Verify environment variable** - Ensure `DISABLE_USAGE_LOGGING` is not set to `true`
2. ✅ **Restart Next.js** - Apply changes
3. ✅ **Test relay counting** - Make a request and verify it's logged
4. ✅ **Check billing portal** - Verify relays appear in dashboard

## Summary

✅ **Usage logging enhanced** - Better error handling and warnings
✅ **Production ready** - Logging enabled by default
⚠️ **Check environment** - Ensure `DISABLE_USAGE_LOGGING` is not set

**Relays should now be counted for billing/invoicing!** 💰

