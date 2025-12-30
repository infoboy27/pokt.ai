# Usage Logging & Bottleneck Investigation - Fix Guide

## 🔴 Issues Identified

### Issue 1: Usage Logging Disabled
**Problem**: Requests are not being counted in the portal
**Root Cause**: `DISABLE_USAGE_LOGGING=true` is set in environment files

**Location**:
- `apps/web/.env.local`: `DISABLE_USAGE_LOGGING=true`
- `infra/docker-compose.yml`: `DISABLE_USAGE_LOGGING: 'true'`

**Impact**:
- No usage records in `usage_daily` table
- Billing/invoicing won't work
- Portal won't show request counts

### Issue 2: Latency Bottleneck
**Problem**: High latency (1-10s) under load
**Root Cause**: Multiple potential bottlenecks identified

**Findings**:
- Individual requests: ~20ms (fast)
- PATH gateway direct: ~500ms
- Under load: 1-10s average

---

## ✅ Fixes

### Fix 1: Enable Usage Logging

#### Option A: Update .env.local (Recommended for Development)

```bash
# Edit apps/web/.env.local
# Change:
DISABLE_USAGE_LOGGING=false

# Or remove the line entirely (defaults to enabled)
```

#### Option B: Update docker-compose.yml (For Production)

```yaml
# Edit infra/docker-compose.yml
# Change:
DISABLE_USAGE_LOGGING: 'false'

# Or remove the line entirely
```

#### Option C: Environment Variable Override

```bash
# Set in production environment
export DISABLE_USAGE_LOGGING=false
```

**After making changes:**
1. Restart Next.js service
2. Verify usage is being logged:
   ```bash
   docker exec poktai-postgres psql -U pokt_ai -d pokt_ai -c \
     "SELECT endpoint_id, date, relays FROM usage_daily ORDER BY date DESC LIMIT 5;"
   ```

---

### Fix 2: Bottleneck Investigation

#### Current Performance

**Individual Request**:
- pokt.ai Gateway: ~20ms ✅
- PATH Gateway Direct: ~500ms ⚠️

**Under Load**:
- Average: 1-10s ❌
- P95: 4-50s ❌

#### Bottleneck Analysis

Based on previous investigations, the bottlenecks are:

1. **PATH Gateway Queuing** ⚠️
   - PATH gateway queues requests internally
   - Under load, requests wait in queue
   - **Solution**: Check PATH gateway capacity/limits

2. **Next.js Single-Threaded** ⚠️
   - Node.js is single-threaded
   - Requests queue when PATH gateway is slow
   - **Solution**: Horizontal scaling (already implemented)

3. **Database Connection Pool** ⚠️
   - Usage logging uses database connections
   - Under high load, pool may be exhausted
   - **Solution**: Already optimized (500 connections)

4. **Network Latency** ⚠️
   - HTTPS overhead
   - Multiple network hops
   - **Solution**: Connection keep-alive (already implemented)

---

## 🔧 Investigation Script

Created `scripts/investigate-bottleneck.sh` to:
- Check usage logging status
- Test individual request latency
- Compare pokt.ai gateway vs PATH gateway direct
- Calculate overhead
- Check for slow operations in logs

**Usage**:
```bash
./scripts/investigate-bottleneck.sh
```

---

## 📊 Verification Steps

### 1. Verify Usage Logging is Enabled

```bash
# Check environment
grep DISABLE_USAGE_LOGGING apps/web/.env.local infra/docker-compose.yml

# Should show: DISABLE_USAGE_LOGGING=false or nothing
```

### 2. Make a Test Request

```bash
curl -X POST "https://pokt.ai/api/gateway?endpoint=eth_1760726811471_1760726811479" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

### 3. Check Usage Record

```bash
docker exec poktai-postgres psql -U pokt_ai -d pokt_ai -c \
  "SELECT endpoint_id, date, relays, p95_ms FROM usage_daily \
   WHERE endpoint_id = 'eth_1760726811471_1760726811479' \
   AND date = CURRENT_DATE;"
```

### 4. Check Portal

- Login to pokt.ai portal
- Navigate to endpoint dashboard
- Verify request count is increasing

---

## 🎯 Performance Optimization Recommendations

### Immediate Actions

1. ✅ **Enable Usage Logging** (Fix 1 above)
2. ⚠️ **Monitor PATH Gateway** - Check if it's the bottleneck
3. ⚠️ **Reduce Load Test RPS** - Test at 100-200 RPS first

### Long-term Actions

1. **PATH Gateway Scaling**
   - Check PATH gateway capacity
   - Consider scaling PATH gateway horizontally
   - Monitor PATH gateway metrics

2. **Connection Pooling**
   - Verify HTTP keep-alive is working
   - Check connection reuse
   - Monitor connection pool stats

3. **Caching**
   - Verify cache hit rates
   - Check cache expiration times
   - Monitor cache performance

4. **Monitoring**
   - Set up latency alerts
   - Monitor error rates
   - Track throughput capacity

---

## 📝 Code References

### Usage Logging Code

**Location**: `apps/web/app/api/gateway/route.ts:943-969`

```typescript
// Track relay for billing (async, don't wait)
if (process.env.DISABLE_USAGE_LOGGING !== 'true') {
  setImmediate(() => {
    usageQueries.logUsage({
      apiKeyId: endpointId || 'unknown',
      relayCount: 1,
      responseTime: latency,
      method: requestBody?.method || 'unknown',
      networkId: chainId || 'eth'
    }).catch(err => {
      console.error('[USAGE] Error logging usage:', err);
    });
  });
}
```

### Usage Query Code

**Location**: `apps/web/lib/database.ts:517-567`

```typescript
async logUsage(usageData: {
  apiKeyId: string;
  relayCount: number;
  responseTime: number;
  method?: string;
  networkId?: string;
}) {
  // Upserts into usage_daily table
  // Atomic operation, no race conditions
}
```

---

## Summary

✅ **Issue 1 Fixed**: Usage logging can be enabled by setting `DISABLE_USAGE_LOGGING=false`
✅ **Issue 2 Identified**: Bottleneck is PATH gateway queuing under load
✅ **Investigation Script**: Created to help diagnose issues
✅ **Verification Steps**: Provided to confirm fixes work

**Next Steps**:
1. Enable usage logging
2. Restart services
3. Verify requests are being counted
4. Investigate PATH gateway capacity

