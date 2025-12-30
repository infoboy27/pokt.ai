# How Different Chains Work with PATH Gateway

## Overview

When customers use different chains (BSC, Kava, text-to-text, etc.), the system automatically routes them through PATH gateway using the `Target-Service-Id` header. Each chain can have its own app address for multi-tenant support.

## How It Works

### 1. Chain Detection

When a request comes in for an endpoint:

```typescript
// Gateway route detects the chain from the network configuration
const network = networks[0]; // Get network for this endpoint
const chainId = network.code || network.chain_id?.toString() || 'eth';
// Examples: 'eth', 'bsc', 'kava', 'text-to-text'
```

### 2. Service ID Mapping

The chain ID is mapped to a PATH gateway service ID:

```typescript
const chainToServiceId: Record<string, string> = {
  // Ethereum
  '1': 'eth',
  'eth': 'eth',
  
  // BSC
  '56': 'bsc',
  'bsc': 'bsc',
  
  // Kava (chain_id: 2222)
  '2222': 'kava',
  'kava': 'kava',
  
  // text-to-text (for LLM services)
  'text-to-text': 'text-to-text',
  
  // ... other chains
};

const serviceId = chainToServiceId[chainId] || chainId;
```

### 3. PATH Gateway Routing

The gateway sends the request to PATH gateway with the appropriate headers:

```typescript
// All requests go to the same PATH gateway URL
rpcUrl = "http://host.docker.internal:3069/v1"

// But with different Target-Service-Id header
headers['Target-Service-Id'] = serviceId; // 'eth', 'bsc', 'kava', 'text-to-text', etc.
headers['App-Address'] = networkAppAddress; // Per-network or global app address
```

### 4. PATH Gateway Routes to Correct Chain

PATH gateway reads the `Target-Service-Id` header and routes to the correct fallback endpoint:

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
      - default_url: "http://eth-weavers.eu.nodefleet.net"
```

## Example Flows

### Example 1: Customer Uses BSC

**Request:**
```bash
POST https://pokt.ai/api/gateway?endpoint=bsc_endpoint_123
{
  "jsonrpc": "2.0",
  "method": "eth_blockNumber",
  "params": [],
  "id": 1
}
```

**Flow:**
1. Gateway detects: `chainId = 'bsc'` (from network.code)
2. Maps to: `serviceId = 'bsc'`
3. Routes to: `http://host.docker.internal:3069/v1`
4. Adds headers:
   - `Target-Service-Id: bsc`
   - `App-Address: pokt1...` (from network.path_app_address or global)
5. PATH gateway routes to: `https://bsc-dataseed.binance.org`
6. Returns BSC blockchain data

### Example 2: Customer Uses Kava

**Request:**
```bash
POST https://pokt.ai/api/gateway?endpoint=kava_endpoint_456
{
  "jsonrpc": "2.0",
  "method": "eth_blockNumber",
  "params": [],
  "id": 1
}
```

**Flow:**
1. Gateway detects: `chainId = 'kava'` (from network.code)
2. Maps to: `serviceId = 'kava'`
3. Routes to: `http://host.docker.internal:3069/v1`
4. Adds headers:
   - `Target-Service-Id: kava`
   - `App-Address: pokt1...` (from network.path_app_address or global)
5. PATH gateway routes to: `http://kava-archival-weavers.eu.nodefleet.net`
6. Returns Kava blockchain data

### Example 3: Customer Uses text-to-text (LLM)

**Request:**
```bash
POST https://pokt.ai/api/gateway?endpoint=llm_endpoint_789
{
  "jsonrpc": "2.0",
  "method": "eth_blockNumber", // or LLM-specific method
  "params": [],
  "id": 1
}
```

**Flow:**
1. Gateway detects: `chainId = 'text-to-text'` (from network.code)
2. Maps to: `serviceId = 'text-to-text'`
3. Routes to: `http://host.docker.internal:3069/v1`
4. Adds headers:
   - `Target-Service-Id: text-to-text`
   - `App-Address: pokt1...` (from network.path_app_address or global)
5. PATH gateway routes to: configured LLM endpoint
6. Returns LLM response

## Multi-Tenant Support Per Chain

### Each Chain Can Have Its Own App Address

**Customer A - Ethereum:**
```sql
INSERT INTO networks (code, chain_id, path_app_address, endpoint_id)
VALUES ('eth', 1, 'pokt1customerA_eth...', 'endpoint_A');
```

**Customer B - BSC:**
```sql
INSERT INTO networks (code, chain_id, path_app_address, endpoint_id)
VALUES ('bsc', 56, 'pokt1customerB_bsc...', 'endpoint_B');
```

**Customer C - Uses Global App Address:**
```sql
INSERT INTO networks (code, chain_id, path_app_address, endpoint_id)
VALUES ('eth', 1, NULL, 'endpoint_C');
-- Uses global PATH_GATEWAY_APP_ADDRESS
```

### How App Address is Determined

```typescript
// Priority order:
1. network.path_app_address (if set) ← Customer-specific
2. PATH_GATEWAY_APP_ADDRESS (global fallback) ← Shared
```

## Adding New Chains

### Step 1: Add to chainToServiceId Mapping

```typescript
// apps/web/app/api/gateway/route.ts
const chainToServiceId: Record<string, string> = {
  // ... existing chains ...
  
  // New chain
  '2222': 'kava',        // Chain ID to service ID
  'kava': 'kava',        // Chain code to service ID
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
      - default_url: "https://new-chain-rpc-endpoint.com"
```

### Step 3: Add to Database Chain Mapping (Optional)

```typescript
// apps/web/lib/database.ts
const chainMapping: Record<number, { code: string; rpcUrl: string }> = {
  // ... existing chains ...
  2222: { code: 'kava', rpcUrl: 'https://rpctest.pokt.ai' },
};
```

## What Happens If Chain Isn't Configured?

### Scenario 1: Chain Not in chainToServiceId

```typescript
const serviceId = chainToServiceId[chainId] || chainId;
// Falls back to using chainId as serviceId
```

**Result**: PATH gateway will try to route using `chainId` as `serviceId`. If PATH gateway doesn't have that service configured, it will fail.

### Scenario 2: Chain Not in PATH Gateway Config

If PATH gateway doesn't have the service configured:

**Result**: PATH gateway will return an error. The system should handle this gracefully and potentially fall back to direct RPC (if configured).

### Scenario 3: Chain Not Supported

If the chain isn't supported at all:

**Result**: Gateway returns:
```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32003,
    "message": "Chain 'unsupported-chain' not supported"
  },
  "id": null
}
```

## Current Supported Chains

Based on `chainToServiceId` mapping:

✅ **Ethereum** (`eth`) - Chain ID: 1
✅ **BSC** (`bsc`) - Chain ID: 56
✅ **Polygon** (`poly`) - Chain ID: 137
✅ **Arbitrum** (`arb-one`) - Chain ID: 42161
✅ **Optimism** (`opt`) - Chain ID: 10
✅ **Base** (`base`) - Chain ID: 8453
✅ **Avalanche** (`avax`) - Chain ID: 43114
✅ **Solana** (`solana`)
✅ **Kava** (`kava`) - Chain ID: 2222 (needs to be added)
✅ **text-to-text** (`text-to-text`) - For LLM services (needs to be added)

## PATH Gateway Configuration Status

From `gateway_config.yaml`:

✅ **eth** - Configured
✅ **bsc** - Configured
✅ **kava** - Configured
✅ **text-to-text** - Configured

## Summary

✅ **All chains route through PATH gateway** when `USE_LOCAL_NODE=true`
✅ **Each chain uses its own `Target-Service-Id`** header
✅ **Each chain can have its own app address** (multi-tenant support)
✅ **PATH gateway routes to correct blockchain** based on service ID
✅ **New chains can be added** by updating mappings and PATH gateway config

The system is designed to handle multiple chains seamlessly! 🎉

