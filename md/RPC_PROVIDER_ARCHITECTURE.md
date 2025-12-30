# RPC Provider Architecture - pokt.ai Portal

## Overview

This document explains how the pokt.ai portal interacts with RPC providers, specifically `rpctest.pokt.ai` and PATH gateway running on the same server.

## Architecture Flow

```
User Request
    ↓
pokt.ai Portal (/api/gateway)
    ↓
[Configuration determines routing]
    ↓
    ├─→ Option 1: Direct to rpctest.pokt.ai
    │   └─→ https://rpctest.pokt.ai/v1/rpc/{chain}
    │
    └─→ Option 2: PATH Gateway (port 3069)
        └─→ http://localhost:3069/v1/rpc/{chain}
            └─→ PATH Gateway routes to:
                ├─→ Protocol endpoints (Pocket Network)
                └─→ Fallback endpoints (rpctest.pokt.ai)
```

## How the Portal Consumes Data from rpctest.pokt.ai

### 1. Direct Connection (Current Default)

The portal connects directly to `rpctest.pokt.ai` via the gateway route:

**Location**: `apps/web/app/api/gateway/route.ts`

**Key Configuration**:
```typescript
const SHANNON_RPC_URL = process.env.SHANNON_RPC_URL || 'https://rpctest.pokt.ai';
const RPC_API_KEY = process.env.RPC_API_KEY || process.env.SHANNON_RPC_API_KEY;
```

**How it works**:
1. User makes RPC request to `/api/gateway?endpoint={endpointId}`
2. Portal looks up endpoint configuration from database
3. Portal determines chain ID (eth, bsc, poly, etc.)
4. Portal constructs RPC URL: `https://rpctest.pokt.ai/v1/rpc/{chain}`
5. Portal sends request with:
   - `X-API-Key` header (if configured)
   - JSON-RPC request body
6. Portal receives response and returns to user

**Example Request Flow**:
```typescript
// Chain: Ethereum (eth)
// RPC URL: https://rpctest.pokt.ai/v1/rpc/eth

fetch('https://rpctest.pokt.ai/v1/rpc/eth', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': RPC_API_KEY  // If configured
  },
  body: JSON.stringify({
    jsonrpc: '2.0',
    method: 'eth_blockNumber',
    params: [],
    id: 1
  })
})
```

### 2. Via PATH Gateway (Local Server)

The portal can route through PATH gateway running on port 3069:

**Configuration**:
```typescript
const USE_LOCAL_NODE = process.env.USE_LOCAL_NODE === 'true';
const LOCAL_GATEWAY_URL = process.env.LOCAL_GATEWAY_URL || 'http://localhost:3069';
const LOCAL_NODE_RPC_URL = process.env.LOCAL_NODE_RPC_URL || LOCAL_GATEWAY_URL;
```

**How it works**:
1. User makes RPC request to `/api/gateway?endpoint={endpointId}`
2. Portal checks if `USE_LOCAL_NODE=true`
3. If enabled, portal routes to PATH gateway:
   - URL: `http://localhost:3069/v1/rpc/{chain}`
   - Headers:
     - `Target-Service-Id`: `{chain}` (e.g., "eth", "bsc")
     - `App-Address`: (if configured for delegated mode)
4. PATH gateway receives request and routes to:
   - **Primary**: Protocol endpoints (Pocket Network relay miners)
   - **Fallback**: `rpctest.pokt.ai` (configured in PATH gateway config)

**Example Request Flow**:
```typescript
// Chain: Ethereum (eth)
// RPC URL: http://localhost:3069/v1/rpc/eth

fetch('http://localhost:3069/v1/rpc/eth', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Target-Service-Id': 'eth',  // Required for PATH gateway
    'App-Address': 'pokt1...'    // If using delegated mode
  },
  body: JSON.stringify({
    jsonrpc: '2.0',
    method: 'eth_blockNumber',
    params: [],
    id: 1
  })
})
```

## How to Use PATH Gateway Running on Same Server

### Step 1: Enable PATH Gateway Routing

Set environment variables in your Next.js application:

```bash
# Enable local PATH gateway
USE_LOCAL_NODE=true
LOCAL_GATEWAY_URL=http://localhost:3069
# Or if PATH gateway is accessible via Docker network:
LOCAL_GATEWAY_URL=http://shannon-testnet-gateway:3069
```

**For Docker Compose**:
```yaml
services:
  poktai-web:
    environment:
      - USE_LOCAL_NODE=true
      - LOCAL_GATEWAY_URL=http://shannon-testnet-gateway:3069
      # Or if running on host:
      # - LOCAL_GATEWAY_URL=http://host.docker.internal:3069
```

**For .env.local**:
```bash
USE_LOCAL_NODE=true
LOCAL_GATEWAY_URL=http://localhost:3069
```

### Step 2: Configure PATH Gateway App Address (If Using Delegated Mode)

If PATH gateway is in delegated mode, configure the app address:

```bash
# In customer-rpc-gateway or PATH gateway config
PATH_GATEWAY_APP_ADDRESS=pokt1rxh9slrj6wd3nvp8jf4u9g5sx83udvkrj7248d
```

The portal will automatically send this as the `App-Address` header when routing to PATH gateway.

### Step 3: Verify PATH Gateway Configuration

Check that PATH gateway has fallback endpoints configured to use `rpctest.pokt.ai`:

**PATH Gateway Config** (`gateway_config.yaml`):
```yaml
service_fallback:
  - service_id: eth
    send_all_traffic: true
    fallback_endpoints:
      - default_url: "https://rpctest.pokt.ai/v1/rpc/eth"
  - service_id: bsc
    send_all_traffic: true
    fallback_endpoints:
      - default_url: "https://rpctest.pokt.ai/v1/rpc/bsc"
  # ... other chains
```

### Step 4: Test the Integration

**Test Direct to rpctest.pokt.ai**:
```bash
curl -X POST "https://pokt.ai/api/gateway?endpoint={endpointId}" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

**Test via PATH Gateway** (when `USE_LOCAL_NODE=true`):
```bash
# Should route through PATH gateway
curl -X POST "https://pokt.ai/api/gateway?endpoint={endpointId}" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

## Code Reference

### Gateway Route Handler

The main gateway route is in `apps/web/app/api/gateway/route.ts`:

**Key Functions**:
1. **`getRpcUrl(chainPath)`**: Determines RPC URL based on configuration
   - If `USE_LOCAL_NODE=true`: Uses PATH gateway URL
   - Otherwise: Uses `rpctest.pokt.ai`

2. **Request Routing** (lines 332-341):
   - Adds `Target-Service-Id` header for PATH gateway
   - Adds `X-API-Key` header for `rpctest.pokt.ai`

3. **Chain Mapping** (lines 42-79):
   - Maps chain IDs to RPC paths
   - Supports: eth, bsc, poly, arb-one, opt, base, avax, solana

### URL Construction Logic

```typescript
// From apps/web/app/api/gateway/route.ts

const getRpcUrl = (chainPath: string): string => {
  if (USE_LOCAL_NODE && LOCAL_NODE_RPC_URL) {
    // PATH gateway on port 3069
    if (LOCAL_NODE_RPC_URL.includes('3069')) {
      return `${LOCAL_NODE_RPC_URL}/v1/rpc/${chainPath}`;
    }
    // Shannon testnet (poktroll.com)
    if (LOCAL_NODE_RPC_URL.includes('poktroll.com')) {
      return LOCAL_NODE_RPC_URL;
    }
    // rpctest.pokt.ai
    if (LOCAL_NODE_RPC_URL.includes('rpctest.pokt.ai')) {
      return `${LOCAL_NODE_RPC_URL}/v1/rpc/${chainPath}`;
    }
  }
  // Default: rpctest.pokt.ai
  return `${SHANNON_RPC_URL}/v1/rpc/${chainPath}`;
};
```

## Benefits of Using PATH Gateway

1. **Load Balancing**: PATH gateway can distribute requests across multiple protocol endpoints
2. **Fallback Support**: Automatically falls back to `rpctest.pokt.ai` if protocol endpoints fail
3. **Rate Limit Bypass**: Protocol endpoints may have higher rate limits than `rpctest.pokt.ai`
4. **Local Routing**: Requests stay on local network (faster, no external API calls)

## Current Configuration Status

Based on the codebase:

✅ **Direct rpctest.pokt.ai**: Fully configured and working
- Default RPC URL: `https://rpctest.pokt.ai`
- API key support: `X-API-Key` header
- All chains supported: eth, bsc, poly, arb-one, opt, base, avax, solana

✅ **PATH Gateway Support**: Code is ready, needs configuration
- Code checks for `USE_LOCAL_NODE` environment variable
- Automatically adds `Target-Service-Id` header
- Supports both localhost and Docker network URLs

## Next Steps to Enable PATH Gateway

1. **Set Environment Variables**:
   ```bash
   export USE_LOCAL_NODE=true
   export LOCAL_GATEWAY_URL=http://localhost:3069
   ```

2. **Restart Portal**:
   ```bash
   # If using Docker
   docker restart poktai-web
   
   # If using Next.js directly
   npm run dev
   ```

3. **Verify PATH Gateway is Running**:
   ```bash
   curl http://localhost:3069/health
   ```

4. **Test Integration**:
   ```bash
   # Make a request through portal
   curl -X POST "https://pokt.ai/api/gateway?endpoint={endpointId}" \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
   ```

5. **Monitor Logs**:
   ```bash
   # Check portal logs for PATH gateway routing
   docker logs poktai-web | grep -E "(PATH|3069|LOCAL_GATEWAY)"
   
   # Check PATH gateway logs
   docker logs shannon-testnet-gateway
   ```

## Troubleshooting

### PATH Gateway Not Being Used

**Check**:
- `USE_LOCAL_NODE` environment variable is set to `"true"` (string, not boolean)
- `LOCAL_GATEWAY_URL` is accessible from portal
- PATH gateway is running on port 3069

**Debug**:
```bash
# Check environment variables
docker exec poktai-web printenv | grep -E "(USE_LOCAL_NODE|LOCAL_GATEWAY)"

# Test PATH gateway connectivity
curl http://localhost:3069/health
```

### PATH Gateway Returns Errors

**Check**:
- PATH gateway has fallback endpoints configured
- `App-Address` header is set (if using delegated mode)
- PATH gateway can reach `rpctest.pokt.ai`

**Debug**:
```bash
# Check PATH gateway logs
docker logs shannon-testnet-gateway --tail 50

# Test PATH gateway directly
curl -X POST "http://localhost:3069/v1/rpc/eth" \
  -H "Content-Type: application/json" \
  -H "Target-Service-Id: eth" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

## Summary

The pokt.ai portal can consume data from `rpctest.pokt.ai` in two ways:

1. **Direct**: Portal → `rpctest.pokt.ai` (default, currently active)
2. **Via PATH Gateway**: Portal → PATH Gateway (port 3069) → `rpctest.pokt.ai` (fallback)

To use PATH gateway running on the same server:
- Set `USE_LOCAL_NODE=true`
- Set `LOCAL_GATEWAY_URL=http://localhost:3069` (or Docker network URL)
- Ensure PATH gateway is running and configured with `rpctest.pokt.ai` as fallback

The portal code already supports both modes - you just need to configure the environment variables!

