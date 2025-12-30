# PATH Gateway Setup - Quick Guide

## ✅ Code Updated!

The portal code has been updated to use PATH gateway with the correct endpoint (`/v1`) and headers (`App-Address` and `Target-Service-Id`).

## Setup Steps

### 1. Set Environment Variables

Add these to your `.env.local` file in `apps/web/`:

```bash
# Enable PATH gateway
USE_LOCAL_NODE=true
LOCAL_GATEWAY_URL=http://localhost:3069

# Your PATH gateway App-Address (from your curl example)
PATH_GATEWAY_APP_ADDRESS=pokt1q89a5tyhaq5xh49ec5n2wqn5zhynw6fmve06sv
```

### 2. Restart the Portal

```bash
# If using Docker
docker restart poktai-web

# If using Next.js directly
cd apps/web
npm run dev
```

### 3. Verify PATH Gateway is Running

```bash
curl http://localhost:3069/health
```

### 4. Test the Integration

```bash
# Test through portal (should route via PATH gateway)
curl -X POST "https://pokt.ai/api/gateway?endpoint={your-endpoint-id}" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

## What Changed

### Before
- URL: `http://localhost:3069/v1/rpc/eth`
- Headers: Only `Target-Service-Id`

### After (Matches Your curl Example)
- URL: `http://localhost:3069/v1` ✅
- Headers: 
  - `Target-Service-Id: eth` ✅
  - `App-Address: pokt1q89a5tyhaq5xh49ec5n2wqn5zhynw6fmve06sv` ✅

## Code Changes

1. **Updated `getRpcUrl()` function**:
   - Changed from `/v1/rpc/{chain}` to `/v1` for PATH gateway
   - PATH gateway uses headers for routing, not URL paths

2. **Added `App-Address` header support**:
   - Reads from `PATH_GATEWAY_APP_ADDRESS` environment variable
   - Automatically adds header when using PATH gateway

3. **Improved PATH gateway detection**:
   - Detects port 3069 in URL
   - Adds both required headers automatically

## How It Works Now

```
User Request
    ↓
pokt.ai Portal (/api/gateway)
    ↓
PATH Gateway (http://localhost:3069/v1)
    Headers:
    - Target-Service-Id: eth
    - App-Address: pokt1q89a5tyhaq5xh49ec5n2wqn5zhynw6fmve06sv
    ↓
PATH Gateway routes to blockchain
```

## Troubleshooting

**PATH Gateway not being used?**
- Check `USE_LOCAL_NODE=true` (must be string "true")
- Verify PATH gateway is running: `curl http://localhost:3069/health`
- Check environment variables: `docker exec poktai-web printenv | grep PATH`

**Missing App-Address header?**
- Verify `PATH_GATEWAY_APP_ADDRESS` is set
- Check logs: `docker logs poktai-web | grep PATH`

**Wrong endpoint?**
- PATH gateway should use `/v1` (not `/v1/rpc/eth`)
- Check URL in logs to confirm

## Example Request Flow

When you make a request to:
```
POST /api/gateway?endpoint=your-endpoint-id
```

The portal will:
1. Detect `USE_LOCAL_NODE=true`
2. Route to `http://localhost:3069/v1`
3. Add headers:
   - `Target-Service-Id: eth` (based on chain)
   - `App-Address: pokt1q89a5tyhaq5xh49ec5n2wqn5zhynw6fmve06sv`
4. Forward JSON-RPC request body

This matches your curl example exactly! 🎉

