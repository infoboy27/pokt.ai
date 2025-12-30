# Next.js Scaling Applied

## ✅ Scaling Configuration

**Applied:** 4 Next.js instances running behind Traefik load balancer

## Verification

**Check instances:**
```bash
docker ps --filter "name=web"
```

**Check Traefik load balancing:**
```bash
# Traefik should automatically detect and load balance across 4 instances
docker logs traefik | grep "poktai-web"
```

## Expected Improvements

**Before Scaling:**
- Instances: 1
- Throughput: 373 RPS
- Response: 4.64s

**After Scaling (4 instances):**
- Instances: 4
- Throughput: 1500-2000 RPS (4x improvement expected)
- Response: 1-2s (better concurrency expected)

## Re-Run Load Test

Now that scaling is applied, re-run the load test:

```bash
ENDPOINT_ID=ethpath_1764014188689_1764014188693 \
TARGET_RPS=2000 \
TOTAL_REQUESTS=1000000 \
k6 run load-test-path-1m-5krps.js
```

## Monitoring

**Check instance health:**
```bash
# Check all web instances
docker ps --filter "name=web"

# Check logs from one instance
docker logs <web-instance-name> --tail 50

# Check Traefik routing
docker logs traefik | grep "poktai-web"
```

## Troubleshooting

**If instances don't start:**
```bash
# Check logs
docker-compose logs web

# Restart
docker-compose restart web
```

**If load balancing doesn't work:**
- Check Traefik labels in docker-compose.yml
- Verify Traefik is detecting all instances
- Check Traefik dashboard: http://localhost:8080

## Summary

✅ **Scaling applied** - 4 Next.js instances running
✅ **Load balancer** - Traefik automatically configured
✅ **Ready for testing** - Re-run load test to verify improvements

**Expected:** 4x throughput improvement! 🚀


