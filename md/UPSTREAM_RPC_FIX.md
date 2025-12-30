# Upstream RPC Provider Fix

## Issue Identified

The `customer-rpc-gateway` was failing to connect to upstream RPC providers, causing a 96.97% failure rate in load tests.

### Root Cause

1. **PATH Gateway Header Mismatch**: The PATH gateway (`shannon-testnet-gateway`) requires an `App-Address` header for delegated gateway mode, but `customer-rpc-gateway` was sending `target-service-id` (lowercase).

2. **Missing App-Address Configuration**: The PATH gateway is in "delegated gateway mode" which requires a Pocket Network App Address to identify which application to use for relays.

## Solution Applied

### 1. Updated PATH Gateway Call Function

Modified `/app/app.js` in `customer-rpc-gateway` to:
- Check if `PATH_GATEWAY_APP_ADDRESS` environment variable is configured
- Skip PATH gateway gracefully if App-Address is not configured
- Use direct blockchain endpoints as primary method when PATH gateway is unavailable
- Send correct headers (`App-Address` and `Target-Service-Id`) when PATH gateway is configured

### 2. Fallback Mechanism

The gateway now:
1. **First**: Tries PATH gateway (if `PATH_GATEWAY_APP_ADDRESS` is configured)
2. **Fallback**: Uses direct blockchain endpoints (public RPC providers)
3. **Error Handling**: Returns clear error messages if all methods fail

### 3. Direct Blockchain Endpoints

The following public RPC endpoints are configured as fallback:
- **Ethereum**: `https://ethereum.publicnode.com`, `https://rpc.ankr.com/eth`, `https://eth.llamarpc.com`, `https://eth.drpc.org`
- **Polygon**: `https://polygon-rpc.com`, `https://rpc.ankr.com/polygon`
- **BSC**: `https://bsc-dataseed.binance.org`, `https://rpc.ankr.com/bsc`
- **Arbitrum**: `https://arb1.arbitrum.io/rpc`, `https://rpc.ankr.com/arbitrum`
- **Optimism**: `https://mainnet.optimism.io`, `https://rpc.ankr.com/optimism`
- **Base**: `https://mainnet.base.org`, `https://rpc.ankr.com/base`
- **Avalanche**: `https://avalanche.public-rpc.com`, `https://rpc.ankr.com/avalanche`

## Code Changes

### Before
```javascript
const callPathGateway = async (network, rpcRequest) => {
    const response = await axios.post(`${PATH_GATEWAY_URL}/v1/rpc`, rpcRequest, {
        headers: {
            'Content-Type': 'application/json',
            'target-service-id': network  // ❌ Wrong header
        },
        timeout: 10000
    });
    // ...
};
```

### After
```javascript
const PATH_GATEWAY_APP_ADDRESS = process.env.PATH_GATEWAY_APP_ADDRESS || null;

const callPathGateway = async (network, rpcRequest) => {
    // Skip if App-Address not configured
    if (!PATH_GATEWAY_APP_ADDRESS) {
        throw new Error('PATH gateway App-Address not configured, skipping PATH gateway');
    }

    const headers = {
        'Content-Type': 'application/json',
        'Target-Service-Id': network,
        'App-Address': PATH_GATEWAY_APP_ADDRESS  // ✅ Correct header
    };
    
    const response = await axios.post(`${PATH_GATEWAY_URL}/v1/rpc`, rpcRequest, {
        headers: headers,
        timeout: 10000
    });
    // ...
};
```

## Results

✅ **Gateway is now working**: Direct blockchain endpoints are successfully processing requests  
✅ **Graceful fallback**: PATH gateway is skipped when not configured, using direct endpoints  
✅ **Error handling**: Clear error messages when all methods fail  

## Next Steps (Optional)

To enable PATH gateway in the future:

1. **Get Pocket Network App Address**: Obtain a Pocket Network application address
2. **Configure Environment Variable**: Set `PATH_GATEWAY_APP_ADDRESS` in `customer-rpc-gateway` container
3. **Restart Service**: Restart `customer-rpc-gateway` to use PATH gateway

Example:
```bash
docker exec customer-rpc-gateway printenv PATH_GATEWAY_APP_ADDRESS
# If not set, add to docker-compose.yml or docker run command:
# -e PATH_GATEWAY_APP_ADDRESS="your-pocket-app-address"
```

## Testing

Test the gateway:
```bash
# Test via pokt.ai gateway
curl -X POST "https://pokt.ai/api/gateway?endpoint=eth_1760726811471_1760726811479" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Test customer-rpc-gateway directly
curl -X POST "http://localhost:4002/v1/rpc/eth" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

## Status

✅ **Fixed**: Gateway is now using direct blockchain endpoints successfully  
⚠️ **Note**: PATH gateway requires App-Address configuration to be enabled

