# PATH Gateway Scaling Implementation Guide

## 🎯 Goal
Scale PATH gateway from 1 instance to 5 instances with load balancing to achieve 2000 RPS.

## 📋 Implementation Steps

### Step 1: Stop Existing PATH Gateway (if running via docker run)

If PATH gateway is running via `docker run`, we need to stop it first:

```bash
# Stop existing PATH gateway
docker stop shannon-testnet-gateway
docker rm shannon-testnet-gateway
```

### Step 2: Deploy Multiple PATH Gateway Instances

**Option A: Using Docker Compose (Recommended)**

```bash
cd /home/shannon/poktai/infra

# Start all PATH gateway instances
docker compose -f docker-compose.path-gateway-scale.yml up -d

# Verify all instances are running
docker ps --filter "name=path-gateway" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

**Option B: Manual Docker Run (if compose doesn't work)**

```bash
# Instance 1 (port 3069)
docker run -d \
  --name path-gateway-1 \
  --network poktai_backend \
  -p 3069:3069 \
  -v /home/shannon/shannon/gateway/config/gateway_config.yaml:/app/config/.config.yaml:ro \
  ghcr.io/buildwithgrove/path:main

# Instance 2 (port 3070)
docker run -d \
  --name path-gateway-2 \
  --network poktai_backend \
  -p 3070:3069 \
  -v /home/shannon/shannon/gateway/config/gateway_config.yaml:/app/config/.config.yaml:ro \
  ghcr.io/buildwithgrove/path:main

# Instance 3 (port 3071)
docker run -d \
  --name path-gateway-3 \
  --network poktai_backend \
  -p 3071:3069 \
  -v /home/shannon/shannon/gateway/config/gateway_config.yaml:/app/config/.config.yaml:ro \
  ghcr.io/buildwithgrove/path:main

# Instance 4 (port 3072)
docker run -d \
  --name path-gateway-4 \
  --network poktai_backend \
  -p 3072:3069 \
  -v /home/shannon/shannon/gateway/config/gateway_config.yaml:/app/config/.config.yaml:ro \
  ghcr.io/buildwithgrove/path:main

# Instance 5 (port 3073)
docker run -d \
  --name path-gateway-5 \
  --network poktai_backend \
  -p 3073:3069 \
  -v /home/shannon/shannon/gateway/config/gateway_config.yaml:/app/config/.config.yaml:ro \
  ghcr.io/buildwithgrove/path:main
```

### Step 3: Set Up Load Balancer

**Option A: Use Existing Traefik (if available)**

If Traefik is already running, we can add PATH gateway instances to it:

```bash
# Check if Traefik is running
docker ps --filter "name=traefik"

# If Traefik is running, the labels in docker-compose.path-gateway-scale.yml
# should automatically register the services
```

**Option B: Use Nginx Load Balancer**

Create nginx configuration:

```bash
# Create nginx config
cat > /tmp/path-gateway-nginx.conf << 'EOF'
upstream path_gateway {
    least_conn;  # Use least connections algorithm
    server path-gateway-1:3069;
    server path-gateway-2:3069;
    server path-gateway-3:3069;
    server path-gateway-4:3069;
    server path-gateway-5:3069;
}

server {
    listen 80;
    server_name path-gateway-lb;

    location / {
        proxy_pass http://path_gateway;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 10s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF

# Run nginx load balancer
docker run -d \
  --name path-gateway-lb \
  --network poktai_backend \
  -p 3080:80 \
  -v /tmp/path-gateway-nginx.conf:/etc/nginx/conf.d/default.conf:ro \
  nginx:alpine
```

**Option C: Simple Round-Robin Script**

For testing, we can use a simple round-robin approach in Next.js:

Update `apps/web/app/api/gateway/route.ts` to rotate between instances:

```typescript
const PATH_GATEWAY_INSTANCES = [
  'http://host.docker.internal:3069',
  'http://host.docker.internal:3070',
  'http://host.docker.internal:3071',
  'http://host.docker.internal:3072',
  'http://host.docker.internal:3073',
];

// Round-robin selection
let instanceIndex = 0;
const getPathGatewayUrl = () => {
  const url = PATH_GATEWAY_INSTANCES[instanceIndex];
  instanceIndex = (instanceIndex + 1) % PATH_GATEWAY_INSTANCES.length;
  return url;
};
```

### Step 4: Update Next.js Configuration

**Update `infra/docker-compose.yml`:**

Change `LOCAL_GATEWAY_URL` to point to load balancer:

```yaml
environment:
  USE_LOCAL_NODE: 'true'
  LOCAL_GATEWAY_URL: http://path-gateway-lb:80  # Load balancer
  # Or if using direct round-robin:
  # LOCAL_GATEWAY_URL: http://host.docker.internal:3069  # Will use round-robin in code
```

**Or update `apps/web/.env.local`:**

```bash
USE_LOCAL_NODE=true
LOCAL_GATEWAY_URL=http://path-gateway-lb:80
# Or for direct access:
# LOCAL_GATEWAY_URL=http://localhost:3080
```

### Step 5: Restart Next.js

```bash
# If using Docker Compose
cd /home/shannon/poktai/infra
docker compose restart web

# If using PM2
cd /home/shannon/poktai/apps/web
npx pm2 restart nextjs-web
```

### Step 6: Test the Setup

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

**Test with load test:**
```bash
ENDPOINT_ID=ethpath_1764014188689_1764014188693 \
TARGET_RPS=2000 \
TOTAL_REQUESTS=100000 \
k6 run load-test-path-1m-5krps.js
```

## 🔍 Monitoring

**Check instance health:**
```bash
# Check all instances
docker ps --filter "name=path-gateway" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Check logs
docker logs path-gateway-1 --tail 50
docker logs path-gateway-2 --tail 50

# Check stats
docker stats path-gateway-1 path-gateway-2 path-gateway-3 path-gateway-4 path-gateway-5
```

**Monitor load distribution:**
```bash
# Check Traefik dashboard (if using Traefik)
# http://localhost:8080 (or Traefik dashboard URL)

# Check nginx logs (if using nginx)
docker logs path-gateway-lb --tail 50
```

## 🎯 Expected Results

**After scaling:**
- ✅ Throughput: 2000 RPS (5 instances × 400 RPS)
- ✅ Average Response: ~1.5-2s (similar to 500 RPS test)
- ✅ Error Rate: <0.5%
- ✅ Success Rate: >99.5%

## 🚨 Troubleshooting

**If instances don't start:**
- Check port conflicts: `netstat -tulpn | grep -E "(3069|3070|3071|3072|3073)"`
- Check network: `docker network ls`
- Check logs: `docker logs path-gateway-1`

**If load balancer doesn't work:**
- Verify all instances are healthy: `docker ps --filter "name=path-gateway"`
- Check load balancer logs
- Test direct access to instances
- Verify network connectivity

**If performance doesn't improve:**
- Check if requests are being distributed evenly
- Monitor each instance's CPU/memory
- Check for bottlenecks in load balancer
- Verify all instances are receiving traffic

## 📊 Next Steps

1. ✅ Deploy multiple instances
2. ✅ Set up load balancer
3. ✅ Update Next.js configuration
4. ✅ Test with load test
5. ✅ Monitor performance
6. ✅ Tune as needed

