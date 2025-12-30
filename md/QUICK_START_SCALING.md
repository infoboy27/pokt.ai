# Quick Start: PATH Gateway Scaling

## 🚀 Fastest Path to 2000 RPS

This guide provides the quickest way to scale PATH gateway for 2000 RPS.

## Step 1: Start Multiple PATH Gateway Instances

```bash
cd /home/shannon/poktai
./start-path-gateway-instances.sh
```

This will:
- Start 5 PATH gateway instances on ports 3069-3073
- Use the same config file for all instances
- Set up round-robin load balancing

## Step 2: Restart Next.js

The code has been updated to automatically use round-robin load balancing across all instances.

**If using PM2:**
```bash
cd /home/shannon/poktai/apps/web
npx pm2 restart nextjs-web
```

**If using Docker:**
```bash
cd /home/shannon/poktai/infra
docker compose restart web
```

## Step 3: Verify Setup

**Check instances are running:**
```bash
docker ps --filter "name=path-gateway" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

**Test individual instances:**
```bash
# Test instance 1
curl -X POST "http://localhost:3069/v1" \
  -H "Content-Type: application/json" \
  -H "Target-Service-Id: eth" \
  -H "App-Address: pokt1q89a5tyhaq5xh49ec5n2wqn5zhynw6fmve06sv" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Test instance 2
curl -X POST "http://localhost:3070/v1" \
  -H "Content-Type: application/json" \
  -H "Target-Service-Id: eth" \
  -H "App-Address: pokt1q89a5tyhaq5xh49ec5n2wqn5zhynw6fmve06sv" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

**Test through Next.js:**
```bash
curl -X POST "https://pokt.ai/api/gateway?endpoint=ethpath_1764014188689_1764014188693" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

## Step 4: Run Load Test

```bash
ENDPOINT_ID=ethpath_1764014188689_1764014188693 \
TARGET_RPS=2000 \
TOTAL_REQUESTS=100000 \
k6 run load-test-path-1m-5krps.js
```

## Expected Results

**After scaling:**
- ✅ Throughput: 2000 RPS (5 instances × 400 RPS)
- ✅ Average Response: ~1.5-2s (similar to 500 RPS test)
- ✅ Error Rate: <0.5%
- ✅ Success Rate: >99.5%

## Monitoring

**Check instance health:**
```bash
docker stats path-gateway-1 path-gateway-2 path-gateway-3 path-gateway-4 path-gateway-5
```

**Check logs:**
```bash
docker logs path-gateway-1 --tail 50
docker logs path-gateway-2 --tail 50
```

## Configuration

**Customize instances:**
Set `PATH_GATEWAY_INSTANCES` environment variable in Next.js:

```bash
# In apps/web/.env.local or infra/docker-compose.yml
PATH_GATEWAY_INSTANCES=http://host.docker.internal:3069,http://host.docker.internal:3070,http://host.docker.internal:3071,http://host.docker.internal:3072,http://host.docker.internal:3073
```

## Troubleshooting

**If instances don't start:**
- Check port conflicts: `netstat -tulpn | grep -E "(3069|3070|3071|3072|3073)"`
- Check network: `docker network ls | grep shannon`
- Check logs: `docker logs path-gateway-1`

**If load balancing doesn't work:**
- Verify all instances are healthy
- Check Next.js logs for errors
- Verify environment variables are set correctly

## Summary

✅ **Start instances:** `./start-path-gateway-instances.sh`
✅ **Restart Next.js:** `npx pm2 restart nextjs-web`
✅ **Test:** Run load test
✅ **Monitor:** Watch instance stats

**That's it! You should now be able to handle 2000 RPS!** 🚀

