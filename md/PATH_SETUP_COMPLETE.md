# PATH Gateway Setup - Complete Guide

## ✅ What's Been Done

1. **Code Updated**: `apps/web/app/api/gateway/route.ts` now supports PATH gateway with:
   - Correct endpoint: `/v1` (not `/v1/rpc/{chain}`)
   - `App-Address` header support
   - `Target-Service-Id` header support

2. **docker-compose.yml Updated**: Added PATH gateway environment variables

3. **PATH Gateway Tested**: Direct connection test successful ✅

## 🚀 Quick Start

### Step 1: Apply Configuration

You need to recreate the container for environment variables to take effect:

```bash
# Option A: If using docker-compose
cd /home/shannon/poktai/infra
docker compose stop web
docker compose up -d web

# Option B: Use the helper script
cd /home/shannon/poktai
./apply-path-config.sh
```

### Step 2: Verify Environment Variables

```bash
docker exec pokt-ai-web printenv | grep -E "(USE_LOCAL_NODE|LOCAL_GATEWAY_URL|PATH_GATEWAY_APP_ADDRESS)"
```

Expected output:
```
USE_LOCAL_NODE=true
LOCAL_GATEWAY_URL=http://host.docker.internal:3069
PATH_GATEWAY_APP_ADDRESS=pokt1q89a5tyhaq5xh49ec5n2wqn5zhynw6fmve06sv
```

### Step 3: Test PATH Gateway

```bash
# Test direct PATH gateway (already working ✅)
curl -X POST http://localhost:3069/v1 \
  -H "Content-Type: application/json" \
  -H "Target-Service-Id: eth" \
  -H "App-Address: pokt1q89a5tyhaq5xh49ec5n2wqn5zhynw6fmve06sv" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

### Step 4: Test Through Portal

```bash
# Get an endpoint ID first (from portal or database)
export ENDPOINT_ID=your-endpoint-id

# Run the test script
./test-path-gateway.sh

# Or test manually
curl -X POST "http://localhost:3005/api/gateway?endpoint=$ENDPOINT_ID" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

## 📋 Configuration Details

### Environment Variables Added

In `infra/docker-compose.yml`:
```yaml
environment:
  USE_LOCAL_NODE: 'true'
  LOCAL_GATEWAY_URL: http://host.docker.internal:3069
  PATH_GATEWAY_APP_ADDRESS: pokt1q89a5tyhaq5xh49ec5n2wqn5zhynw6fmve06sv
```

### How It Works

1. **Portal receives request**: `/api/gateway?endpoint={id}`
2. **Checks `USE_LOCAL_NODE`**: If `true`, routes to PATH gateway
3. **Constructs URL**: `http://host.docker.internal:3069/v1`
4. **Adds headers**:
   - `Target-Service-Id: eth` (based on chain)
   - `App-Address: pokt1q89a5tyhaq5xh49ec5n2wqn5zhynw6fmve06sv`
5. **Forwards request** to PATH gateway
6. **Returns response** to user

## 🔧 Troubleshooting

### PATH Gateway Not Accessible from Container

If `host.docker.internal` doesn't work, try:

1. **Use host IP**:
   ```yaml
   LOCAL_GATEWAY_URL: http://172.17.0.1:3069
   ```

2. **Use actual host IP**:
   ```bash
   # Get host IP
   ip addr show docker0 | grep inet
   # Then use that IP in LOCAL_GATEWAY_URL
   ```

3. **Use host network mode** (if PATH gateway is on host):
   ```yaml
   network_mode: host
   ```

### Environment Variables Not Showing

- Container must be **recreated** (not just restarted)
- Check docker-compose.yml syntax (YAML indentation)
- Verify no typos in variable names

### Requests Failing

1. **Check PATH gateway logs**:
   ```bash
   docker logs shannon-testnet-gateway --tail 50
   ```

2. **Check portal logs**:
   ```bash
   docker logs pokt-ai-web --tail 50 | grep -i path
   ```

3. **Verify PATH gateway is running**:
   ```bash
   curl http://localhost:3069/v1
   ```

## 📊 Test Results

### ✅ PATH Gateway Direct Test
```bash
$ curl -X POST http://localhost:3069/v1 \
    -H "Target-Service-Id: eth" \
    -H "App-Address: pokt1q89a5tyhaq5xh49ec5n2wqn5zhynw6fmve06sv" \
    -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

{
  "id": 1,
  "jsonrpc": "2.0",
  "result": "0x16c2752"
}
```

**Status**: ✅ Working!

## 📝 Files Created

1. `setup-path-gateway.sh` - Setup helper script
2. `test-path-gateway.sh` - Test script
3. `apply-path-config.sh` - Apply configuration script
4. `PATH_GATEWAY_SETUP.md` - Detailed setup guide
5. `QUICK_TEST_PATH.md` - Quick reference

## 🎯 Next Steps

1. ✅ Code updated
2. ✅ docker-compose.yml updated
3. ✅ PATH gateway tested (direct)
4. ⏳ Recreate container with new env vars
5. ⏳ Test through portal
6. ⏳ Monitor and verify

## 💡 Tips

- **PATH gateway URL**: Use `host.docker.internal:3069` from inside Docker containers
- **App Address**: Your PATH gateway app address: `pokt1q89a5tyhaq5xh49ec5n2wqn5zhynw6fmve06sv`
- **Endpoint**: PATH gateway uses `/v1` (not `/v1/rpc/{chain}`) - headers handle routing
- **Headers**: Both `Target-Service-Id` and `App-Address` are required

## 🆘 Need Help?

Run the test script for detailed diagnostics:
```bash
./test-path-gateway.sh
```

This will check:
- PATH gateway connectivity
- Environment variables
- Portal integration
- Provide troubleshooting tips

