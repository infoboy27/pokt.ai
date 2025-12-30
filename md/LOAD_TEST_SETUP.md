# Load Test Setup Guide - 10M Relays at 5K RPS

## Quick Start

✅ **Gateway is ready for 10M relay load testing at 5K RPS across multiple chains!**

## Prerequisites

### 1. Check Readiness

Run the readiness check script to verify everything is configured:

```bash
./check-load-test-readiness.sh
```

This script checks:
- ✅ Redis is running and healthy
- ✅ PostgreSQL is running and healthy
- ✅ Gateway URL is accessible
- ✅ Rate limiting is configured (10,000 req/sec)
- ✅ Database pool is configured (100 connections)
- ✅ Cache is configured (100,000 entries)
- ✅ Usage logging is optimized (UPSERT)
- ✅ k6 is installed (optional, will warn if not)

### 2. Get or Create Test Endpoint

Get a valid endpoint ID for load testing:

```bash
./get-test-endpoint.sh
```

Or set it manually:

```bash
export ENDPOINT_ID=your-endpoint-id
```

### 3. Install k6 (Optional but Recommended)

```bash
# Install k6
curl https://github.com/grafana/k6/releases/download/v0.47.0/k6-v0.47.0-linux-amd64.tar.gz -L | tar xvz
sudo mv k6-v0.47.0-linux-amd64/k6 /usr/local/bin/

# Verify installation
k6 version
```

## Load Testing Scripts

### Option 1: k6 Load Test (Recommended)

**10M Relays at 5K RPS across Multiple Chains**

```bash
# Set environment variables
export GATEWAY_URL=http://localhost:4000
export ENDPOINT_ID=your-endpoint-id

# Run load test
k6 run load-test-10m-relays.js
```

**Features:**
- ✅ 10M relays at 5K RPS for ~33 minutes
- ✅ Multi-chain testing (Ethereum, Polygon, BSC, Arbitrum, Optimism, Base, Avalanche, Solana)
- ✅ Gradual ramp-up (100 → 1K → 5K RPS)
- ✅ Custom metrics (cache hit rate, chain distribution, error rate)
- ✅ Response time thresholds (p50, p95, p99)
- ✅ Error rate monitoring (< 1%)
- ✅ Rate limit error monitoring (< 0.1%)

**Load Test Stages:**
1. **Warm-up**: 1 minute at 100 RPS
2. **Ramp-up to 1K**: 2 minutes at 1,000 RPS
3. **Ramp-up to 5K**: 3 minutes at 5,000 RPS
4. **Sustained 5K**: 33 minutes at 5,000 RPS (10M relays)
5. **Ramp-down**: 1 minute at 0 RPS

**Customization:**
```bash
# Custom gateway URL
export GATEWAY_URL=https://pokt.ai

# Custom endpoint ID
export ENDPOINT_ID=your-endpoint-id

# Run load test
k6 run load-test-10m-relays.js
```

### Option 2: Artillery Load Test (Alternative)

```bash
# Install Artillery
npm install -g artillery

# Set environment variables
export GATEWAY_URL=http://localhost:4000
export ENDPOINT_ID=your-endpoint-id

# Run load test
artillery run load-test-10m-relays.yml
```

**Note:** Artillery script requires a processor file (`load-test-processor.js`) for multi-chain testing. See Artillery documentation for details.

## Monitoring During Load Test

### Real-Time Monitoring

**k6 Metrics:**
- Response time (p50, p95, p99)
- Error rate
- Cache hit rate (from headers)
- Chain distribution
- Rate limit errors

**Application Logs:**
```bash
# Watch application logs
docker logs -f customer-gateway-web 2>&1 | grep -E "\[DB Pool\]|\[USAGE\]|Cache|Rate"

# Check database pool statistics
# Look for: [DB Pool] Total: X, Idle: Y, Waiting: Z
```

### Database Connection Pool
```bash
# Check pool statistics in logs
# Look for: [DB Pool] Total: X, Idle: Y, Waiting: Z

# Monitor database connections
docker exec customer-gateway-postgres psql -U pokt_ai -d pokt_ai -c "SELECT count(*) FROM pg_stat_activity;"
```

### Redis Performance
```bash
# Monitor Redis memory
docker exec customer-gateway-redis redis-cli INFO memory

# Monitor Redis commands per second
docker exec customer-gateway-redis redis-cli INFO stats | grep instantaneous_ops_per_sec

# Monitor cache keys
docker exec customer-gateway-redis redis-cli KEYS "rpc:*" | wc -l
```

### Application Metrics
- **Response Time**: Check `X-RPC-Latency` header (reported by k6)
- **Cache Hit Rate**: Check `X-Cache-Status` header (reported by k6)
- **Rate Limit**: Check `X-RateLimit-Remaining` header (reported by k6)
- **Error Rate**: Monitor 4xx/5xx responses (reported by k6)

### Database Usage Tracking
```bash
# Check usage_daily table
docker exec customer-gateway-postgres psql -U pokt_ai -d pokt_ai -c "SELECT endpoint_id, date, relays, p95_ms, error_rate FROM usage_daily ORDER BY date DESC LIMIT 10;"
```

## Expected Behavior

### At 5,000 RPS:
- **Response Time**: < 500ms (p95)
- **Cache Hit Rate**: 30-70% (depending on request patterns)
- **Database Connections**: < 100 (should not max out)
- **Redis Memory**: < 2GB (with 100K cache entries)
- **Error Rate**: < 1%

### Multi-Chain Distribution
Test with requests distributed across multiple chains:
- Ethereum (eth)
- Polygon (poly)
- BSC (bsc)
- Arbitrum (arb-one)
- Optimism (opt)
- Base (base)
- Avalanche (avax)

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

## Success Criteria

✅ **Gateway can handle 5,000 RPS for 33+ minutes** (10M relays)  
✅ **95% of requests respond in < 1 second**  
✅ **Error rate < 1%**  
✅ **No rate limit errors (429)**  
✅ **Database connections remain stable**  
✅ **Redis memory usage stays within limits**  
✅ **Multi-chain requests work correctly**

