# PATH Gateway Configuration

## Status

✅ **PATH Gateway is Running**: `shannon-testnet-gateway` on port 3069  
✅ **Code Updated**: `customer-rpc-gateway` now supports `App-Address` header  
⚠️ **Configuration Needed**: Set `PATH_GATEWAY_APP_ADDRESS` environment variable

## Current Configuration

- **Gateway Address**: `pokt1rxh9slrj6wd3nvp8jf4u9g5sx83udvkrj7248d`
- **Gateway Mode**: Delegated
- **Config File**: `/home/shannon/shannon/gateway/config/gateway_config.yaml`

## How to Enable PATH Gateway

### Option 1: Set Environment Variable (Temporary)

```bash
# Set for current container session
docker exec customer-rpc-gateway sh -c 'export PATH_GATEWAY_APP_ADDRESS=pokt1rxh9slrj6wd3nvp8jf4u9g5sx83udvkrj7248d'
```

### Option 2: Add to Docker Compose (Permanent)

Add to your `docker-compose.yml` or container configuration:

```yaml
services:
  customer-rpc-gateway:
    environment:
      - PATH_GATEWAY_APP_ADDRESS=pokt1rxh9slrj6wd3nvp8jf4u9g5sx83udvkrj7248d
```

### Option 3: Restart Container with Environment Variable

```bash
docker stop customer-rpc-gateway
docker run -d \
  --name customer-rpc-gateway \
  -e PATH_GATEWAY_APP_ADDRESS=pokt1rxh9slrj6wd3nvp8jf4u9g5sx83udvkrj7248d \
  ...other env vars...
  customer-rpc-gateway:latest
```

## Important Notes

1. **App-Address vs Gateway-Address**: 
   - The `gateway_address` in the config (`pokt1rxh9slrj6wd3nvp8jf4u9g5sx83udvkrj7248d`) is the gateway's own address
   - In delegated mode, you need a **Pocket Network application address** that has staked for the services you want to use
   - The gateway address might work, but you may need a different app address

2. **Fallback Endpoints**: 
   - The PATH gateway config shows fallback endpoints are configured
   - If PATH gateway can't find service endpoints, it should use fallbacks
   - Current error: "no protocol endpoint responses" suggests the app address might not have staked services

3. **Current Behavior**:
   - Without `PATH_GATEWAY_APP_ADDRESS`: Gateway skips PATH and uses direct blockchain endpoints ✅
   - With `PATH_GATEWAY_APP_ADDRESS`: Gateway tries PATH first, falls back to direct endpoints if PATH fails ✅

## Testing

Test PATH gateway directly:
```bash
curl -X POST "http://localhost:3069/v1/rpc" \
  -H "Content-Type: application/json" \
  -H "Target-Service-Id: eth" \
  -H "App-Address: pokt1rxh9slrj6wd3nvp8jf4u9g5sx83udvkrj7248d" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

Test via customer-rpc-gateway:
```bash
curl -X POST "http://localhost:4002/v1/rpc/eth" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

## Current Status

- ✅ PATH gateway is running
- ✅ Code supports App-Address header
- ⚠️ Environment variable not set (using direct blockchain endpoints as fallback)
- ⚠️ PATH gateway returns "no protocol endpoint responses" (may need different app address or staking)

## Recommendation

For now, the gateway is working using **direct blockchain endpoints** as fallback. This is fine for load testing. To use PATH gateway, you'll need:

1. A valid Pocket Network application address that has staked for the services (eth, bsc, etc.)
2. Set `PATH_GATEWAY_APP_ADDRESS` environment variable
3. Or configure PATH gateway to use fallback endpoints properly

The current setup (direct blockchain endpoints) should work fine for load testing at 5K RPS.

