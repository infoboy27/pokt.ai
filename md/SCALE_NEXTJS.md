# Scale Next.js Horizontally - Implementation Guide

## Current Setup

Next.js runs as a single instance, which limits throughput due to Node.js single-threaded nature.

## Solution: Scale to Multiple Instances

### Option 1: Docker Compose Scale (Easiest)

**Update `docker-compose.yml`:**

```yaml
web:
  # ... existing config ...
  deploy:
    replicas: 4  # Run 4 instances
```

**Or use docker-compose scale command:**
```bash
docker-compose up -d --scale web=4
```

### Option 2: Manual Multiple Instances

**Run multiple Next.js instances on different ports:**

```bash
# Instance 1 (port 4000)
cd apps/web && PORT=4000 npm run dev &

# Instance 2 (port 4001)
cd apps/web && PORT=4001 npm run dev &

# Instance 3 (port 4002)
cd apps/web && PORT=4002 npm run dev &

# Instance 4 (port 4003)
cd apps/web && PORT=4003 npm run dev &
```

**Update Traefik to load balance:**
```yaml
# traefik.yml
http:
  services:
    web:
      loadBalancer:
        servers:
          - url: http://web:4000
          - url: http://web:4001
          - url: http://web:4002
          - url: http://web:4003
```

### Option 3: PM2 Cluster Mode (Recommended for Production)

**Use PM2 to run multiple instances:**

```bash
# Install PM2
npm install -g pm2

# Run in cluster mode (4 instances)
cd apps/web
pm2 start npm --name "nextjs-web" -- run dev -i 4

# Or use ecosystem file
pm2 start ecosystem.config.js
```

**ecosystem.config.js:**
```javascript
module.exports = {
  apps: [{
    name: 'nextjs-web',
    script: 'npm',
    args: 'run dev',
    instances: 4, // Number of CPU cores
    exec_mode: 'cluster',
    env: {
      PORT: 4000,
      NODE_ENV: 'production'
    }
  }]
};
```

## Important Considerations

### 1. In-Memory Cache Sharing
- Current in-memory cache won't be shared across instances
- **Solution:** Use Redis for shared cache (already configured)
- Update code to prefer Redis over in-memory cache

### 2. Database Connection Pool
- Each instance has its own connection pool
- **Current:** 500 connections per instance
- **With 4 instances:** 2000 total connections
- **Check:** PostgreSQL max_connections limit

### 3. Load Balancer Configuration
- Traefik should already handle load balancing
- Use round-robin or least-connections algorithm
- Enable sticky sessions if needed (not required for stateless API)

### 4. Monitoring
- Monitor each instance separately
- Track request distribution
- Check for instance failures

## Expected Results

**Before Scaling:**
- Throughput: 373 RPS
- Response time: 4.64s
- Instances: 1

**After Scaling (4 instances):**
- Throughput: 1500-2000 RPS (4x improvement)
- Response time: 1-2s (better concurrency)
- Instances: 4

## Quick Start

**Using Docker Compose:**
```bash
cd infra
docker-compose up -d --scale web=4
```

**Using PM2:**
```bash
cd apps/web
pm2 start npm --name "nextjs-web" -- run dev -i 4
```

## Verification

**Check instances are running:**
```bash
# Docker
docker ps | grep web

# PM2
pm2 list
```

**Test load balancing:**
```bash
# Multiple requests should hit different instances
for i in {1..10}; do
  curl -s https://pokt.ai/api/health | grep -o "instance.*" || echo "Request $i"
done
```

## Summary

✅ **Scale Next.js** - Run 4-8 instances
✅ **Load Balance** - Use Traefik (already configured)
✅ **Share Cache** - Use Redis (already configured)
✅ **Monitor** - Track performance improvements

**Expected improvement:** 4-8x throughput increase! 🚀

