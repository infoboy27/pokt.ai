# Quick PATH Gateway Test Guide

## ✅ PATH Gateway is Working!

Direct test confirmed PATH gateway is responding correctly:
```json
{
  "id": 1,
  "jsonrpc": "2.0",
  "result": "0x16c2752"
}
```

## Configuration Status

✅ **docker-compose.yml updated** with PATH gateway environment variables
⚠️ **Container needs to be recreated** (not just restarted) for env vars to take effect

## Quick Setup Steps

### Option 1: Recreate Container with docker-compose (Recommended)

```bash
cd /home/shannon/poktai/infra
docker compose down web
docker compose up -d web
```

### Option 2: Set Environment Variables Directly

If you can't recreate the container, you can set env vars directly:

```bash
# Stop container
docker stop pokt-ai-web

# Start with new environment variables
docker start pokt-ai-web
docker exec pokt-ai-web sh -c 'export USE_LOCAL_NODE=true && export LOCAL_GATEWAY_URL=http://host.docker.internal:3069 && export PATH_GATEWAY_APP_ADDRESS=pokt1q89a5tyhaq5xh49ec5n2wqn5zhynw6fmve06sv'
```

**Note:** This won't persist after container restart. Use Option 1 for permanent setup.

### Option 3: Add to .env file

If your docker-compose uses `.env` file, add these:

```bash
USE_LOCAL_NODE=true
LOCAL_GATEWAY_URL=http://host.docker.internal:3069
PATH_GATEWAY_APP_ADDRESS=pokt1q89a5tyhaq5xh49ec5n2wqn5zhynw6fmve06sv
```

Then recreate:
```bash
cd /home/shannon/poktai/infra
docker compose up -d web
```

## Test PATH Gateway Integration

### 1. Verify Environment Variables

```bash
docker exec pokt-ai-web printenv | grep -E "(USE_LOCAL_NODE|LOCAL_GATEWAY_URL|PATH_GATEWAY_APP_ADDRESS)"
```

Expected output:
```
USE_LOCAL_NODE=true
LOCAL_GATEWAY_URL=http://host.docker.internal:3069
PATH_GATEWAY_APP_ADDRESS=pokt1q89a5tyhaq5xh49ec5n2wqn5zhynw6fmve06sv
```

### 2. Test Direct PATH Gateway (Already Working ✅)

```bash
curl -X POST http://localhost:3069/v1 \
  -H "Content-Type: application/json" \
  -H "Target-Service-Id: eth" \
  -H "App-Address: pokt1q89a5tyhaq5xh49ec5n2wqn5zhynw6fmve06sv" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

### 3. Test Through Portal

First, get an endpoint ID:
```bash
# List endpoints or create one through the portal
# Then test:
export ENDPOINT_ID=your-endpoint-id-here
```

Then test:
```bash
./test-path-gateway.sh
```

Or manually:
```bash
curl -X POST "http://localhost:3005/api/gateway?endpoint=$ENDPOINT_ID" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

## What to Expect

When PATH gateway is properly configured:
- Portal routes requests to `http://host.docker.internal:3069/v1`
- Headers are automatically added:
  - `Target-Service-Id: eth` (or other chain)
  - `App-Address: pokt1q89a5tyhaq5xh49ec5n2wqn5zhynw6fmve06sv`
- Response should be successful with blockchain data

## Troubleshooting

**If PATH gateway not accessible from container:**
- Try `172.17.0.1:3069` instead of `host.docker.internal:3069`
- Or use host's actual IP address
- Check if PATH gateway is bound to `0.0.0.0:3069` (not just `127.0.0.1:3069`)

**If environment variables not showing:**
- Container must be recreated (not just restarted)
- Check docker-compose.yml syntax
- Verify .env file if using one

**If requests fail:**
- Check PATH gateway logs: `docker logs shannon-testnet-gateway`
- Check portal logs: `docker logs pokt-ai-web`
- Verify PATH gateway is running: `curl http://localhost:3069/v1`

## Next Steps

1. ✅ PATH gateway is working (direct test passed)
2. ⏳ Recreate container with new environment variables
3. ⏳ Test through portal
4. ⏳ Monitor logs for any issues

