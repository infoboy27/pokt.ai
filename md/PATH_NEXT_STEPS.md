# PATH Gateway - Next Steps to Complete Setup

## Current Status

✅ **Code Updated**: Gateway route now supports PATH gateway  
✅ **docker-compose.yml Updated**: Environment variables added  
✅ **PATH Gateway Working**: Direct test successful  
⚠️ **Container**: Needs to be recreated to apply env vars

## The Issue

The `pokt-ai-web` container needs to be recreated (not just restarted) for environment variables to take effect. The docker-compose file has been updated, but the container needs to be rebuilt.

## Solution Options

### Option 1: Recreate Container with docker-compose (Recommended)

```bash
cd /home/shannon/poktai/infra

# Stop and remove the web container
docker compose stop web
docker compose rm -f web

# Start it again (this will apply the new env vars)
docker compose up -d web

# Wait a few seconds, then verify
sleep 10
docker exec pokt-ai-web printenv | grep -E "(USE_LOCAL_NODE|LOCAL_GATEWAY_URL|PATH_GATEWAY_APP_ADDRESS)"
```

### Option 2: If Container is Started Manually

If the container was started with `docker run` instead of docker-compose:

```bash
# Stop the container
docker stop pokt-ai-web

# Remove it
docker rm pokt-ai-web

# Start it again with the environment variables
# (You'll need your original docker run command + these env vars)
docker run -d \
  --name pokt-ai-web \
  -e USE_LOCAL_NODE=true \
  -e LOCAL_GATEWAY_URL=http://host.docker.internal:3069 \
  -e PATH_GATEWAY_APP_ADDRESS=pokt1q89a5tyhaq5xh49ec5n2wqn5zhynw6fmve06sv \
  ... (your other options) ...
```

### Option 3: Check if Container is Running Elsewhere

The container might be running under a different setup. Check:

```bash
# List all containers
docker ps -a | grep web

# Check if there's a different compose file
find /home/shannon -name "docker-compose*.yml" -type f 2>/dev/null | head -5
```

## Verification Steps

After recreating the container, verify:

### 1. Check Environment Variables

```bash
docker exec pokt-ai-web printenv | grep -E "(USE_LOCAL_NODE|LOCAL_GATEWAY_URL|PATH_GATEWAY_APP_ADDRESS)"
```

Expected output:
```
USE_LOCAL_NODE=true
LOCAL_GATEWAY_URL=http://host.docker.internal:3069
PATH_GATEWAY_APP_ADDRESS=pokt1q89a5tyhaq5xh49ec5n2wqn5zhynw6fmve06sv
```

### 2. Test PATH Gateway Directly

```bash
curl -X POST http://localhost:3069/v1 \
  -H "Content-Type: application/json" \
  -H "Target-Service-Id: eth" \
  -H "App-Address: pokt1q89a5tyhaq5xh49ec5n2wqn5zhynw6fmve06sv" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

### 3. Test Through Portal

```bash
# Get an endpoint ID first
export ENDPOINT_ID=your-endpoint-id

# Test
curl -X POST "http://localhost:3005/api/gateway?endpoint=$ENDPOINT_ID" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

Or use the test script:
```bash
export ENDPOINT_ID=your-endpoint-id
./test-path-gateway.sh
```

## Troubleshooting

### If PATH Gateway Not Accessible from Container

The `host.docker.internal` might not work. Try:

1. **Use host IP**:
   ```yaml
   LOCAL_GATEWAY_URL: http://172.17.0.1:3069
   ```

2. **Use actual host IP**:
   ```bash
   # Get Docker bridge IP
   ip addr show docker0 | grep "inet " | awk '{print $2}' | cut -d/ -f1
   # Use that IP in LOCAL_GATEWAY_URL
   ```

3. **Use host network** (if PATH gateway is on host):
   ```yaml
   network_mode: host
   LOCAL_GATEWAY_URL: http://localhost:3069
   ```

### If Container Won't Start

Check logs:
```bash
docker compose logs web
```

Check dependencies:
```bash
docker compose ps
# Make sure postgres, redis, api are running
```

## Quick Test Script

I've created `test-path-gateway.sh` which will:
- Test PATH gateway directly ✅
- Check environment variables
- Test portal integration
- Provide troubleshooting tips

Run it after recreating the container:
```bash
export ENDPOINT_ID=your-endpoint-id
./test-path-gateway.sh
```

## Summary

**What's Done:**
- ✅ Code updated
- ✅ docker-compose.yml updated  
- ✅ PATH gateway tested and working

**What's Needed:**
- ⏳ Recreate container to apply environment variables
- ⏳ Verify env vars are set
- ⏳ Test portal integration

**Next Command:**
```bash
cd /home/shannon/poktai/infra && docker compose stop web && docker compose rm -f web && docker compose up -d web
```

Then verify and test!

