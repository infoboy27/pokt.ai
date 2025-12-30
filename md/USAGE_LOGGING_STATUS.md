# Usage Logging Status

## Current Status

✅ **Configuration Updated**:
- `apps/web/.env.local`: `DISABLE_USAGE_LOGGING=false` ✅
- `infra/docker-compose.yml`: `DISABLE_USAGE_LOGGING: 'false'` ✅

⚠️ **Service Restart Required**:
- The web service needs to be restarted to load the new environment variable
- PM2 and docker-compose commands are not available in this environment
- The service appears to be running directly (not via docker-compose)

## Test Results

✅ **API Requests Working**:
- Test requests to `https://pokt.ai/api/gateway` are successful
- Responses are correct (block numbers returned)

❌ **Usage Records Not Created**:
- No records in `usage_daily` table yet
- This is expected until the service is restarted

## Next Steps

### Option 1: Restart the Service Manually

If the service is running directly:
1. Find the process:
   ```bash
   ps aux | grep -E "next|web|node.*web"
   ```

2. Restart it:
   ```bash
   # Kill the process and restart
   kill <PID>
   # Then restart using your normal startup command
   ```

### Option 2: If Using Systemd

```bash
sudo systemctl restart poktai-web
# or
sudo systemctl restart poktai
```

### Option 3: If Deployed Elsewhere

- Restart the service on the deployment server
- Ensure the `.env.local` file is deployed
- Verify environment variables are loaded

## Verification After Restart

Once the service is restarted:

```bash
# 1. Make a test request
curl -X POST "https://pokt.ai/api/gateway?endpoint=eth_1760726811471_1760726811479" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# 2. Check usage records
docker exec poktai-postgres psql -U pokt_ai -d pokt_ai -c \
  "SELECT endpoint_id, date, relays, p95_ms FROM usage_daily \
   WHERE date = CURRENT_DATE ORDER BY created_at DESC LIMIT 5;"
```

## Expected Behavior

After restart:
- ✅ Each request will increment `relays` in `usage_daily` table
- ✅ Response times will be tracked in `p95_ms`
- ✅ Request counts will appear in the portal
- ✅ Billing/invoicing will work correctly

## Troubleshooting

If usage records still don't appear after restart:

1. **Check environment variable is loaded**:
   ```bash
   # If running in Docker
   docker exec <container-name> env | grep DISABLE_USAGE_LOGGING
   # Should show: DISABLE_USAGE_LOGGING=false
   ```

2. **Check logs for errors**:
   ```bash
   # Check for usage logging errors
   docker logs <container-name> | grep -i "\[USAGE\]"
   # or
   journalctl -u poktai-web | grep -i "usage"
   ```

3. **Verify database connection**:
   ```bash
   docker exec poktai-postgres psql -U pokt_ai -d pokt_ai -c "SELECT NOW();"
   ```

4. **Check usage query function**:
   ```bash
   # Test the usage logging function directly
   docker exec poktai-postgres psql -U pokt_ai -d pokt_ai -c \
     "INSERT INTO usage_daily (id, endpoint_id, date, relays, p95_ms, error_rate) \
      VALUES ('test_123', 'test_endpoint', CURRENT_DATE, 1, 100, 0) \
      ON CONFLICT (endpoint_id, date) DO UPDATE SET relays = usage_daily.relays + 1;"
   ```

## Summary

✅ Configuration files updated
⏳ Service restart required (manual step needed)
✅ After restart: Usage logging will be active

