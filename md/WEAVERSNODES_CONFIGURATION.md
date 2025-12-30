# WeaversNodes Gateway Configuration

## Summary

The pokt.ai gateway has been updated to support `gateway.weaversnodes.org` with all 27 blockchain networks.

## Changes Made

### 1. Gateway Route Updates (`apps/web/app/api/gateway/route.ts`)

✅ **Added WeaversNodes Gateway Support**
- New environment variable: `USE_WEAVERSNODES_GATEWAY`
- New environment variable: `WEAVERSNODES_GATEWAY_URL` (defaults to `https://gateway.weaversnodes.org/v1`)

✅ **Added All 27 Chains to `chainToServiceId` Mapping**
- Mainnets: eth, avax, bsc, opt, arb-one, base, linea, mantle, bera, fuse, fraxtal, metis, blast, boba, fantom, gnosis, ink, kava, oasys, poly, solana, sonic
- Testnets: opt-sepolia-testnet, arb-sepolia-testnet, base-sepolia-testnet, eth-holesky-testnet, eth-sepolia-testnet

✅ **Added Per-Chain App Addresses**
- All 27 chains now have default app addresses from WeaversNodes
- App addresses can be overridden via:
  1. Database `networks.path_app_address` (per-network)
  2. Environment variables (e.g., `ETH_APP_ADDRESS`)
  3. Global `PATH_GATEWAY_APP_ADDRESS`

✅ **Updated RPC URL Detection**
- Priority order:
  1. WeaversNodes Gateway (if `USE_WEAVERSNODES_GATEWAY=true`)
  2. PATH gateway (if `USE_LOCAL_NODE=true`)
  3. Network's `rpc_url` (from database)
  4. Default chain mapping

✅ **Updated Header Logic**
- Automatically adds `Target-Service-Id` and `App-Address` headers for gateway requests
- Works with WeaversNodes, PATH gateway, and Shannon testnet

## Configuration

### Environment Variables

Add to `infra/docker-compose.yml` or `.env`:

```bash
# Enable WeaversNodes Gateway
USE_WEAVERSNODES_GATEWAY=true
WEAVERSNODES_GATEWAY_URL=https://gateway.weaversnodes.org/v1

# Optional: Override per-chain app addresses
ETH_APP_ADDRESS=pokt1zp90apxzym50uu6jt89p30urd69gfp7nu2u2w9
AVAX_APP_ADDRESS=pokt16l4v7k8ks7u0ymgj0utxu6fjdy62jhp8t85wzr
BSC_APP_ADDRESS=pokt1du5ve83cj92qx0swvym7s6934a2rver68jje2z
# ... etc for all chains
```

### Database Configuration (Preferred)

Store app addresses in the `networks` table:

```sql
UPDATE networks 
SET path_app_address = 'pokt1zp90apxzym50uu6jt89p30urd69gfp7nu2u2w9' 
WHERE code = 'eth';
```

## Supported Chains

| Service ID           | App Address                                 | Chain ID |
| -------------------- | ------------------------------------------- | -------- |
| eth                  | pokt1zp90apxzym50uu6jt89p30urd69gfp7nu2u2w9 | 1        |
| avax                 | pokt16l4v7k8ks7u0ymgj0utxu6fjdy62jhp8t85wzr | 43114    |
| bsc                  | pokt1du5ve83cj92qx0swvym7s6934a2rver68jje2z | 56       |
| opt                  | pokt1hcn484sc9w3xqdwajv7cz06wys3r4az999ds36 | 10       |
| opt-sepolia-testnet  | pokt1d465ferla2t2qacj88290ucqhqqflak34jevtu | 11155420 |
| arb-one              | pokt1ew5j579vqjes85g7rprvyd6zt9qndc3m9edx8w | 42161    |
| base                 | pokt1lylg9luqsvlwtynvu6kjse5qp98phyfwh9jgys | 8453     |
| linea                | pokt1t787eh3punnjrmp8j5metng52jpnvzu0s4nmwz | 59144    |
| mantle               | pokt1uzdsuerd7ccpkd5xdm83jhmv4g2rfsr223vf70 | 5000     |
| bera                 | pokt15789ykufjy46p06kszkpnw2clf22z4248vkx68 | 80094    |
| fuse                 | pokt1k9kycneld3fkl4xzqc6h95m7elrwfez2e0rx2x | 122      |
| fraxtal              | pokt132gsqxk77e47jyfe5mhkjgl0ujnrk2mdn6t2qx | 252      |
| metis                | pokt18498w7s4fgs95fywl8dftyznhk80sqmdh66m2a | 1088     |
| blast                | pokt1ksfan89g3gengqvzh4hyr728p902l4l8aaytxe | 81457    |
| arb-sepolia-testnet  | pokt19m003r2agfr9wv7qldm9ak7g7lkfu8tyx20vxz | 421614   |
| base-sepolia-testnet | pokt1339ddj4v4zangj4svjqfh3n2307zvmm4mfqzmy | 84532    |
| boba                 | pokt14mpsqly7xyyn4hpcaelmn49dq4pkws9wr7fh6f | 288      |
| eth-holesky-testnet  | pokt19z9kjvhwdncmjeflnasm0zglenkhly5zrse9un | 17000    |
| fantom               | pokt14fnfvne4mh0m8lh63nremuxmdl5qp2kxtljkfs | 250      |
| gnosis               | pokt1jcas7t3nsy9cp7k47mzwxycu2vc2hx2ynhgvr4 | 100      |
| ink                  | pokt105e4uw6j3ndjtjncx37mkfget667tf5tfccjff | 57073    |
| kava                 | pokt16rg6xfywfkxgaglpykkgrvx006v9n8jveq2f2y | 2222     |
| oasys                | pokt1nnkjgpzzuuadyexuepuewj97p7s8hcdqapamgt | 248      |
| poly                 | pokt1904q7y3v23h7gur02d6ple97celg5ysgedcw6t | 137      |
| solana               | pokt1fks44f9k05gml6lyatjqsexwuch7qj8c8xuhuy | -        |
| sonic                | pokt18gnh7tenrxfne25daxxs2qrdxu0e0h4nd4kc9g | 146      |
| eth-sepolia-testnet  | pokt1vpfcw5sqa7ypzekcdgnehhqkuqtx0hcqqh5mql | 11155111 |

## Testing

### Test Single Chain

```bash
# Test Ethereum
curl -X POST "https://pokt.ai/api/gateway?endpoint=YOUR_ENDPOINT_ID" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Test Solana (uses getSlot method)
curl -X POST "https://pokt.ai/api/gateway?endpoint=YOUR_ENDPOINT_ID" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"getSlot","params":[],"id":1}'
```

### Load Test

Use the existing load test script:

```bash
./run-load-test-weaversnodes.sh 500 100000
```

## Migration Steps

1. ✅ Code updated
2. ⏳ Set environment variables in `docker-compose.yml`
3. ⏳ Restart web service
4. ⏳ Test with sample requests
5. ⏳ Monitor logs for errors

## Rollback

To disable WeaversNodes Gateway:

```bash
USE_WEAVERSNODES_GATEWAY=false
```

Or remove the environment variable entirely.

## Notes

- All chains use the same gateway URL (`https://gateway.weaversnodes.org/v1`)
- Routing is handled via `Target-Service-Id` header (not URL path)
- Each chain has its own app address for multi-tenant support
- App addresses can be overridden per-network in the database
- Solana uses `getSlot` method instead of `eth_blockNumber`

