# PATH Gateway Quick Start Guide

## Quick Answer: How to Use PATH Gateway on Same Server

### Step 1: Set Environment Variables

Add to `apps/web/.env.local` or your deployment environment:

```bash
# Enable PATH gateway routing
USE_LOCAL_NODE=true
LOCAL_GATEWAY_URL=http://localhost:3069

# Optional: If PATH gateway is in Docker network
# LOCAL_GATEWAY_URL=http://shannon-testnet-gateway:3069
```

### Step 2: Restart Portal

```bash
# If using Docker
docker restart poktai-web

# If using Next.js directly
npm run dev
```

### Step 3: Verify

```bash
# Check PATH gateway is running
curl http://localhost:3069/health

# Test through portal (should route via PATH gateway)
curl -X POST "https://pokt.ai/api/gateway?endpoint={your-endpoint-id}" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

## How It Works

### Current Flow (Direct to rpctest.pokt.ai)
```
User → pokt.ai Portal → rpctest.pokt.ai → Response
```

### New Flow (Via PATH Gateway)
```
User → pokt.ai Portal → PATH Gateway (port 3069) → rpctest.pokt.ai (fallback) → Response
```

## Configuration Options

### Option 1: Local PATH Gateway (Same Server)
```bash
USE_LOCAL_NODE=true
LOCAL_GATEWAY_URL=http://localhost:3069
```

### Option 2: PATH Gateway in Docker Network
```bash
USE_LOCAL_NODE=true
LOCAL_GATEWAY_URL=http://shannon-testnet-gateway:3069
```

### Option 3: Direct to rpctest.pokt.ai (Current Default)
```bash
# Don't set USE_LOCAL_NODE, or set to false
USE_LOCAL_NODE=false
# Portal will use: https://rpctest.pokt.ai/v1/rpc/{chain}
```

## Code Location

The routing logic is in:
- **File**: `apps/web/app/api/gateway/route.ts`
- **Lines**: 12-40 (configuration), 332-341 (header logic)

## Benefits

✅ **Load Balancing**: PATH gateway distributes across multiple endpoints
✅ **Fallback Support**: Automatically falls back to rpctest.pokt.ai
✅ **Rate Limit Bypass**: Protocol endpoints may have higher limits
✅ **Local Routing**: Faster, stays on local network

## Troubleshooting

**PATH Gateway not being used?**
- Check `USE_LOCAL_NODE` is exactly `"true"` (string)
- Verify PATH gateway is running: `curl http://localhost:3069/health`
- Check logs: `docker logs poktai-web | grep PATH`

**PATH Gateway errors?**
- Verify PATH gateway has fallback endpoints configured
- Check PATH gateway logs: `docker logs shannon-testnet-gateway`

## Full Documentation

See `RPC_PROVIDER_ARCHITECTURE.md` for complete details.

