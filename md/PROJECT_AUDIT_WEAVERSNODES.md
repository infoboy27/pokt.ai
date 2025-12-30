# Project Audit: pokt.ai RPC Provider Architecture

## Date: 2025-01-XX

## Executive Summary

This audit examines how pokt.ai uses RPC providers and configures the system to use `gateway.weaversnodes.org` with 27 supported blockchain networks.

---

## 1. Current Architecture

### 1.1 RPC Provider Flow

```
User Request → pokt.ai Gateway (/api/gateway) → RPC Provider
```

**Current Options:**
1. **Direct to rpctest.pokt.ai** (default)
   - URL: `https://rpctest.pokt.ai/v1/rpc/{chain}`
   - Uses `X-API-Key` header for authentication

2. **PATH Gateway** (local/remote)
   - URL: `http://localhost:3069/v1` or configured URL
   - Uses headers:
     - `Target-Service-Id`: Chain service ID (e.g., 'eth', 'bsc')
     - `App-Address`: Pocket Network app address

### 1.2 Key Files

- **Gateway Route**: `apps/web/app/api/gateway/route.ts`
  - Handles all RPC requests
  - Maps chain IDs to service IDs
  - Routes to appropriate RPC provider

- **Configuration**: `infra/docker-compose.yml`
  - Environment variables for gateway configuration
  - Per-chain app addresses

### 1.3 Chain Mapping System

**Chain Detection:**
1. Request comes in with endpoint ID
2. System looks up endpoint → network configuration
3. Extracts chain ID (e.g., 'eth', 'bsc', '137')
4. Maps to service ID via `chainToServiceId`
5. Routes to RPC provider with appropriate headers

**Current Supported Chains:**
- Ethereum (eth)
- Polygon (poly)
- BSC (bsc)
- Arbitrum (arb-one)
- Optimism (opt)
- Base (base)
- Avalanche (avax)
- Kava (kava)
- Solana (solana)
- text-to-text (LLM)

---

## 2. WeaversNodes Gateway Integration

### 2.1 Gateway Details

**URL**: `https://gateway.weaversnodes.org/v1`

**Protocol**: Same as PATH gateway
- Uses `/v1` endpoint (not `/v1/rpc/{chain}`)
- Routes via `Target-Service-Id` header
- Requires `App-Address` header per chain

### 2.2 Supported Chains (27 total)

| Service ID           | App Address                                 | Chain ID | Notes                    |
| -------------------- | ------------------------------------------- | -------- | ------------------------ |
| eth                  | pokt1zp90apxzym50uu6jt89p30urd69gfp7nu2u2w9 | 1        | Ethereum Mainnet         |
| avax                 | pokt16l4v7k8ks7u0ymgj0utxu6fjdy62jhp8t85wzr | 43114    | Avalanche C-Chain         |
| bsc                  | pokt1du5ve83cj92qx0swvym7s6934a2rver68jje2z | 56       | Binance Smart Chain       |
| opt                  | pokt1hcn484sc9w3xqdwajv7cz06wys3r4az999ds36 | 10       | Optimism                  |
| opt-sepolia-testnet  | pokt1d465ferla2t2qacj88290ucqhqqflak34jevtu | 11155420 | Optimism Sepolia          |
| arb-one              | pokt1ew5j579vqjes85g7rprvyd6zt9qndc3m9edx8w | 42161    | Arbitrum One              |
| base                 | pokt1lylg9luqsvlwtynvu6kjse5qp98phyfwh9jgys | 8453     | Base                      |
| linea                | pokt1t787eh3punnjrmp8j5metng52jpnvzu0s4nmwz | 59144    | Linea                     |
| mantle               | pokt1uzdsuerd7ccpkd5xdm83jhmv4g2rfsr223vf70 | 5000     | Mantle                    |
| bera                 | pokt15789ykufjy46p06kszkpnw2clf22z4248vkx68 | 80094    | Bera Chain                |
| fuse                 | pokt1k9kycneld3fkl4xzqc6h95m7elrwfez2e0rx2x | 122      | Fuse Network              |
| fraxtal              | pokt132gsqxk77e47jyfe5mhkjgl0ujnrk2mdn6t2qx | 252      | Fraxtal                   |
| metis                | pokt18498w7s4fgs95fywl8dftyznhk80sqmdh66m2a | 1088     | Metis                     |
| blast                | pokt1ksfan89g3gengqvzh4hyr728p902l4l8aaytxe | 81457    | Blast                     |
| arb-sepolia-testnet  | pokt19m003r2agfr9wv7qldm9ak7g7lkfu8tyx20vxz | 421614   | Arbitrum Sepolia          |
| base-sepolia-testnet | pokt1339ddj4v4zangj4svjqfh3n2307zvmm4mfqzmy | 84532    | Base Sepolia              |
| boba                 | pokt14mpsqly7xyyn4hpcaelmn49dq4pkws9wr7fh6f | 288      | Boba Network              |
| eth-holesky-testnet  | pokt19z9kjvhwdncmjeflnasm0zglenkhly5zrse9un | 17000    | Ethereum Holesky          |
| fantom               | pokt14fnfvne4mh0m8lh63nremuxmdl5qp2kxtljkfs | 250      | Fantom                    |
| gnosis               | pokt1jcas7t3nsy9cp7k47mzwxycu2vc2hx2ynhgvr4 | 100      | Gnosis Chain              |
| ink                  | pokt105e4uw6j3ndjtjncx37mkfget667tf5tfccjff | 57073    | Ink Protocol              |
| kava                 | pokt16rg6xfywfkxgaglpykkgrvx006v9n8jveq2f2y | 2222     | Kava                      |
| oasys                | pokt1nnkjgpzzuuadyexuepuewj97p7s8hcdqapamgt | 248      | Oasys                     |
| poly                 | pokt1904q7y3v23h7gur02d6ple97celg5ysgedcw6t | 137      | Polygon                   |
| solana               | pokt1fks44f9k05gml6lyatjqsexwuch7qj8c8xuhuy | -        | Solana (uses getSlot)     |
| sonic                 | pokt18gnh7tenrxfne25daxxs2qrdxu0e0h4nd4kc9g | 146      | Sonic                     |
| eth-sepolia-testnet  | pokt1vpfcw5sqa7ypzekcdgnehhqkuqtx0hcqqh5mql | 11155111 | Ethereum Sepolia          |

---

## 3. Implementation Changes Required

### 3.1 Update Gateway Route (`apps/web/app/api/gateway/route.ts`)

**Changes:**
1. Add WeaversNodes gateway detection
2. Add all missing chains to `chainToServiceId` mapping
3. Add per-chain app address configuration
4. Update URL detection logic to support `gateway.weaversnodes.org`

### 3.2 Update Environment Configuration

**New Environment Variables:**
- `WEAVERSNODES_GATEWAY_URL`: `https://gateway.weaversnodes.org/v1`
- `USE_WEAVERSNODES_GATEWAY`: `true` (to enable WeaversNodes)
- Per-chain app addresses (already partially supported)

### 3.3 Chain Mapping Updates

**Missing Chains to Add:**
- linea, mantle, bera, fuse, fraxtal, metis, blast
- boba, fantom, gnosis, ink, oasys, sonic
- Testnets: opt-sepolia-testnet, arb-sepolia-testnet, base-sepolia-testnet, eth-holesky-testnet, eth-sepolia-testnet

---

## 4. Configuration Strategy

### 4.1 Option 1: Environment Variable Toggle

```bash
USE_WEAVERSNODES_GATEWAY=true
WEAVERSNODES_GATEWAY_URL=https://gateway.weaversnodes.org/v1
```

### 4.2 Option 2: Per-Chain App Addresses

```bash
ETH_APP_ADDRESS=pokt1zp90apxzym50uu6jt89p30urd69gfp7nu2u2w9
AVAX_APP_ADDRESS=pokt16l4v7k8ks7u0ymgj0utxu6fjdy62jhp8t85wzr
BSC_APP_ADDRESS=pokt1du5ve83cj92qx0swvym7s6934a2rver68jje2z
# ... etc for all 27 chains
```

### 4.3 Option 3: Database Configuration (Preferred)

Store per-network app addresses in `networks.path_app_address` column (already supported).

---

## 5. Testing Plan

1. **Unit Tests**: Verify chain mapping
2. **Integration Tests**: Test each chain with WeaversNodes gateway
3. **Load Tests**: Use existing `load-test-weaversnodes.js` script
4. **Production Validation**: Test with real endpoints

---

## 6. Migration Steps

1. ✅ Audit current implementation
2. ⏳ Update gateway route code
3. ⏳ Add all chain mappings
4. ⏳ Configure environment variables
5. ⏳ Test with sample requests
6. ⏳ Deploy to production

---

## 7. Risk Assessment

**Low Risk:**
- Gateway protocol is identical to PATH gateway
- Headers are already supported
- Per-chain app addresses already supported

**Medium Risk:**
- Need to ensure all 27 chains are properly mapped
- Testnet chains may need special handling

**Mitigation:**
- Comprehensive testing before production deployment
- Gradual rollout with monitoring

---

## 8. Next Steps

1. Update `apps/web/app/api/gateway/route.ts` with WeaversNodes support
2. Add all missing chains to `chainToServiceId` mapping
3. Add per-chain app address configuration
4. Update `docker-compose.yml` with environment variables
5. Test with sample requests for each chain
6. Deploy and monitor

