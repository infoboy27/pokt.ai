# Load Test Results Summary

**Test Date**: Generated on test execution
**Load Test Script**: `load-test-path-1m-5krps.js`

## Test Configuration

- **Tool**: k6
- **Test Script**: `load-test-path-1m-5krps.js`
- **Gateway**: `https://pokt.ai/api/gateway`

## Test Results

### ✅ Ethereum Endpoint: `eth_1760726811471_1760726811479`

#### Test 1: High Load (1000 RPS, 10K requests)
- **Status**: ⚠️ Partial Success
- **Total Requests**: 5,790 / 10,000 (57.9%)
- **Success Rate**: 98.36%
- **Error Rate**: 1.64%
- **Average Response Time**: 10.90s
- **P95 Response Time**: 50.80s
- **P99 Response Time**: 59.98s
- **Actual RPS**: 42.10 req/s

**Issues**: 
- Very high latency (10.90s average)
- Only 57.9% of target requests completed
- Duration thresholds exceeded

#### Test 2: Low Load (100 RPS, 1K requests)
- **Status**: ✅ Success
- **Total Requests**: 4,675 / 1,000 (467.5% - exceeded due to ramp-up)
- **Success Rate**: 100.00%
- **Error Rate**: 0.00%
- **Average Response Time**: 1.15s
- **P95 Response Time**: 1.99s
- **P99 Response Time**: 2.11s
- **Actual RPS**: 35.88 req/s

**Result**: ✅ Works well at lower RPS (100 RPS)

---

### ❌ Oasys Endpoint: `oasys_1764640848837_1764640848845`

#### Test: High Load (1000 RPS, 10K requests)
- **Status**: ❌ Failed
- **Total Requests**: 2,908 / 10,000 (29.1%)
- **Success Rate**: 0.00%
- **Error Rate**: 100.00%
- **Average Response Time**: 21.91s
- **P95 Response Time**: 59.98s
- **P99 Response Time**: 60.00s
- **Actual RPS**: 20.42 req/s

**Issues**:
- 100% error rate
- Very high latency
- Only 29.1% of target requests completed
- Endpoint not handling load

---

### ❌ Fantom Endpoint: `fantom_1764640134244_1764640134249`

#### Test: Moderate Load (500 RPS, 5K requests)
- **Status**: ❌ Failed
- **Total Requests**: 6,466 / 5,000 (129.3% - exceeded due to ramp-up)
- **Success Rate**: 0.00%
- **Error Rate**: 100.00%
- **Average Response Time**: 4.56s
- **P95 Response Time**: 8.77s
- **P99 Response Time**: 13.45s
- **Actual RPS**: 49.73 req/s

**Issues**:
- 100% error rate
- High latency
- Endpoint not handling load
- **Note**: Chain distribution shows "eth" instead of "fantom" - endpoint may be misconfigured

---

## Key Findings

### ✅ What Works

1. **Ethereum at Low RPS**: 
   - 100% success rate at 100 RPS
   - Reasonable latency (~1.15s average)
   - Stable performance

### ❌ What Doesn't Work

1. **High RPS on All Endpoints**:
   - Endpoints struggle at 500+ RPS
   - High latency and errors
   - May need rate limiting or scaling

2. **Oasys & Fantom Endpoints**:
   - 100% error rate under load
   - May need endpoint configuration fixes
   - Fantom shows incorrect chain routing (shows "eth" instead of "fantom")

### ⚠️ Performance Issues

1. **Latency**: 
   - High latency at higher RPS (10-20s average)
   - P95/P99 latencies very high (50-60s)
   - May indicate backend bottlenecks

2. **Throughput**:
   - Actual RPS much lower than target
   - Endpoints not handling target load
   - May need horizontal scaling

---

## Recommendations

### Immediate Actions

1. **For Ethereum**:
   - ✅ Use at lower RPS (100-200 RPS)
   - ⚠️ Investigate high latency at higher RPS
   - Consider rate limiting

2. **For Oasys**:
   - ❌ Fix endpoint configuration
   - Investigate why 100% error rate
   - Check PATH gateway service availability

3. **For Fantom**:
   - ❌ Fix endpoint configuration
   - Fix chain routing (showing "eth" instead of "fantom")
   - Investigate why 100% error rate

### Long-term Actions

1. **Performance Optimization**:
   - Investigate backend bottlenecks
   - Consider caching for frequently accessed data
   - Implement connection pooling

2. **Scaling**:
   - Horizontal scaling for gateway
   - Load balancing across multiple instances
   - Consider CDN for static content

3. **Monitoring**:
   - Set up alerts for high latency
   - Monitor error rates
   - Track RPS capacity

---

## Test Commands Used

```bash
# Ethereum - High Load
ENDPOINT_ID=eth_1760726811471_1760726811479 \
TARGET_RPS=1000 \
TOTAL_REQUESTS=10000 \
k6 run load-test-path-1m-5krps.js

# Ethereum - Low Load
ENDPOINT_ID=eth_1760726811471_1760726811479 \
TARGET_RPS=100 \
TOTAL_REQUESTS=1000 \
k6 run load-test-path-1m-5krps.js

# Oasys - High Load
ENDPOINT_ID=oasys_1764640848837_1764640848845 \
TARGET_RPS=1000 \
TOTAL_REQUESTS=10000 \
k6 run load-test-path-1m-5krps.js

# Fantom - Moderate Load
ENDPOINT_ID=fantom_1764640134244_1764640134249 \
TARGET_RPS=500 \
TOTAL_REQUESTS=5000 \
k6 run load-test-path-1m-5krps.js
```

---

## Next Steps

1. ✅ **Ethereum**: Continue testing at moderate RPS (200-500 RPS)
2. ❌ **Oasys**: Fix endpoint configuration before load testing
3. ❌ **Fantom**: Fix endpoint configuration and chain routing
4. ⚠️ **All**: Investigate high latency issues
5. 📊 **Monitoring**: Set up performance monitoring

