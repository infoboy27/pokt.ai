# How to Test Endpoint: ethpath_1764014188689_1764014188693

## Current Status

✅ **Endpoint exists** in database
✅ **Network configured**: Ethereum (chain_id: 1, code: eth)
⚠️ **RPC URL**: `https://rpctest.pokt.ai/v1/rpc/eth` (requires API key)
⚠️ **PATH App Address**: NULL (will use global `PATH_GATEWAY_APP_ADDRESS`)

## Test Methods

### Method 1: Test via pokt.ai Gateway (Recommended)

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

**Expected Behavior:**
- If `USE_LOCAL_NODE=true`: Routes through PATH gateway (localhost:3069)
- If `USE_LOCAL_NODE=false`: Routes directly to `rpctest.pokt.ai` (requires API key)

### Method 2: Test PATH Gateway Directly

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

### Method 3: Test with Different RPC Methods

```bash
# Get latest block number
curl -X POST "https://pokt.ai/api/gateway?endpoint=ethpath_1764014188689_1764014188693" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Get gas price
curl -X POST "https://pokt.ai/api/gateway?endpoint=ethpath_1764014188689_1764014188693" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_gasPrice","params":[],"id":1}'

# Get balance (requires address parameter)
curl -X POST "https://pokt.ai/api/gateway?endpoint=ethpath_1764014188689_1764014188693" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_getBalance","params":["0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb", "latest"],"id":1}'
```

## Troubleshooting

### Issue: 401 Unauthorized / API key required

**Cause**: Endpoint is routing to `rpctest.pokt.ai` which requires API key, but PATH gateway is not being used.

**Solution**: 
1. Check if `USE_LOCAL_NODE=true` in environment
2. Check if PATH gateway is running: `docker ps | grep gateway`
3. Update network's `rpc_url` to use PATH gateway or leave it NULL to use default

### Issue: 404 Not Found

**Cause**: RPC URL is incorrect or PATH gateway endpoint is wrong.

**Solution**:
- For PATH gateway: Use `http://localhost:3069/v1` (not `/v1/rpc/eth`)
- For rpctest.pokt.ai: Use `https://rpctest.pokt.ai/v1/rpc/eth`

### Issue: Endpoint not found

**Cause**: Endpoint ID doesn't exist in database.

**Solution**: Verify endpoint exists:
```sql
SELECT * FROM endpoints WHERE id = 'ethpath_1764014188689_1764014188693';
```

## Check Endpoint Configuration

```bash
# Check endpoint in database
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

## Expected Response Format

**Success Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0x16c3d7a"
}
```

**Error Response:**
```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32603,
    "message": "Upstream RPC error: ..."
  },
  "id": 1
}
```

## Verify PATH Gateway is Being Used

Check response headers (if available) or logs to see which upstream is being used:
- PATH Gateway: `http://localhost:3069/v1` or `http://host.docker.internal:3069/v1`
- Direct RPC: `https://rpctest.pokt.ai/v1/rpc/eth`

## Update Endpoint to Use PATH Gateway

If you want to force PATH gateway usage, update the network's RPC URL:

```sql
-- Set rpc_url to NULL to use default PATH gateway routing
UPDATE networks 
SET rpc_url = NULL 
WHERE endpoint_id = 'ethpath_1764014188689_1764014188693';

-- Or set to PATH gateway URL explicitly
UPDATE networks 
SET rpc_url = 'http://host.docker.internal:3069/v1' 
WHERE endpoint_id = 'ethpath_1764014188689_1764014188693';
```

