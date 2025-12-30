# Usage Logging Enabled ✅

## Changes Made

### 1. Updated `apps/web/.env.local`
- Changed: `DISABLE_USAGE_LOGGING=false`
- Removed duplicate entries

### 2. Updated `infra/docker-compose.yml`
- Already set to: `DISABLE_USAGE_LOGGING: 'false'`

## Next Steps

### Restart the Web Service

The service needs to be restarted for the changes to take effect. Choose the appropriate method:

#### Option 1: If using docker-compose
```bash
docker-compose -f infra/docker-compose.yml restart web
```

#### Option 2: If using PM2
```bash
pm2 restart web
# or
pm2 restart all
```

#### Option 3: If running directly
```bash
# Stop the process and restart it
# The new environment variables will be loaded
```

## Verification

After restarting, verify usage logging is working:

### 1. Make a Test Request
```bash
curl -X POST "https://pokt.ai/api/gateway?endpoint=eth_1760726811471_1760726811479" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

### 2. Check Usage Record in Database
```bash
docker exec poktai-postgres psql -U pokt_ai -d pokt_ai -c \
  "SELECT endpoint_id, date, relays, p95_ms FROM usage_daily \
   WHERE endpoint_id = 'eth_1760726811471_1760726811479' \
   AND date = CURRENT_DATE;"
```

### 3. Check Portal
- Login to pokt.ai portal
- Navigate to your endpoint dashboard
- Verify request count is increasing

## Expected Behavior

✅ **Requests will now be counted**:
- Each successful RPC request increments `relays` in `usage_daily` table
- Response time (`p95_ms`) is tracked
- Error rate is calculated
- Billing/invoicing will work correctly

## Troubleshooting

If requests still aren't being counted:

1. **Verify service restarted**:
   ```bash
   # Check if environment variable is loaded
   docker exec <container-name> env | grep DISABLE_USAGE_LOGGING
   # Should show: DISABLE_USAGE_LOGGING=false
   ```

2. **Check logs for errors**:
   ```bash
   docker logs <container-name> | grep -i "usage\|error"
   ```

3. **Verify database connection**:
   ```bash
   docker exec poktai-postgres psql -U pokt_ai -d pokt_ai -c "SELECT NOW();"
   ```

4. **Check usage query errors**:
   ```bash
   docker logs <container-name> | grep -i "\[USAGE\]"
   ```

## Summary

✅ Usage logging is now **ENABLED** in both configuration files
⏳ **Next step**: Restart the web service to apply changes
✅ After restart: Requests will be counted and visible in portal

