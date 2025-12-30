# Quick Fix: Enable Usage Logging

## Problem
Requests are not being counted because `DISABLE_USAGE_LOGGING=true` is set.

## Solution

### Option 1: Update docker-compose.yml (Recommended)

I've already updated `infra/docker-compose.yml` to set:
```yaml
DISABLE_USAGE_LOGGING: 'false'
```

**Next Steps**:
1. Restart the web service:
   ```bash
   docker-compose -f infra/docker-compose.yml restart web
   ```

2. Verify usage logging is working:
   ```bash
   # Make a test request
   curl -X POST "https://pokt.ai/api/gateway?endpoint=eth_1760726811471_1760726811479" \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
   
   # Check if usage was logged
   docker exec poktai-postgres psql -U pokt_ai -d pokt_ai -c \
     "SELECT endpoint_id, date, relays FROM usage_daily WHERE date = CURRENT_DATE LIMIT 5;"
   ```

### Option 2: Environment Variable Override

If you can't restart the service, set the environment variable:
```bash
export DISABLE_USAGE_LOGGING=false
```

Then restart the Next.js process.

## Verification

After enabling usage logging, you should see:
1. ✅ Usage records in `usage_daily` table
2. ✅ Request counts increasing in portal
3. ✅ Billing/invoicing working correctly

## Bottleneck Investigation

I've also created `scripts/investigate-bottleneck.sh` to help diagnose latency issues.

Run it with:
```bash
./scripts/investigate-bottleneck.sh
```

This will:
- Check usage logging status
- Test request latency
- Compare pokt.ai gateway vs PATH gateway direct
- Identify bottlenecks

