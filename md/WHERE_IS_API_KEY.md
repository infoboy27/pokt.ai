# Where is the API Key?

## Current Status

❌ **API Key is NOT currently configured** in `docker-compose.yml`

The API key (`RPC_API_KEY` or `SHANNON_RPC_API_KEY`) is needed when routing directly to `rpctest.pokt.ai`. However, since you have `USE_LOCAL_NODE=true`, the system should route through PATH gateway instead, which doesn't require the API key.

## Where API Key is Used

The API key is read from environment variables in `apps/web/app/api/gateway/route.ts`:

```typescript
const RPC_API_KEY = process.env.RPC_API_KEY || process.env.SHANNON_RPC_API_KEY;
```

It's used when routing to `rpctest.pokt.ai`:

```typescript
if (RPC_API_KEY && (rpcUrl.includes('rpctest.pokt.ai') || rpcUrl.includes('rpc.pokt.ai'))) {
  headers['X-API-Key'] = RPC_API_KEY;
}
```

## Where to Set It

### Option 1: Add to docker-compose.yml (Recommended)

Add to `infra/docker-compose.yml` in the `web` service:

```yaml
web:
  environment:
    # ... existing env vars ...
    RPC_API_KEY: your_api_key_here
    # OR
    SHANNON_RPC_API_KEY: your_api_key_here
```

### Option 2: Add to .env file

Create or update `infra/.env`:

```bash
RPC_API_KEY=your_api_key_here
```

Then reference it in `docker-compose.yml`:

```yaml
web:
  env_file:
    - .env
  environment:
    RPC_API_KEY: ${RPC_API_KEY}
```

### Option 3: Generate New API Key

Use the provided script:

```bash
./create-rpc-api-key.sh
```

This will:
1. Generate a secure API key
2. Register it with the gateway
3. Show you how to use it

## Do You Need It?

**If using PATH Gateway** (`USE_LOCAL_NODE=true`):
- ✅ **You DON'T need the API key** - PATH gateway handles routing
- PATH gateway uses `App-Address` header instead

**If routing directly to rpctest.pokt.ai**:
- ⚠️ **You DO need the API key** - `rpctest.pokt.ai` requires authentication

## Check Current Configuration

```bash
# Check if API key is set in web container
docker exec <web-container-name> printenv | grep RPC_API_KEY

# Check if PATH gateway is being used
docker exec <web-container-name> printenv | grep USE_LOCAL_NODE
```

## Current docker-compose.yml Status

Looking at your `infra/docker-compose.yml`:
- ✅ `USE_LOCAL_NODE: 'true'` - PATH gateway enabled
- ✅ `LOCAL_GATEWAY_URL: http://host.docker.internal:3069` - PATH gateway URL
- ✅ `PATH_GATEWAY_APP_ADDRESS` - App address configured
- ❌ `RPC_API_KEY` - **NOT SET** (but may not be needed if PATH gateway works)

## Recommendation

Since you're using PATH gateway, you **probably don't need** the API key. However, if endpoints are still routing to `rpctest.pokt.ai` directly (instead of PATH gateway), you would need to:

1. **Set the API key** in `docker-compose.yml`
2. **OR** ensure PATH gateway routing is working correctly

## Test Without API Key

If PATH gateway is working, your endpoint should work without the API key:

```bash
curl -X POST "https://pokt.ai/api/gateway?endpoint=ethpath_1764014188689_1764014188693" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

If you get "API key required" error, then PATH gateway routing isn't working and you need to either:
1. Fix PATH gateway routing, OR
2. Set the `RPC_API_KEY` environment variable

