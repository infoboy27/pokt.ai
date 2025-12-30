# Multi-Tenant PATH Gateway Configuration

## Current Issue

**Problem**: All endpoints currently use the same `PATH_GATEWAY_APP_ADDRESS` from environment variables. This means:
- ❌ All customers share the same Pocket Network app address
- ❌ Cannot use customer-specific app addresses
- ❌ All endpoints must use the same app address that's staked for all services

## Solution: Per-Network App Address Support

### Architecture Decision

**Option 1: Per-Endpoint App Address** (Endpoint table)
- Each endpoint can have its own app address
- Simpler, but less flexible if endpoint supports multiple chains

**Option 2: Per-Network App Address** (Network table) ✅ **RECOMMENDED**
- Each network/chain can have its own app address
- More flexible: endpoint can have multiple chains with different app addresses
- Supports customers who want to use their own app addresses per chain

**Option 3: Per-Organization App Address** (Organization table)
- All endpoints in an organization share the same app address
- Good middle ground, but less flexible than per-network

### Recommended: Per-Network App Address

Add `path_app_address` field to `Network` table:

```prisma
model Network {
  id              String   @id @default(cuid())
  code            String   // e.g., "eth", "bsc"
  chainId         Int?     @map("chain_id")
  rpcUrl          String   @map("rpc_url")
  wsUrl           String?  @map("ws_url")
  pathAppAddress  String?  @map("path_app_address") // ✅ NEW: Per-network app address
  isTestnet       Boolean  @default(false) @map("is_testnet")
  isEnabled       Boolean  @default(true) @map("is_enabled")
  endpointId      String   @map("endpoint_id")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  // Relations
  endpoint Endpoint @relation(fields: [endpointId], references: [id], onDelete: Cascade)
  usages   Usage[]

  @@index([endpointId, code], name: "idx_network_endpoint_code")
  @@map("networks")
}
```

### Gateway Route Logic

Update `apps/web/app/api/gateway/route.ts` to use network-specific app address:

```typescript
// Get network-specific app address with fallback
const networkAppAddress = network.path_app_address || PATH_GATEWAY_APP_ADDRESS;

// Add headers for PATH gateway
if (USE_LOCAL_NODE && LOCAL_NODE_RPC_URL) {
  if (LOCAL_NODE_RPC_URL.includes('3069') || 
      LOCAL_NODE_RPC_URL.includes('shannon-testnet-gateway') ||
      LOCAL_NODE_RPC_URL.includes('poktroll.com') || 
      LOCAL_NODE_RPC_URL.includes('shannon')) {
    headers['Target-Service-Id'] = serviceId;
    // Use network-specific app address, fallback to global
    if (networkAppAddress) {
      headers['App-Address'] = networkAppAddress;
    }
  }
}
```

## Benefits

✅ **Multi-Tenant Support**: Each customer can use their own app addresses
✅ **Flexibility**: Different chains can use different app addresses
✅ **Backward Compatible**: Falls back to global `PATH_GATEWAY_APP_ADDRESS` if not set
✅ **Isolation**: Customer A's app address won't affect Customer B's requests

## Migration Path

1. **Add Database Column**: Add `path_app_address` to `networks` table
2. **Update Gateway Route**: Use network-specific app address with fallback
3. **Update Endpoint Creation**: Allow setting `path_app_address` when creating endpoints
4. **Admin UI**: Add field to set/update `path_app_address` per network

## Usage Examples

### Example 1: Customer Uses Their Own App Address

```sql
-- Customer creates Ethereum endpoint with their own app address
INSERT INTO networks (id, code, chain_id, rpc_url, path_app_address, endpoint_id)
VALUES (
  'network_123',
  'eth',
  1,
  'https://rpctest.pokt.ai/v1/rpc/eth',
  'pokt1customer123...',  -- Customer's app address
  'endpoint_abc'
);
```

### Example 2: Customer Uses Shared App Address (Default)

```sql
-- Customer creates endpoint without path_app_address
-- Gateway will use PATH_GATEWAY_APP_ADDRESS from environment
INSERT INTO networks (id, code, chain_id, rpc_url, endpoint_id)
VALUES (
  'network_456',
  'bsc',
  56,
  'https://rpctest.pokt.ai/v1/rpc/bsc',
  'endpoint_xyz'
);
```

### Example 3: Different Chains, Different App Addresses

```sql
-- Endpoint supports multiple chains with different app addresses
INSERT INTO networks (id, code, chain_id, rpc_url, path_app_address, endpoint_id)
VALUES 
  ('network_1', 'eth', 1, 'https://rpctest.pokt.ai/v1/rpc/eth', 'pokt1eth123...', 'endpoint_multi'),
  ('network_2', 'bsc', 56, 'https://rpctest.pokt.ai/v1/rpc/bsc', 'pokt1bsc456...', 'endpoint_multi');
```

## Implementation Steps

1. ✅ Create migration to add `path_app_address` column
2. ✅ Update Prisma schema
3. ✅ Update gateway route logic
4. ✅ Update network creation/update queries
5. ✅ Add admin UI for managing app addresses
6. ✅ Update API endpoints to accept `path_app_address`

## Current Status

**Current Configuration**:
- All endpoints use: `PATH_GATEWAY_APP_ADDRESS=pokt1q89a5tyhaq5xh49ec5n2wqn5zhynw6fmve06sv`
- This app address must be staked for ALL services (eth, bsc, kava, etc.)

**After Implementation**:
- Each network can have its own `path_app_address`
- Falls back to global `PATH_GATEWAY_APP_ADDRESS` if not set
- Supports multi-tenant scenarios where customers use their own app addresses

