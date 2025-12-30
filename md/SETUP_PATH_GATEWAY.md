# Setup PATH Gateway for Endpoint

## ✅ What Was Fixed

The gateway route logic has been updated to **always use PATH gateway** when `USE_LOCAL_NODE=true`, regardless of the network's `rpc_url` setting.

### Before
- Used network's `rpc_url` directly (e.g., `https://rpctest.pokt.ai/v1/rpc/eth`)
- Only added PATH gateway headers, but still sent requests to `rpctest.pokt.ai`

### After
- Checks `USE_LOCAL_NODE` first
- If enabled, uses PATH gateway URL (`http://host.docker.internal:3069/v1`)
- Adds `Target-Service-Id` and `App-Address` headers
- Routes through PATH gateway instead of direct RPC

## 🚀 Next Steps

### 1. Restart Web Container

The code changes need to be applied. Restart the web container:

```bash
cd /home/shannon/poktai/infra
docker compose restart web
```

Or if using a different container name:

```bash
docker restart <web-container-name>
```

### 2. Test the Endpoint

After restarting, test your endpoint:

```bash
curl -X POST "https://pokt.ai/api/gateway?endpoint=ethpath_1764014188689_1764014188693" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "eth_blockNumber",
    "params": [],
    "id": 1
  }'
```

**Expected Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0x16c3df8"
}
```

### 3. Verify PATH Gateway is Being Used

Check the logs to confirm PATH gateway is being used:

```bash
# Check web container logs
docker logs <web-container-name> --tail 50 | grep -i "path\|gateway\|3069"

# Check PATH gateway logs
docker logs shannon-testnet-gateway --tail 50
```

## 📋 Current Configuration

✅ **PATH Gateway**: Running on port 3069 (`shannon-testnet-gateway`)
✅ **Environment Variables** (in docker-compose.yml):
- `USE_LOCAL_NODE: 'true'`
- `LOCAL_GATEWAY_URL: http://host.docker.internal:3069`
- `PATH_GATEWAY_APP_ADDRESS: pokt1q89a5tyhaq5xh49ec5n2wqn5zhynw6fmve06sv`

✅ **Endpoint Configuration**:
- Endpoint ID: `ethpath_1764014188689_1764014188693`
- Chain: Ethereum (eth)
- PATH App Address: NULL (uses global)

## 🔍 How It Works Now

1. **Request comes in**: `https://pokt.ai/api/gateway?endpoint=ethpath_1764014188689_1764014188693`
2. **Gateway route checks**: `USE_LOCAL_NODE=true` ✅
3. **Uses PATH gateway URL**: `http://host.docker.internal:3069/v1`
4. **Adds headers**:
   - `Target-Service-Id: eth`
   - `App-Address: pokt1q89a5tyhaq5xh49ec5n2wqn5zhynw6fmve06sv`
5. **PATH gateway routes** to Ethereum blockchain
6. **Returns response** to user

## 🧪 Test Different Methods

```bash
# Get block number
curl -X POST "https://pokt.ai/api/gateway?endpoint=ethpath_1764014188689_1764014188693" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Get gas price
curl -X POST "https://pokt.ai/api/gateway?endpoint=ethpath_1764014188689_1764014188693" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_gasPrice","params":[],"id":1}'

# Get balance
curl -X POST "https://pokt.ai/api/gateway?endpoint=ethpath_1764014188689_1764014188693" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_getBalance","params":["0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb", "latest"],"id":1}'
```

## 🐛 Troubleshooting

### Issue: Still getting 401 errors

**Solution**: Make sure web container was restarted after code changes

### Issue: PATH gateway not accessible

**Check**:
```bash
# Verify PATH gateway is running
docker ps | grep gateway

# Test PATH gateway directly
curl -X POST "http://localhost:3069/v1" \
  -H "Content-Type: application/json" \
  -H "Target-Service-Id: eth" \
  -H "App-Address: pokt1q89a5tyhaq5xh49ec5n2wqn5zhynw6fmve06sv" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

### Issue: Web container can't reach PATH gateway

**Check**:
```bash
# From web container
docker exec <web-container-name> ping -c 2 host.docker.internal
docker exec <web-container-name> curl -s http://host.docker.internal:3069/v1
```

## ✨ Summary

✅ **Code Updated**: Gateway route now uses PATH gateway when `USE_LOCAL_NODE=true`
✅ **PATH Gateway Running**: Confirmed working on port 3069
✅ **Configuration Set**: Environment variables configured in docker-compose.yml
⏳ **Next Step**: Restart web container and test!

After restarting the web container, your endpoint will route through PATH gateway automatically! 🎉

