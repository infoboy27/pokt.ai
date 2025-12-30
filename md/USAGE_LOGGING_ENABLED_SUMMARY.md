# Usage Logging Enabled - Summary

## ✅ Configuration Updated

1. **`apps/web/.env.local`**: `DISABLE_USAGE_LOGGING=false` ✅
2. **`infra/docker-compose.yml`**: `DISABLE_USAGE_LOGGING: 'false'` ✅  
3. **`apps/web/ecosystem.config.js`**: `DISABLE_USAGE_LOGGING: 'false'` ✅

## ⚠️ Service Restart Required

The Next.js web service is running on port 4000 and needs to be restarted to load the new environment variable.

### Current Status

- ✅ Configuration files updated
- ✅ Database is working (test insert succeeded)
- ⏳ Service needs restart to apply changes
- ⏳ Usage logging will be active after restart

## How to Restart

Since the service is running directly with `next dev`, you need to:

1. **Stop the current process**:
   ```bash
   pkill -f "next dev -p 4000"
   ```

2. **Start it again** (it will read the updated `.env.local`):
   ```bash
   cd apps/web
   npm run dev
   # or
   next dev -p 4000
   ```

## Verification After Restart

```bash
# 1. Make test requests
for i in {1..5}; do
  curl -X POST "https://pokt.ai/api/gateway?endpoint=eth_1760726811471_1760726811479" \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' > /dev/null
  sleep 1
done

# 2. Check usage records
docker exec poktai-postgres psql -U pokt_ai -d pokt_ai -c \
  "SELECT endpoint_id, date, relays, p95_ms FROM usage_daily \
   WHERE date = CURRENT_DATE ORDER BY created_at DESC LIMIT 5;"
```

## Expected Result

After restart, you should see:
- ✅ Usage records in `usage_daily` table
- ✅ `relays` count increasing with each request
- ✅ `p95_ms` tracking response times
- ✅ Request counts visible in portal

## Troubleshooting

If usage records still don't appear:

1. **Verify environment variable is loaded**:
   - Check if Next.js is reading `.env.local`
   - Next.js automatically loads `.env.local` in development

2. **Check for errors in logs**:
   ```bash
   # Check Next.js logs for usage logging errors
   tail -f /tmp/nextjs-web.log | grep -i "usage\|error"
   ```

3. **Verify the code path**:
   - The code checks: `if (process.env.DISABLE_USAGE_LOGGING !== 'true')`
   - So `false` or unset will enable logging
   - Only `'true'` (string) disables it

4. **Test database connection**:
   ```bash
   docker exec poktai-postgres psql -U pokt_ai -d pokt_ai -c "SELECT NOW();"
   ```

## Summary

✅ All configuration files updated
⏳ **Action Required**: Restart the Next.js service
✅ After restart: Usage logging will be active and requests will be counted

