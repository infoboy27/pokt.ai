# PATH Gateway Direct Load Test Guide

## Purpose

This load test **bypasses Next.js entirely** and tests PATH gateway directly. This will help identify if PATH gateway is the bottleneck or if the issue is in Next.js.

## Quick Start

### Basic Test (2000 RPS, 1M requests)

```bash
./run-path-direct-load-test.sh
```

### Custom Configuration

```bash
TARGET_RPS=2000 \
TOTAL_REQUESTS=1000000 \
PATH_GATEWAY_URL=http://localhost:3069/v1 \
SERVICE_ID=eth \
APP_ADDRESS=pokt1q89a5tyhaq5xh49ec5n2wqn5zhynw6fmve06sv \
./run-path-direct-load-test.sh
```

### Using k6 Directly

```bash
TARGET_RPS=2000 \
TOTAL_REQUESTS=1000000 \
k6 run load-test-path-direct.js
```

## What This Tests

✅ **PATH Gateway Performance** - Direct connection to PATH gateway
✅ **Upstream RPC Providers** - Tests if upstream providers can handle load
✅ **Network Latency** - Tests network performance under load
❌ **Next.js Overhead** - Bypassed (not tested)

## Expected Results

### If PATH Gateway is Fast:
- Average response: < 0.5s
- Throughput: 2000+ RPS
- Error rate: < 1%

**Conclusion:** PATH gateway is NOT the bottleneck. The issue is in Next.js.

### If PATH Gateway is Slow:
- Average response: > 2s
- Throughput: < 1000 RPS
- Error rate: > 5%

**Conclusion:** PATH gateway IS the bottleneck. Need to:
- Scale PATH gateway
- Optimize PATH gateway configuration
- Check upstream RPC provider performance

## Comparison

### Through Next.js (Current):
- Average: 4.46s
- Throughput: 388 RPS
- Error rate: 10.78%

### Direct PATH Gateway (This Test):
- Will show actual PATH gateway performance
- If fast: Next.js is the bottleneck
- If slow: PATH gateway is the bottleneck

## Monitoring

While the test runs, monitor:

```bash
# PATH gateway logs
docker logs shannon-testnet-gateway -f

# PATH gateway metrics (if available)
curl http://localhost:3069/metrics

# System resources
htop
```

## Troubleshooting

### PATH Gateway Not Accessible

```bash
# Check if PATH gateway is running
docker ps | grep gateway

# Check PATH gateway logs
docker logs shannon-testnet-gateway --tail 50
```

### High Error Rate

- Check PATH gateway logs for errors
- Check upstream RPC provider status
- Verify app address is staked correctly
- Check network connectivity

### Low Throughput

- PATH gateway may be rate-limited
- Upstream RPC providers may be slow
- Network may be congested
- PATH gateway resources may be insufficient

## Next Steps

1. **Run the direct load test** - See results above
2. **Compare with Next.js test** - Identify the bottleneck
3. **Optimize the bottleneck** - Apply fixes based on results
4. **Re-test** - Verify improvements

## Summary

This test will definitively show if PATH gateway is the bottleneck or if Next.js is adding overhead. Run it and compare the results! 🚀

