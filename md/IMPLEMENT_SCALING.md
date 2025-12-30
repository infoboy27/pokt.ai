# Implement Next.js Scaling - Quick Guide

## Current Situation

- **Throughput:** 373 RPS (target: 2000 RPS)
- **Response Time:** 4.64s average
- **Bottleneck:** Next.js single-threaded nature

## Solution: Scale Next.js to 4 Instances

### Option 1: Docker Compose Scale (Recommended)

**Updated `docker-compose.yml`** - Added `deploy.replicas: 4`

**To apply:**
```bash
cd infra
docker-compose up -d --scale web=4
```

**Or restart with new config:**
```bash
cd infra
docker-compose down
docker-compose up -d
```

### Option 2: Manual PM2 Scaling (Alternative)

If Docker scaling doesn't work, use PM2:

```bash
cd apps/web
npm install -g pm2

# Stop current Next.js
pkill -f "next dev"

# Start with PM2 cluster mode (4 instances)
pm2 start npm --name "nextjs-web" -- run dev -i 4

# Save PM2 config
pm2 save
pm2 startup
```

## Verification

**Check instances:**
```bash
# Docker
docker ps | grep web

# PM2
pm2 list
```

**Test load balancing:**
```bash
# Should hit different instances
for i in {1..20}; do
  curl -s https://pokt.ai/api/gateway?endpoint=ethpath_1764014188689_1764014188693 \
    -X POST -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
    -w "\nRequest $i: %{http_code}\n" -o /dev/null
done
```

## Expected Results

**Before Scaling:**
- Instances: 1
- Throughput: 373 RPS
- Response: 4.64s

**After Scaling (4 instances):**
- Instances: 4
- Throughput: 1500-2000 RPS (4x improvement)
- Response: 1-2s (better concurrency)

## Important Notes

1. **Cache Sharing:** In-memory cache won't be shared, but Redis cache will be
2. **Database Pool:** Each instance has 500 connections (2000 total with 4 instances)
3. **Load Balancer:** Traefik should automatically load balance (already configured)
4. **Monitoring:** Monitor each instance separately

## Re-Run Load Test

After scaling, re-run the load test:

```bash
ENDPOINT_ID=ethpath_1764014188689_1764014188693 \
TARGET_RPS=2000 \
TOTAL_REQUESTS=1000000 \
k6 run load-test-path-1m-5krps.js
```

## Summary

✅ **Docker Compose updated** - Added `deploy.replicas: 4`
✅ **Ready to scale** - Run `docker-compose up -d --scale web=4`
✅ **Expected improvement** - 4x throughput increase

**Next step:** Apply scaling and re-test! 🚀

