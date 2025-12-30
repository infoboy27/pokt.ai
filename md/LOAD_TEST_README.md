# Load Test Guide - 10M Relays at 5K RPS

## Overview

This guide provides instructions for running a load test to verify the gateway can handle **10 million relays at 5,000 requests per second (RPS) across multiple chains** for approximately 33 minutes.

## Quick Start

### 1. Check Readiness

```bash
./check-load-test-readiness.sh
```

This will verify:
- ✅ Redis is running and healthy
- ✅ PostgreSQL is running and healthy
- ✅ Gateway URL is accessible
- ✅ Rate limiting is configured (10,000 req/sec)
- ✅ Database pool is configured (100 connections)
- ✅ Cache is configured (100,000 entries)
- ✅ Usage logging is optimized (UPSERT)
- ⚠️ k6 is installed (optional)

### 2. Get Test Endpoint

```bash
./get-test-endpoint.sh
```

This will:
- Find an existing active endpoint in the database
- Test the endpoint to verify it's accessible
- Display the endpoint ID for use in load testing

Or set it manually:

```bash
export ENDPOINT_ID=your-endpoint-id
```

### 3. Install k6 (if not already installed)

```bash
curl https://github.com/grafana/k6/releases/download/v0.47.0/k6-v0.47.0-linux-amd64.tar.gz -L | tar xvz
sudo mv k6-v0.47.0-linux-amd64/k6 /usr/local/bin/
k6 version
```

### 4. Run Load Test

```bash
# Set environment variables
export GATEWAY_URL=http://localhost:4000
export ENDPOINT_ID=your-endpoint-id

# Run load test
k6 run load-test-10m-relays.js
```

## Load Test Configuration

### Target Load

- **Total Relays**: 10,000,000
- **Request Rate**: 5,000 RPS
- **Duration**: ~33 minutes (2,000 seconds)
- **Distribution**: Multi-chain (8 chains)

### Load Test Stages

1. **Warm-up**: 1 minute at 100 RPS
2. **Ramp-up to 1K**: 2 minutes at 1,000 RPS
3. **Ramp-up to 5K**: 3 minutes at 5,000 RPS
4. **Sustained 5K**: 33 minutes at 5,000 RPS (10M relays)
5. **Ramp-down**: 1 minute at 0 RPS

### Multi-Chain Testing

The load test distributes requests across 8 chains:
- Ethereum (eth)
- Polygon (poly)
- BSC (bsc)
- Arbitrum (arb-one)
- Optimism (opt)
- Base (base)
- Avalanche (avax)
- Solana (solana)

### RPC Methods Tested

- `eth_blockNumber` - Get latest block number
- `eth_gasPrice` - Get gas price
- `eth_getBalance` - Get account balance
- `eth_getBlockByNumber` - Get block by number
- `getBlockHeight` - Get block height (Solana)
- `getBalance` - Get balance (Solana)

## Success Criteria

✅ **Gateway can handle 5,000 RPS for 33+ minutes** (10M relays)
✅ **95% of requests respond in < 1 second**
✅ **Error rate < 1%**
✅ **No rate limit errors (429)**
✅ **Database connections remain stable**
✅ **Redis memory usage stays within limits**
✅ **Multi-chain requests work correctly**
✅ **Cache hit rate > 30%**

## Expected Performance Metrics

### At 5,000 RPS:

| Metric | Expected Value | Status |
|--------|---------------|--------|
| **Response Time (P50)** | < 100ms (cached) | ✅ |
| **Response Time (P95)** | < 500ms (cache miss) | ✅ |
| **Response Time (P99)** | < 1s (worst case) | ✅ |
| **Cache Hit Rate** | 30-70% per chain | ✅ |
| **Database Connections** | < 100 | ✅ |
| **Redis Memory** | < 2GB | ✅ |
| **Error Rate** | < 1% | ✅ |
| **Rate Limit Errors** | 0% (within 10K RPS) | ✅ |

## Monitoring During Load Test

### k6 Metrics

k6 will automatically report:
- Response time (p50, p95, p99)
- Error rate
- Cache hit rate (from headers)
- Chain distribution
- Rate limit errors

### Application Logs

```bash
# Watch application logs
docker logs -f customer-gateway-web 2>&1 | grep -E "\[DB Pool\]|\[USAGE\]|Cache|Rate"
```

### Database Monitoring

```bash
# Check database connections
docker exec customer-gateway-postgres psql -U pokt_ai -d pokt_ai -c "SELECT count(*) FROM pg_stat_activity;"

# Check usage_daily table
docker exec customer-gateway-postgres psql -U pokt_ai -d pokt_ai -c "SELECT endpoint_id, date, relays, p95_ms, error_rate FROM usage_daily ORDER BY date DESC LIMIT 10;"
```

### Redis Monitoring

```bash
# Monitor Redis memory
docker exec customer-gateway-redis redis-cli INFO memory

# Monitor Redis commands per second
docker exec customer-gateway-redis redis-cli INFO stats | grep instantaneous_ops_per_sec

# Monitor cache keys
docker exec customer-gateway-redis redis-cli KEYS "rpc:*" | wc -l
```

## Troubleshooting

### High Response Times

- Check upstream RPC provider latency
- Verify cache hit rates (should be > 30%)
- Check database query performance
- Monitor Redis connection pool

### Rate Limit Errors (429)

- Verify rate limit is set to 10,000 req/sec
- Check Redis is connected for distributed rate limiting
- Verify endpoint ID is being used correctly in rate limit key

### Database Connection Errors

- Check pool size configuration (`DB_POOL_MAX`)
- Verify database can handle 100 concurrent connections
- Check for connection leaks (pool.totalCount vs pool.idleCount)

### Redis Connection Issues

- Verify `REDIS_URL` is set correctly
- Check Redis is running and accessible
- Monitor Redis memory usage (may need to increase)
- Check Redis maxmemory-policy (should be allkeys-lru)

### Endpoint Not Found

- Verify endpoint ID exists in database
- Check endpoint is active (`is_active = true`)
- Verify endpoint has network configuration
- Run `./get-test-endpoint.sh` to find valid endpoint

## Files

- `load-test-10m-relays.js` - k6 load test script
- `load-test-10m-relays.yml` - Artillery load test script (alternative)
- `check-load-test-readiness.sh` - Readiness check script
- `get-test-endpoint.sh` - Get or create test endpoint script
- `LOAD_TEST_SETUP.md` - Detailed setup guide

## Related Documentation

- `10M_RELAYS_CAPACITY_SUMMARY.md` - Capacity analysis
- `10M_RELAYS_MULTI_CHAIN_ANALYSIS.md` - Multi-chain analysis
- `GATEWAY_CAPACITY_ASSESSMENT.md` - Detailed capacity assessment
- `GATEWAY_LOAD_TEST_READY.md` - Load test readiness report

## Next Steps

1. ✅ Run readiness check: `./check-load-test-readiness.sh`
2. ✅ Get test endpoint: `./get-test-endpoint.sh`
3. ✅ Install k6 (if not installed)
4. ✅ Run load test: `k6 run load-test-10m-relays.js`
5. ✅ Monitor metrics during load test
6. ✅ Verify success criteria are met
7. ✅ Review load test results

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the load test logs
3. Check application logs for errors
4. Verify all prerequisites are met

