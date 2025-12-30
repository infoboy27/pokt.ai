# Chain App Address Configuration Guide

## Overview

The system now supports **per-chain default app addresses** that can be configured by administrators. These defaults are used when customers create endpoints without specifying their own app address.

## Configuration Hierarchy

The app address is determined in this priority order:

1. **`network.path_app_address`** (Database) - Customer-specific override per network
2. **`CHAIN_APP_ADDRESSES[chainCode]`** (Environment) - Per-chain default
3. **`PATH_GATEWAY_APP_ADDRESS`** (Environment) - Global fallback

## Where to Configure

### Option 1: Environment Variables (Recommended)

Add to `infra/docker-compose.yml`:

```yaml
web:
  environment:
    # Global fallback (used if chain-specific not set)
    PATH_GATEWAY_APP_ADDRESS: pokt1q89a5tyhaq5xh49ec5n2wqn5zhynw6fmve06sv
    
    # Per-chain default app addresses
    ETH_APP_ADDRESS: pokt1q89a5tyhaq5xh49ec5n2wqn5zhynw6fmve06sv
    BSC_APP_ADDRESS: pokt17uus8phtheqhz9dv5dlcmv0y7s95d3fn59xg5w
    KAVA_APP_ADDRESS: pokt1u4lvv3z5yla272vdqv7grp37ltaz7rmkzdkksp
    TEXT_TO_TEXT_APP_ADDRESS: pokt14ng2mx2uux8cg8yr0dfp3kkna9apntkg6mtxpw
    
    # Optional: Add more chains
    POLY_APP_ADDRESS: pokt1...
    ARB_APP_ADDRESS: pokt1...
    OPT_APP_ADDRESS: pokt1...
    BASE_APP_ADDRESS: pokt1...
    AVAX_APP_ADDRESS: pokt1...
```

### Option 2: .env File

Create or update `infra/.env`:

```bash
# Global fallback
PATH_GATEWAY_APP_ADDRESS=pokt1q89a5tyhaq5xh49ec5n2wqn5zhynw6fmve06sv

# Per-chain defaults
ETH_APP_ADDRESS=pokt1q89a5tyhaq5xh49ec5n2wqn5zhynw6fmve06sv
BSC_APP_ADDRESS=pokt17uus8phtheqhz9dv5dlcmv0y7s95d3fn59xg5w
KAVA_APP_ADDRESS=pokt1u4lvv3z5yla272vdqv7grp37ltaz7rmkzdkksp
TEXT_TO_TEXT_APP_ADDRESS=pokt14ng2mx2uux8cg8yr0dfp3kkna9apntkg6mtxpw
```

Then reference in `docker-compose.yml`:

```yaml
web:
  env_file:
    - .env
```

## Current Configuration

Based on your provided app addresses:

✅ **ETH**: `pokt1q89a5tyhaq5xh49ec5n2wqn5zhynw6fmve06sv`
✅ **BSC**: `pokt17uus8phtheqhz9dv5dlcmv0y7s95d3fn59xg5w`
✅ **Kava**: `pokt1u4lvv3z5yla272vdqv7grp37ltaz7rmkzdkksp`
✅ **text-to-text**: `pokt14ng2mx2uux8cg8yr0dfp3kkna9apntkg6mtxpw`

These have been added to `docker-compose.yml` as environment variables.

## Who Configures This?

### 1. **Administrators** (You)

**Responsibility**: Set default app addresses per chain in environment variables

**Where**: `infra/docker-compose.yml` or `infra/.env`

**When**: 
- Initial setup
- When adding new chains
- When app addresses change

### 2. **Customers** (Optional)

**Responsibility**: Can override defaults by setting `pathAppAddress` when creating endpoints

**Where**: Database (`networks.path_app_address` column)

**How**: Via API when creating endpoints:

```bash
POST /api/endpoints
{
  "name": "My Endpoint",
  "chainId": 1,
  "pathAppAddress": "pokt1customer123..."  # Optional: overrides default
}
```

## How It Works

### Example 1: Customer Creates ETH Endpoint (Uses Default)

**Customer creates endpoint:**
```bash
POST /api/endpoints
{
  "name": "My ETH Endpoint",
  "chainId": 1
  # No pathAppAddress specified
}
```

**What happens:**
1. Network created: `code = 'eth'`, `path_app_address = NULL`
2. Gateway detects: `chainCode = 'eth'`
3. Uses: `ETH_APP_ADDRESS` from environment = `pokt1q89a5tyhaq5xh49ec5n2wqn5zhynw6fmve06sv`
4. Request sent with: `App-Address: pokt1q89a5tyhaq5xh49ec5n2wqn5zhynw6fmve06sv`

### Example 2: Customer Creates BSC Endpoint (Uses Default)

**Customer creates endpoint:**
```bash
POST /api/endpoints
{
  "name": "My BSC Endpoint",
  "chainId": 56
  # No pathAppAddress specified
}
```

**What happens:**
1. Network created: `code = 'bsc'`, `path_app_address = NULL`
2. Gateway detects: `chainCode = 'bsc'`
3. Uses: `BSC_APP_ADDRESS` from environment = `pokt17uus8phtheqhz9dv5dlcmv0y7s95d3fn59xg5w`
4. Request sent with: `App-Address: pokt17uus8phtheqhz9dv5dlcmv0y7s95d3fn59xg5w`

### Example 3: Customer Overrides Default

**Customer creates endpoint:**
```bash
POST /api/endpoints
{
  "name": "My Custom ETH Endpoint",
  "chainId": 1,
  "pathAppAddress": "pokt1customer123..."  # Custom app address
}
```

**What happens:**
1. Network created: `code = 'eth'`, `path_app_address = 'pokt1customer123...'`
2. Gateway detects: `chainCode = 'eth'`
3. Uses: `network.path_app_address` = `pokt1customer123...` (overrides default)
4. Request sent with: `App-Address: pokt1customer123...`

## Code Implementation

The gateway route uses this logic:

```typescript
// Priority order:
const networkAppAddress = 
  network.path_app_address ||                    // 1. Customer override (database)
  CHAIN_APP_ADDRESSES[chainCode] ||             // 2. Chain default (environment)
  CHAIN_APP_ADDRESSES[chainId] ||               // 3. Chain default by ID (environment)
  PATH_GATEWAY_APP_ADDRESS;                     // 4. Global fallback (environment)
```

## Environment Variable Naming Convention

Format: `{CHAIN_CODE}_APP_ADDRESS`

Examples:
- `ETH_APP_ADDRESS` for Ethereum
- `BSC_APP_ADDRESS` for BSC
- `KAVA_APP_ADDRESS` for Kava
- `TEXT_TO_TEXT_APP_ADDRESS` for text-to-text (use underscores)
- `POLY_APP_ADDRESS` for Polygon
- `ARB_APP_ADDRESS` for Arbitrum

## Updating Configuration

### To Update App Addresses

1. **Edit `docker-compose.yml`**:
   ```yaml
   ETH_APP_ADDRESS: new_address_here
   ```

2. **Restart web container**:
   ```bash
   cd /home/shannon/poktai/infra
   docker compose restart web
   ```

### To Add New Chain

1. **Add to `docker-compose.yml`**:
   ```yaml
   NEW_CHAIN_APP_ADDRESS: pokt1...
   ```

2. **Add to code** (if needed):
   ```typescript
   // apps/web/app/api/gateway/route.ts
   const CHAIN_APP_ADDRESSES: Record<string, string> = {
     // ... existing ...
     'new-chain': process.env.NEW_CHAIN_APP_ADDRESS || process.env.PATH_GATEWAY_APP_ADDRESS || '',
   };
   ```

3. **Restart web container**

## Verification

### Check Current Configuration

```bash
# Check environment variables in web container
docker exec <web-container-name> printenv | grep APP_ADDRESS
```

Expected output:
```
PATH_GATEWAY_APP_ADDRESS=pokt1q89a5tyhaq5xh49ec5n2wqn5zhynw6fmve06sv
ETH_APP_ADDRESS=pokt1q89a5tyhaq5xh49ec5n2wqn5zhynw6fmve06sv
BSC_APP_ADDRESS=pokt17uus8phtheqhz9dv5dlcmv0y7s95d3fn59xg5w
KAVA_APP_ADDRESS=pokt1u4lvv3z5yla272vdqv7grp37ltaz7rmkzdkksp
TEXT_TO_TEXT_APP_ADDRESS=pokt14ng2mx2uux8cg8yr0dfp3kkna9apntkg6mtxpw
```

### Test Endpoint Uses Correct App Address

```bash
# Create endpoint without pathAppAddress
curl -X POST "https://pokt.ai/api/endpoints" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test ETH", "chainId": 1}'

# Check which app address is used
# (Check logs or database to verify)
```

## Summary

✅ **Administrators configure** default app addresses per chain in environment variables
✅ **Customers can override** by setting `pathAppAddress` when creating endpoints
✅ **Priority system** ensures correct app address is used
✅ **Current defaults** are configured in `docker-compose.yml`

The system is now ready with per-chain default app addresses! 🎉

