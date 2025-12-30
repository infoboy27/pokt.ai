# Next.js Scaling Status

## Configuration Applied ✅

**Updated:** `infra/docker-compose.yml` with `deploy.replicas: 4`

## How to Apply Scaling

### If using Docker Compose v2:
```bash
cd infra
docker compose up -d --scale web=4
```

### If using Docker Compose v1:
```bash
cd infra
docker-compose up -d --scale web=4
```

### Alternative: PM2 Cluster Mode

If Docker scaling doesn't work, use PM2:

```bash
# Stop current Next.js
pkill -f "next dev"

# Install PM2
npm install -g pm2

# Start with 4 instances
cd apps/web
pm2 start npm --name "nextjs-web" -- run dev -i 4

# Save config
pm2 save
```

## Verify Scaling

**Check instances:**
```bash
# Docker
docker ps | grep web

# PM2
pm2 list
```

**Test load balancing:**
```bash
# Multiple requests should hit different instances
for i in {1..20}; do
  curl -s https://pokt.ai/api/gateway?endpoint=ethpath_1764014188689_1764014188693 \
    -X POST -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
    -w "Request $i: %{http_code}\n" -o /dev/null
done
```

## Expected Results

**After scaling to 4 instances:**
- Throughput: 1500-2000 RPS (4x improvement)
- Response time: 1-2s (better concurrency)
- Error rate: < 1% (maintained)

## Re-Run Load Test

```bash
ENDPOINT_ID=ethpath_1764014188689_1764014188693 \
TARGET_RPS=2000 \
TOTAL_REQUESTS=1000000 \
k6 run load-test-path-1m-5krps.js
```

## Summary

✅ **Configuration ready** - docker-compose.yml updated
⏳ **Apply scaling** - Run `docker compose up -d --scale web=4`
✅ **Endpoint verified** - Still working correctly

**Next step:** Apply scaling and re-test! 🚀


