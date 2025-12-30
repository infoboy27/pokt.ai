# Current PATH Gateway Configuration Status

## ❌ Current Issue: Not Multi-Tenant Ready

**Problem**: The current configuration uses a **single global app address** for all endpoints:

```yaml
# docker-compose.yml
PATH_GATEWAY_APP_ADDRESS: pokt1q89a5tyhaq5xh49ec5n2wqn5zhynw6fmve06sv
```

This means:
- ❌ **All customers share the same app address**
- ❌ **Cannot use customer-specific app addresses**
- ❌ **The app address must be staked for ALL services** (eth, bsc, kava, etc.)
- ❌ **No isolation between customers**

## ✅ Solution Implemented: Per-Network App Address Support

### Changes Made

1. **Database Schema** (`apps/api/prisma/schema.prisma`):
   - Added `pathAppAddress` field to `Network` model
   - Optional field: falls back to global `PATH_GATEWAY_APP_ADDRESS` if not set

2. **Gateway Route** (`apps/web/app/api/gateway/route.ts`):
   - Updated to use network-specific `path_app_address` first
   - Falls back to global `PATH_GATEWAY_APP_ADDRESS` if network doesn't have one
   - Supports multi-tenant scenarios

### How It Works Now

```typescript
// Gateway route logic (simplified)
const network = networks[0]; // Get network for this endpoint
const networkAppAddress = network.path_app_address || PATH_GATEWAY_APP_ADDRESS;

// Use network-specific app address
if (networkAppAddress) {
  headers['App-Address'] = networkAppAddress;
}
```

### Usage Scenarios

#### Scenario 1: Customer Uses Shared App Address (Default)
```sql
-- Network created without path_app_address
-- Uses global PATH_GATEWAY_APP_ADDRESS from environment
INSERT INTO networks (code, chain_id, rpc_url, endpoint_id)
VALUES ('eth', 1, 'https://rpctest.pokt.ai/v1/rpc/eth', 'endpoint_123');
```

#### Scenario 2: Customer Uses Their Own App Address
```sql
-- Network created with customer's app address
INSERT INTO networks (code, chain_id, rpc_url, path_app_address, endpoint_id)
VALUES (
  'eth', 
  1, 
  'https://rpctest.pokt.ai/v1/rpc/eth',
  'pokt1customer123...',  -- Customer's own app address
  'endpoint_456'
);
```

#### Scenario 3: Different Chains, Different App Addresses
```sql
-- Endpoint supports multiple chains with different app addresses
INSERT INTO networks (code, chain_id, rpc_url, path_app_address, endpoint_id)
VALUES 
  ('eth', 1, 'https://rpctest.pokt.ai/v1/rpc/eth', 'pokt1eth123...', 'endpoint_multi'),
  ('bsc', 56, 'https://rpctest.pokt.ai/v1/rpc/bsc', 'pokt1bsc456...', 'endpoint_multi');
```

## Next Steps Required

### 1. Database Migration

Create and run migration to add `path_app_address` column:

```bash
cd apps/api
npx prisma migrate dev --name add_path_app_address_to_networks
```

Or manually:
```sql
ALTER TABLE networks ADD COLUMN path_app_address VARCHAR(255) NULL;
```

### 2. Update Network Creation Queries

Update `apps/web/lib/database.ts` to accept `pathAppAddress` parameter:

```typescript
async create(networkData: {
  endpointId: string;
  chainId: number;
  pathAppAddress?: string; // ✅ Add this
}) {
  // ... existing code ...
  const result = await query(
    `INSERT INTO networks (id, code, chain_id, rpc_url, path_app_address, ...)
     VALUES ($1, $2, $3, $4, $5, ...)
     RETURNING *`,
    [
      networkId,
      chainInfo.code,
      networkData.chainId,
      chainInfo.rpcUrl,
      networkData.pathAppAddress || null, // ✅ Add this
      // ... rest of values
    ]
  );
}
```

### 3. Update API Endpoints

Update endpoint creation APIs to accept `pathAppAddress`:
- `apps/web/app/api/endpoints/route.ts`
- `apps/api/src/endpoints/endpoints.service.ts`

### 4. Admin UI (Optional)

Add UI field to set/update `path_app_address` per network in admin panel.

## Benefits

✅ **Multi-Tenant Support**: Each customer can use their own app addresses
✅ **Flexibility**: Different chains can use different app addresses  
✅ **Backward Compatible**: Falls back to global `PATH_GATEWAY_APP_ADDRESS` if not set
✅ **Isolation**: Customer A's app address won't affect Customer B's requests
✅ **Gradual Migration**: Existing endpoints continue working without changes

## Current Status

- ✅ **Code Updated**: Gateway route supports per-network app addresses
- ✅ **Schema Updated**: Prisma schema includes `pathAppAddress` field
- ⚠️ **Migration Needed**: Database migration required to add column
- ⚠️ **API Updates Needed**: Endpoint creation APIs need to accept `pathAppAddress`

## Testing

After migration, test with:

```bash
# Test endpoint with default app address (uses global PATH_GATEWAY_APP_ADDRESS)
curl -X POST "https://pokt.ai/api/gateway?endpoint=test_endpoint" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Test endpoint with custom app address (if database updated)
# Should use network.path_app_address instead of global PATH_GATEWAY_APP_ADDRESS
```

