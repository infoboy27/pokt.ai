# Performance Regression Analysis

## 🔴 Issue: Performance Degraded After Scaling

**Results Comparison:**
| Configuration | Throughput | Avg Response | Error Rate |
|--------------|------------|--------------|------------|
| 5 instances | 303 RPS | 3.77s | 0.29% |
| 10 instances | 141 RPS | 8.17s | 2.89% |

**Problem:** Scaling to 10 instances made performance **worse**, not better!

## 🔍 Root Cause Analysis

### 1. Load Distribution Still Uneven

**Network I/O Distribution:**
- `shannon-testnet-gateway`: 5.46GB (most traffic)
- Other instances: ~2.8MB each (minimal traffic)

**Conclusion:** Round-robin load balancing is NOT working effectively

### 2. Possible Causes

**A. Round-Robin Counter Issue:**
- Each PM2 instance has its own counter
- Random starting point may not be enough
- Requests may still cluster to first instance

**B. Connection Overhead:**
- More instances = more connection overhead
- Each instance needs connections to PATH gateway
- Network overhead increases with more instances

**C. PATH Gateway Capacity:**
- Each instance may have internal limits
- More instances don't help if each is underutilized
- First instance handling most load anyway

## 🎯 Recommendations

### Option 1: Fix Load Balancing ⭐⭐⭐ **RECOMMENDED**

**Use better load balancing algorithm:**
- Least connections (instead of round-robin)
- Or use external load balancer (nginx/Traefik)
- Or use consistent hashing

**Expected:** Better distribution, improved performance

### Option 2: Reduce to 5 Instances ⭐⭐

**Revert to 5 instances:**
- Performance was better with 5 instances
- Less overhead
- Better resource utilization

**Expected:** Back to 303 RPS, 3.77s avg

### Option 3: Optimize PATH Gateway ⭐

**Instead of scaling, optimize:**
- Increase per-instance capacity
- Optimize configuration
- Better resource allocation

**Expected:** 600-800 RPS per instance

## 📊 Immediate Actions

### 1. Check Load Distribution

**Monitor during load test:**
```bash
watch -n 1 'docker stats $(docker ps --filter "name=gateway" --format "{{.Names}}") --no-stream'
```

**Expected:** All instances should have similar network I/O

### 2. Test with 5 Instances Again

**Verify baseline:**
```bash
# Stop instances 6-9
docker stop path-gateway-5 path-gateway-6 path-gateway-7 path-gateway-8 path-gateway-9
docker rm path-gateway-5 path-gateway-6 path-gateway-7 path-gateway-8 path-gateway-9

# Update Next.js to only use 5 instances
# Then re-run load test
```

### 3. Implement Better Load Balancing

**Use least-connections or external load balancer**

## Summary

⚠️ **Performance regressed** - 10 instances worse than 5
🔍 **Load balancing issue** - Traffic not distributed evenly
🎯 **Next step** - Fix load balancing or revert to 5 instances

**The issue is load balancing, not the number of instances!** 🔍

