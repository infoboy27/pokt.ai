# Quick Test Guide: ethpath_1764014188689_1764014188693

## ✅ Endpoint is Working!

The endpoint is now configured and working. Here's how to test it:

## Simple Test Command

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

## Expected Response

**Success:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0x16c3dcd"
}
```

## Test Different Methods

### 1. Get Latest Block Number
```bash
curl -X POST "https://pokt.ai/api/gateway?endpoint=ethpath_1764014188689_1764014188693" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

### 2. Get Gas Price
```bash
curl -X POST "https://pokt.ai/api/gateway?endpoint=ethpath_1764014188689_1764014188693" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_gasPrice","params":[],"id":1}'
```

### 3. Get Balance (replace with actual address)
```bash
curl -X POST "https://pokt.ai/api/gateway?endpoint=ethpath_1764014188689_1764014188693" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_getBalance","params":["0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb", "latest"],"id":1}'
```

## Current Configuration

- **Endpoint ID**: `ethpath_1764014188689_1764014188693`
- **Chain**: Ethereum (chain_id: 1)
- **RPC URL**: `http://host.docker.internal:3069/v1` (PATH Gateway)
- **PATH App Address**: Uses global `PATH_GATEWAY_APP_ADDRESS` (pokt1q89a5tyhaq5xh49ec5n2wqn5zhynw6fmve06sv)

## Verify Configuration

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

## Troubleshooting

If you get an error:

1. **Check endpoint exists**: Run the verify query above
2. **Check PATH gateway is running**: `docker ps | grep gateway`
3. **Check environment variables**: `docker exec poktai-web printenv | grep PATH_GATEWAY`

## Using Custom App Address

To use a custom app address for this endpoint:

```sql
UPDATE networks 
SET path_app_address = 'pokt1yourcustomaddress...' 
WHERE endpoint_id = 'ethpath_1764014188689_1764014188693';
```

Then the endpoint will use your custom app address instead of the global one!

