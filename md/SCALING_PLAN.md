# PATH Gateway Scaling Plan

## 🎯 Goal: Achieve 2000 RPS with Excellent Performance

### Current Situation

**Single PATH Gateway Instance:**
- Capacity: ~300-400 RPS
- Performance at 500 RPS: ✅ Excellent (1.48s avg, 0% errors)
- Performance at 2000 RPS: ❌ Poor (9.73s avg, 3.42% errors)

**Conclusion:** Need to scale horizontally

## 🚀 Scaling Strategy

### Option 1: Simple Horizontal Scaling ⭐⭐⭐ **RECOMMENDED**

**Deploy 5-7 PATH Gateway Instances**

**Architecture:**
```
Next.js (4 instances)
    ↓
Load Balancer (Traefik/nginx)
    ↓
PATH Gateway Instance 1 (port 3069) - ~400 RPS
PATH Gateway Instance 2 (port 3070) - ~400 RPS
PATH Gateway Instance 3 (port 3071) - ~400 RPS
PATH Gateway Instance 4 (port 3072) - ~400 RPS
PATH Gateway Instance 5 (port 3073) - ~400 RPS
    ↓
Pocket Network
```

**Expected Capacity:** 5 × 400 RPS = 2000 RPS

**Implementation Steps:**

1. **Deploy Multiple PATH Gateway Instances**
   ```bash
   # Run PATH gateway on multiple ports
   # Instance 1: port 3069 (existing)
   # Instance 2: port 3070
   # Instance 3: port 3071
   # Instance 4: port 3072
   # Instance 5: port 3073
   ```

2. **Configure Load Balancer (Traefik)**
   ```yaml
   # Add to docker-compose.yml or Traefik config
   services:
     path-gateway-lb:
       image: traefik:latest
       # Configure load balancing across PATH gateway instances
       # Round-robin or least-connections
   ```

3. **Update Next.js Configuration**
   ```bash
   # Point to load balancer instead of single instance
   LOCAL_GATEWAY_URL=http://path-gateway-lb:80
   ```

### Option 2: Optimize + Scale ⭐⭐

**Optimize First, Then Scale**

**Step 1: Optimize PATH Gateway**
- Increase connection pool: 100 → 500
- Increase queue size: 1000 → 5000
- Optimize workers/goroutines
- Tune timeouts

**Expected:** 600-800 RPS per instance

**Step 2: Scale to 3-4 Instances**
- Deploy 3-4 optimized instances
- Load balance across instances

**Expected:** 3 × 600 RPS = 1800 RPS (close to target)
**Expected:** 4 × 600 RPS = 2400 RPS (exceeds target)

## 📋 Implementation Checklist

### Phase 1: Preparation

- [ ] Review PATH gateway configuration
- [ ] Identify optimization opportunities
- [ ] Plan instance deployment
- [ ] Design load balancer configuration
- [ ] Prepare monitoring setup

### Phase 2: Deploy Additional Instances

- [ ] Deploy PATH gateway instance 2 (port 3070)
- [ ] Deploy PATH gateway instance 3 (port 3071)
- [ ] Deploy PATH gateway instance 4 (port 3072)
- [ ] Deploy PATH gateway instance 5 (port 3073)
- [ ] Verify each instance is healthy

### Phase 3: Configure Load Balancer

- [ ] Set up Traefik/nginx load balancer
- [ ] Configure round-robin or least-connections
- [ ] Add health checks
- [ ] Test load balancing

### Phase 4: Update Next.js

- [ ] Update LOCAL_GATEWAY_URL to point to load balancer
- [ ] Restart Next.js instances
- [ ] Verify requests are distributed

### Phase 5: Testing

- [ ] Test with 500 RPS (baseline)
- [ ] Test with 1000 RPS (intermediate)
- [ ] Test with 2000 RPS (target)
- [ ] Monitor all instances
- [ ] Verify performance metrics

### Phase 6: Monitoring

- [ ] Set up monitoring for all instances
- [ ] Configure alerts
- [ ] Monitor response times
- [ ] Monitor error rates
- [ ] Monitor instance health

## 🔧 Configuration Examples

### Traefik Load Balancer Configuration

```yaml
# docker-compose.yml
services:
  traefik:
    image: traefik:latest
    command:
      - "--api.insecure=true"
      - "--providers.docker=true"
      - "--entrypoints.web.address=:80"
    labels:
      - "traefik.http.services.path-gateway.loadbalancer.server.port=3069"
      - "traefik.http.services.path-gateway.loadbalancer.server.url=http://path-gateway-1:3069"
      - "traefik.http.services.path-gateway.loadbalancer.server.url=http://path-gateway-2:3070"
      - "traefik.http.services.path-gateway.loadbalancer.server.url=http://path-gateway-3:3071"
      - "traefik.http.services.path-gateway.loadbalancer.server.url=http://path-gateway-4:3072"
      - "traefik.http.services.path-gateway.loadbalancer.server.url=http://path-gateway-5:3073"
```

### Nginx Load Balancer Configuration

```nginx
upstream path_gateway {
    least_conn;  # or round-robin
    server path-gateway-1:3069;
    server path-gateway-2:3070;
    server path-gateway-3:3071;
    server path-gateway-4:3072;
    server path-gateway-5:3073;
}

server {
    listen 80;
    location / {
        proxy_pass http://path_gateway;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 📊 Expected Results

### After Scaling to 5 Instances

**Performance Metrics:**
- ✅ Throughput: 2000 RPS (target achieved)
- ✅ Average Response: ~1.5-2s (similar to 500 RPS test)
- ✅ P95 Response: ~2-3s
- ✅ P99 Response: ~3-5s
- ✅ Error Rate: <0.5%
- ✅ Success Rate: >99.5%

### After Optimization + Scaling (3-4 Instances)

**Performance Metrics:**
- ✅ Throughput: 2000+ RPS (exceeds target)
- ✅ Average Response: ~1.5s (excellent)
- ✅ P95 Response: ~2s
- ✅ P99 Response: ~3s
- ✅ Error Rate: <0.1%
- ✅ Success Rate: >99.9%

## 🎯 Summary

**Current:** 1 instance, ~400 RPS capacity
**Target:** 2000 RPS with excellent performance

**Solution:** Scale to 5-7 instances with load balancing

**Timeline:**
- **Quick fix:** Deploy 5 instances + load balancer (1-2 days)
- **Optimized:** Optimize + scale to 3-4 instances (1 week)

**Recommendation:** ⭐⭐⭐ **Scale horizontally** - Fastest path to 2000 RPS

