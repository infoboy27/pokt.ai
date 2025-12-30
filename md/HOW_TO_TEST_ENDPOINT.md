# How to Test Endpoint: ethpath_1764014188689_1764014188693

## ✅ Endpoint Status

- **Endpoint ID**: `ethpath_1764014188689_1764014188693`
- **Chain**: Ethereum (chain_id: 1, code: eth)
- **Status**: Active
- **PATH App Address**: NULL (uses global `PATH_GATEWAY_APP_ADDRESS`)

## 🧪 Test Commands

### Method 1: Basic Test (Recommended)

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

### Method 2: Pretty Print Response

```bash
curl -s -X POST "https://pokt.ai/api/gateway?endpoint=ethpath_1764014188689_1764014188693" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' | jq '.'
```

### Method 3: Test Multiple Methods

```bash
# Test 1: Get latest block number
curl -X POST "https://pokt.ai/api/gateway?endpoint=ethpath_1764014188689_1764014188693" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Test 2: Get gas price
curl -X POST "https://pokt.ai/api/gateway?endpoint=ethpath_1764014188689_1764014188693" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_gasPrice","params":[],"id":1}'

# Test 3: Get balance (replace address)
curl -X POST "https://pokt.ai/api/gateway?endpoint=ethpath_1764014188689_1764014188693" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_getBalance","params":["0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb", "latest"],"id":1}'
```

## 📋 Expected Responses

### Success Response
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0x16c3dcd"
}
```

### Error Response (if API key required)
```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32603,
    "message": "Upstream RPC error: 401 Unauthorized",
    "data": "{\"error\":\"API key required\",\"code\":\"MISSING_API_KEY\"}"
  },
  "id": 1
}
```

## 🔍 Check Endpoint Configuration

```bash
docker exec poktai-postgres psql -U pokt_ai -d pokt_ai -c "
SELECT 
  e.id, 
  e.name, 
  e.is_active, 
  n.code, 
  n.chain_id, 
  n.rpc_url, 
  n.path_app_address 
FROM endpoints e 
LEFT JOIN networks n ON e.id = n.endpoint_id 
WHERE e.id = 'ethpath_1764014188689_1764014188693';
"
```

## 🔧 How Routing Works

The endpoint routing logic:

1. **If `USE_LOCAL_NODE=true`** and `LOCAL_NODE_RPC_URL` includes `3069`:
   - Routes through PATH gateway (`http://host.docker.internal:3069/v1`)
   - Adds `Target-Service-Id: eth` header
   - Adds `App-Address` header (from `path_app_address` or global `PATH_GATEWAY_APP_ADDRESS`)

2. **Otherwise**:
   - Routes directly to network's `rpc_url` (e.g., `https://rpctest.pokt.ai/v1/rpc/eth`)
   - May require API key if using `rpctest.pokt.ai`

## 🎯 Current Behavior

Based on your `docker-compose.yml`:
- `USE_LOCAL_NODE: 'true'`
- `LOCAL_GATEWAY_URL: http://host.docker.internal:3069`
- `PATH_GATEWAY_APP_ADDRESS: pokt1q89a5tyhaq5xh49ec5n2wqn5zhynw6fmve06sv`

**Expected**: Endpoint should route through PATH gateway automatically when `USE_LOCAL_NODE=true`, even if network's `rpc_url` is set to `rpctest.pokt.ai`.

## 🐛 Troubleshooting

### Issue: 401 Unauthorized / API key required

**Cause**: Endpoint is routing to `rpctest.pokt.ai` which requires API key.

**Solutions**:
1. Set `RPC_API_KEY` environment variable in web container
2. Or ensure PATH gateway routing is working (check `USE_LOCAL_NODE=true`)

### Issue: Internal gateway error

**Cause**: PATH gateway might not be accessible from web container.

**Solutions**:
1. Check PATH gateway is running: `docker ps | grep gateway`
2. Verify network connectivity: `docker exec poktai-web ping host.docker.internal`
3. Check PATH gateway health: `curl http://localhost:3069/health`

### Issue: Endpoint not found

**Cause**: Endpoint ID doesn't exist in database.

**Solution**: Verify endpoint exists using the check query above.

## ✨ Test PATH Gateway Directly

To verify PATH gateway is working:

```bash
curl -X POST "http://localhost:3069/v1" \
  -H "Content-Type: application/json" \
  -H "Target-Service-Id: eth" \
  -H "App-Address: pokt1q89a5tyhaq5xh49ec5n2wqn5zhynw6fmve06sv" \
  -d '{
    "jsonrpc": "2.0",
    "method": "eth_blockNumber",
    "params": [],
    "id": 1
  }'
```

If this works, PATH gateway is functioning correctly.

## 📝 Summary

**Quick Test:**
```bash
curl -X POST "https://pokt.ai/api/gateway?endpoint=ethpath_1764014188689_1764014188693" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

The endpoint should work if:
- ✅ Endpoint exists in database
- ✅ PATH gateway is running
- ✅ `USE_LOCAL_NODE=true` is set
- ✅ PATH gateway is accessible from web container

