# How Different Chains Route Through PATH Gateway

## Quick Answer

**All chains route through the same PATH gateway URL** (`http://host.docker.internal:3069/v1`), but PATH gateway uses the **`Target-Service-Id` header** to route to the correct blockchain.

## How It Works

### 1. Request Flow for Any Chain

```
Customer Request
    ↓
pokt.ai Gateway (detects chain from endpoint)
    ↓
Maps chainId → serviceId (e.g., 'bsc' → 'bsc', 'kava' → 'kava')
    ↓
Routes to PATH Gateway: http://host.docker.internal:3069/v1
    ↓
Adds Headers:
  - Target-Service-Id: {serviceId}  ← This tells PATH which chain
  - App-Address: {appAddress}        ← Customer's app address
    ↓
PATH Gateway reads Target-Service-Id
    ↓
Routes to correct blockchain endpoint
    ↓
Returns response
```

### 2. Example: BSC Chain

**Customer creates BSC endpoint:**
```sql
INSERT INTO networks (code, chain_id, endpoint_id)
VALUES ('bsc', 56, 'bsc_endpoint_123');
```

**Request:**
```bash
POST https://pokt.ai/api/gateway?endpoint=bsc_endpoint_123
```

**What happens:**
1. Gateway detects: `chainId = 'bsc'` (from network.code)
2. Maps to: `serviceId = 'bsc'` (from chainToServiceId mapping)
3. Routes to: `http://host.docker.internal:3069/v1` (same URL for all chains)
4. Adds header: `Target-Service-Id: bsc` ← **This is the key!**
5. PATH gateway sees `Target-Service-Id: bsc` and routes to BSC endpoint
6. Returns BSC blockchain data

### 3. Example: Kava Chain

**Customer creates Kava endpoint:**
```sql
INSERT INTO networks (code, chain_id, endpoint_id)
VALUES ('kava', 2222, 'kava_endpoint_456');
```

**Request:**
```bash
POST https://pokt.ai/api/gateway?endpoint=kava_endpoint_456
```

**What happens:**
1. Gateway detects: `chainId = 'kava'`
2. Maps to: `serviceId = 'kava'`
3. Routes to: `http://host.docker.internal:3069/v1` (same URL)
4. Adds header: `Target-Service-Id: kava` ← Different service ID!
5. PATH gateway routes to Kava endpoint
6. Returns Kava blockchain data

### 4. Example: text-to-text (LLM)

**Customer creates text-to-text endpoint:**
```sql
INSERT INTO networks (code, endpoint_id)
VALUES ('text-to-text', 'llm_endpoint_789');
```

**Request:**
```bash
POST https://pokt.ai/api/gateway?endpoint=llm_endpoint_789
```

**What happens:**
1. Gateway detects: `chainId = 'text-to-text'`
2. Maps to: `serviceId = 'text-to-text'`
3. Routes to: `http://host.docker.internal:3069/v1` (same URL)
4. Adds header: `Target-Service-Id: text-to-text` ← LLM service!
5. PATH gateway routes to LLM endpoint
6. Returns LLM response

## Key Points

### ✅ Same PATH Gateway URL for All Chains

All requests go to: `http://host.docker.internal:3069/v1`

**Why?** PATH gateway uses header-based routing, not URL-based routing.

### ✅ Different Target-Service-Id Header

Each chain gets a different `Target-Service-Id` header:
- Ethereum: `Target-Service-Id: eth`
- BSC: `Target-Service-Id: bsc`
- Kava: `Target-Service-Id: kava`
- text-to-text: `Target-Service-Id: text-to-text`

### ✅ PATH Gateway Routes Based on Service ID

PATH gateway reads the `Target-Service-Id` header and routes to the configured fallback endpoint:

```yaml
# gateway_config.yaml
service_fallback:
  - service_id: eth
    fallback_endpoints:
      - default_url: "http://eth-weavers.eu.nodefleet.net"
  
  - service_id: bsc
    fallback_endpoints:
      - default_url: "https://bsc-dataseed.binance.org"
  
  - service_id: kava
    fallback_endpoints:
      - default_url: "http://kava-archival-weavers.eu.nodefleet.net"
  
  - service_id: text-to-text
    fallback_endpoints:
      - default_url: "http://eth-weavers.eu.nodefleet.net" # LLM endpoint
```

## Multi-Tenant Support

### Each Chain Can Have Its Own App Address

**Customer A - BSC with custom app address:**
```sql
INSERT INTO networks (code, chain_id, path_app_address, endpoint_id)
VALUES ('bsc', 56, 'pokt1customerA_bsc...', 'bsc_endpoint_A');
```

**Customer B - BSC with shared app address:**
```sql
INSERT INTO networks (code, chain_id, path_app_address, endpoint_id)
VALUES ('bsc', 56, NULL, 'bsc_endpoint_B');
-- Uses global PATH_GATEWAY_APP_ADDRESS
```

**Result:**
- Customer A's BSC requests use: `App-Address: pokt1customerA_bsc...`
- Customer B's BSC requests use: `App-Address: pokt1q89a5tyhaq5xh49ec5n2wqn5zhynw6fmve06sv` (global)

## Adding New Chains

### Step 1: Add Service ID Mapping

```typescript
// apps/web/app/api/gateway/route.ts
const chainToServiceId: Record<string, string> = {
  // ... existing ...
  'new-chain-id': 'new-service-id',
  'new-chain': 'new-service-id',
};
```

### Step 2: Add to PATH Gateway Config

```yaml
# gateway_config.yaml
service_fallback:
  - service_id: new-service-id
    send_all_traffic: true
    fallback_endpoints:
      - default_url: "https://new-chain-rpc.com"
```

### Step 3: Add to Database Chain Mapping (Optional)

```typescript
// apps/web/lib/database.ts
const chainMapping: Record<number, { code: string; rpcUrl: string }> = {
  // ... existing ...
  12345: { code: 'new-chain', rpcUrl: 'https://rpctest.pokt.ai' },
};
```

## Current Supported Chains

✅ **Ethereum** (`eth`) - Chain ID: 1
✅ **BSC** (`bsc`) - Chain ID: 56  
✅ **Kava** (`kava`) - Chain ID: 2222
✅ **text-to-text** (`text-to-text`) - For LLM services
✅ **Polygon** (`poly`) - Chain ID: 137
✅ **Arbitrum** (`arb-one`) - Chain ID: 42161
✅ **Optimism** (`opt`) - Chain ID: 10
✅ **Base** (`base`) - Chain ID: 8453
✅ **Avalanche** (`avax`) - Chain ID: 43114
✅ **Solana** (`solana`)

## Summary

🎯 **All chains use the same PATH gateway URL** (`http://host.docker.internal:3069/v1`)

🎯 **PATH gateway routes based on `Target-Service-Id` header** (not URL path)

🎯 **Each chain can have its own app address** (multi-tenant support)

🎯 **New chains can be added** by updating the service ID mapping and PATH gateway config

🎯 **The system automatically handles routing** - customers just create endpoints for their desired chain!

See `HOW_DIFFERENT_CHAINS_WORK.md` for more detailed examples.

