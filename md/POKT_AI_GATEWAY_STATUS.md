# pokt.ai Gateway - Status Report

## Overview

**pokt.ai** is an AI-powered RPC Gateway built on top of Pocket Network Shannon and PATH (WeaversNodes Gateway). It provides a unified API for accessing multiple blockchain networks through a single endpoint.

**Gateway URL**: `https://pokt.ai/api/gateway`

## Architecture

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes with PostgreSQL and Redis
- **RPC Provider**: WeaversNodes Gateway (`gateway.weaversnodes.org/v1`)
- **Database**: PostgreSQL (usage tracking, endpoint management)
- **Caching**: In-memory + Redis (multi-tier caching)
- **Load Balancing**: Traefik with horizontal scaling support

## Current Status

### ✅ Operational Features

- **Multi-Chain Support**: Ethereum, Optimism, Oasys, Fantom, BSC, Polygon, and 20+ other chains
- **Endpoint Management**: Create and manage custom endpoints per organization
- **Usage Tracking**: Request counting and billing (recently enabled)
- **Performance Optimization**: Multi-tier caching (in-memory + Redis)
- **Rate Limiting**: Configurable per-endpoint rate limits
- **Health Monitoring**: Built-in health checks and metrics

### 🔧 Recent Improvements

1. **Usage Logging Enabled** ✅
   - Fixed: Requests are now being counted for billing
   - Configuration: `DISABLE_USAGE_LOGGING=false` in all config files
   - Status: Active and tracking all requests

2. **Transaction Safety** ✅
   - Fixed: Endpoint creation now uses database transactions
   - Prevents: Endpoints without network configurations
   - Validation: Automatic rollback on failure

3. **PATH Gateway Integration** ✅
   - Gateway: `gateway.weaversnodes.org/v1` (WeaversNodes)
   - Per-Chain App Addresses: Each chain has optimized app address
   - Service IDs: Properly mapped for all supported chains

4. **Bottleneck Investigation** ✅
   - Individual Requests: ~1ms (excellent caching)
   - PATH Gateway Direct: ~170-500ms
   - Under Load: 1-10s (PATH gateway queuing bottleneck identified)

## Supported Chains

### Mainnets (27 chains)
- Ethereum (eth) ✅ Working
- Optimism (opt) ⚠️ Service configuration needed
- Oasys (oasys) ✅ Working
- Fantom (fantom) ✅ Working
- BSC (bsc) ⚠️ Retryable errors
- Polygon (poly) ⚠️ Retryable errors
- Arbitrum One, Base, Linea, Mantle, Bera, Fuse, Fraxtal, Metis, Blast, Boba, Gnosis, Ink, Kava, Sonic, Solana, Avalanche, Celo

### Testnets
- Optimism Sepolia, Arbitrum Sepolia, Base Sepolia, Ethereum Holesky, Ethereum Sepolia

## Endpoint Testing Results

### Tested Endpoints

| Endpoint | Chain | Status | Notes |
|----------|-------|--------|-------|
| `eth_1760726811471_1760726811479` | Ethereum | ✅ Working | 100% success at 100-200 RPS |
| `oasys_1764640848837_1764640848845` | Oasys | ✅ Working | PATH gateway configured |
| `fantom_1764640134244_1764640134249` | Fantom | ✅ Working | PATH gateway configured |
| `optimism_1764640349512_1764640349517` | Optimism | ⚠️ Needs Config | PATH gateway service issue |

### Performance Metrics

**Individual Requests**:
- pokt.ai Gateway: ~1ms (cached) ✅
- PATH Gateway Direct: ~170-500ms
- Overhead: Minimal (caching working excellently)

**Load Testing** (Ethereum endpoint):
- 100 RPS: 100% success, ~1.15s avg latency ✅
- 200 RPS: 100% success, ~2.32s avg latency ✅
- 1000 RPS: 98.36% success, ~10.90s avg latency ⚠️

**Bottleneck Identified**: PATH gateway queuing under high load

## Configuration

### Environment Variables

```bash
# Gateway Configuration
USE_WEAVERSNODES_GATEWAY=true
WEAVERSNODES_GATEWAY_URL=https://gateway.weaversnodes.org/v1
USE_LOCAL_NODE=false

# Usage Tracking (ENABLED)
DISABLE_USAGE_LOGGING=false

# Performance
DB_POOL_MAX=500
RPC_TIMEOUT_MS=3000
CACHE_ENDPOINT_LOOKUPS=true

# Rate Limiting
DISABLE_RATE_LIMIT=true  # For load testing
DISABLE_IP_RATE_LIMIT=true
```

### Per-Chain App Addresses

Each chain uses optimized WeaversNodes app addresses:
- Ethereum: `pokt1zp90apxzym50uu6jt89p30urd69gfp7nu2u2w9`
- Oasys: `pokt1nnkjgpzzuuadyexuepuewj97p7s8hcdqapamgt`
- Fantom: `pokt14fnfvne4mh0m8lh63nremuxmdl5qp2kxtljkfs`
- Optimism: `pokt1hcn484sc9w3xqdwajv7cz06wys3r4az999ds36`
- (See `apps/web/app/api/gateway/route.ts` for full list)

## API Usage

### Basic Request

```bash
curl -X POST "https://pokt.ai/api/gateway?endpoint=YOUR_ENDPOINT_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "eth_blockNumber",
    "params": [],
    "id": 1
  }'
```

### Supported RPC Methods

Standard Ethereum JSON-RPC methods:
- `eth_blockNumber` - Get latest block number
- `eth_gasPrice` - Get current gas price
- `eth_getBalance` - Get account balance
- `eth_call` - Execute contract call
- `eth_sendTransaction` - Send transaction
- (All standard Ethereum RPC methods)

## Database Schema

### Endpoints Table
- `id`: Unique endpoint identifier
- `name`: Endpoint name
- `base_url`: Gateway URL
- `is_active`: Active status
- `org_id`: Organization ID

### Networks Table
- `endpoint_id`: Foreign key to endpoints
- `code`: Chain code (e.g., 'eth', 'opt')
- `chain_id`: Blockchain chain ID
- `rpc_url`: RPC provider URL
- `path_app_address`: Per-network PATH gateway app address

### Usage Daily Table
- `endpoint_id`: Endpoint identifier
- `date`: Date of usage
- `relays`: Number of requests
- `p95_ms`: 95th percentile response time
- `error_rate`: Error rate percentage

## Monitoring & Diagnostics

### Health Check
```bash
curl https://pokt.ai/api/health
```

### Usage Statistics
```bash
# Check usage records
docker exec poktai-postgres psql -U pokt_ai -d pokt_ai -c \
  "SELECT endpoint_id, date, relays, p95_ms FROM usage_daily \
   WHERE date = CURRENT_DATE ORDER BY relays DESC LIMIT 10;"
```

### Diagnostic Scripts
- `scripts/investigate-bottleneck.sh` - Performance analysis
- `scripts/check-endpoint-config.sh` - Configuration verification
- `scripts/diagnose-path-gateway.sh` - PATH gateway diagnostics
- `scripts/fix-missing-networks.sh` - Auto-fix missing configurations

## Known Issues & Solutions

### Issue 1: Optimism Endpoint Errors
**Status**: ⚠️ Under Investigation
**Error**: "no protocol endpoint responses"
**Cause**: PATH gateway service configuration
**Solution**: Verify app address has staked `opt` service

### Issue 2: High Latency Under Load
**Status**: ⚠️ Identified
**Cause**: PATH gateway queuing bottleneck
**Solution**: Monitor PATH gateway capacity, consider scaling

### Issue 3: Usage Logging
**Status**: ✅ Fixed
**Solution**: Enabled in all configuration files
**Verification**: Check `usage_daily` table for records

## Performance Recommendations

1. **For Production**: Use 100-200 RPS per endpoint for optimal performance
2. **Caching**: Leverages multi-tier caching (in-memory + Redis)
3. **Scaling**: Horizontal scaling supported via Traefik load balancer
4. **Monitoring**: Track `usage_daily` table for usage patterns

## Security Features

- Rate limiting per endpoint
- API key authentication
- Organization-based access control
- Payment status checks (configurable)
- Request validation and sanitization

## Deployment

- **Development**: `next dev -p 4000`
- **Production**: Docker Compose with Traefik
- **Scaling**: 4+ Next.js instances via PM2 or Docker Swarm
- **Database**: PostgreSQL with connection pooling (500 max connections)
- **Cache**: Redis for distributed caching

## Documentation

- **API Documentation**: Available at `/api/docs` (if configured)
- **Load Testing**: `load-test-path-1m-5krps.js` (k6 script)
- **Configuration Guides**: Multiple markdown files in project root
- **Troubleshooting**: See `USAGE_LOGGING_AND_BOTTLENECK_FIX.md`

## Contact & Support

For issues or questions:
- Check diagnostic scripts in `scripts/` directory
- Review configuration files in `infra/` directory
- Check logs: `docker logs <container-name>` or PM2 logs

---

**Last Updated**: December 3, 2025
**Status**: ✅ Operational with minor optimizations needed
**Version**: Development/Production Ready

