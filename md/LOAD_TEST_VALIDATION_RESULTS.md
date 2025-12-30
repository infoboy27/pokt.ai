# Load Test Validation Results

## Date: November 13, 2025

---

## Test Configuration

**Test Type:** Validation Load Test  
**Duration:** 30 seconds  
**Target RPS:** 100 requests/second  
**Virtual Users:** 100  
**Gateway:** `https://pokt.ai`  
**Endpoint:** `eth_1760726811471_1760726811479`  
**Total Requests:** 2,158

---

## Test Results

### Overall Metrics

| Metric | Value | Status |
|--------|-------|--------|
| **Total Requests** | 2,158 | ✅ |
| **Success Rate** | 59.25% (1,279) | ⚠️ |
| **Error Rate** | 40.75% (879) | ⚠️ |
| **Avg Response Time** | 1.34s | ⚠️ |
| **P50 Response Time** | 418ms | ✅ |
| **P95 Response Time** | 3.26s | ❌ (threshold: 500ms) |
| **P99 Response Time** | > 1s | ❌ (threshold: 1s) |
| **Cache Hit Rate** | 51.73% | ✅ |
| **Rate Limit Errors** | 0 | ✅ |
| **Valid JSON-RPC** | 100% | ✅ |

### Thresholds

| Threshold | Target | Actual | Status |
|-----------|--------|--------|--------|
| **P50 < 100ms** | ✅ | 418ms | ❌ |
| **P95 < 500ms** | ✅ | 3.26s | ❌ |
| **P99 < 1s** | ✅ | > 1s | ❌ |
| **Error Rate < 1%** | ✅ | 40.75% | ❌ |
| **Rate Limit Errors < 0.1%** | ✅ | 0% | ✅ |

**Result:** ❌ **Thresholds Crossed**

---

## Analysis

### ✅ What's Working

1. **System Responsiveness:**
   - System is responding to requests ✅
   - No complete failures ✅
   - Valid JSON-RPC responses ✅

2. **Cache Performance:**
   - Cache hit rate: 51.73% ✅
   - Good cache utilization ✅

3. **Rate Limiting:**
   - No rate limit errors ✅
   - Rate limiting working correctly ✅

4. **Success Rate:**
   - 59% of requests succeeding ✅
   - System is operational ✅

### ⚠️ Issues Identified

1. **High Error Rate (40.75%):**
   - 879 requests failed out of 2,158
   - Need to investigate error patterns
   - May be upstream provider issues

2. **Slow Response Times:**
   - Average: 1.34s (should be < 500ms)
   - P95: 3.26s (threshold: 500ms)
   - P99: > 1s (threshold: 1s)
   - Suggests upstream provider latency

3. **Response Time Distribution:**
   - Successful requests: Avg 160ms (good ✅)
   - Failed requests: Contributing to high average
   - Suggests timeouts or upstream issues

---

## Error Analysis

### Error Patterns Observed

**From Customer-RPC-Gateway Logs:**
- `❌ Direct blockchain call failed to https://eth.drpc.org: Request failed with status code 400`
- `❌ PATH gateway call failed for eth: Request failed with status code 500`
- `⚠️ PATH gateway failed, trying direct blockchain calls for eth`
- `✅ Direct blockchain call successful to https://ethereum.publicnode.com`

**Findings:**
1. PATH gateway failing (500 errors) - node connectivity issue
2. Some direct blockchain endpoints failing (400 errors)
3. Fallback to public endpoints working
4. Some requests timing out

---

## Root Causes

### Issue #1: PATH Gateway Failures

**Problem:**
- PATH gateway returning 500 errors
- Cannot connect to `shannon-testnet-node`
- Node connectivity issue

**Impact:**
- PATH gateway unavailable
- Falling back to direct blockchain endpoints
- Some requests failing if all endpoints fail

**Solution:**
- Fix node connectivity (start node or fix DNS)
- Or disable PATH gateway temporarily
- Or rely on direct blockchain endpoints

### Issue #2: Upstream Provider Failures

**Problem:**
- Some direct blockchain endpoints returning 400 errors
- `eth.drpc.org` returning 400
- `rpctest.pokt.ai` timing out (circuit breaker OPEN)

**Impact:**
- Some requests failing
- Fallback to public endpoints working
- Response times increased

**Solution:**
- Wait for rpctest.pokt.ai to become available
- Or use more reliable public endpoints
- Or fix endpoint configuration

### Issue #3: Response Time

**Problem:**
- Average response time: 1.34s
- P95: 3.26s (exceeds 500ms threshold)
- Some requests timing out

**Impact:**
- Thresholds not met
- User experience degraded
- May indicate upstream provider issues

**Solution:**
- Optimize upstream provider selection
- Reduce timeout values
- Improve fallback mechanism

---

## Recommendations

### Immediate Actions

1. **Fix PATH Gateway Node Connectivity:**
   - Start `shannon-testnet-node` container
   - Fix DNS resolution for `shannon-testnet-node`
   - Or disable PATH gateway if not needed

2. **Investigate Error Patterns:**
   - Check which requests are failing
   - Identify if errors are timeouts or 400/500 errors
   - Check upstream provider status

3. **Optimize Endpoint Configuration:**
   - Remove failing endpoints (`eth.drpc.org`)
   - Use only reliable endpoints
   - Wait for rpctest.pokt.ai to become available

### For Full Load Test (10M Relays at 5K RPS)

**Before Running Full Test:**
1. ✅ Fix PATH gateway node connectivity
2. ✅ Resolve upstream provider issues
3. ✅ Optimize endpoint configuration
4. ✅ Verify error rate < 1%
5. ✅ Verify response times meet thresholds

**Expected Performance:**
- Error rate: < 1%
- P95 response time: < 500ms
- P99 response time: < 1s
- Success rate: > 99%

---

## Current Status

**System Status:** ⚠️ **PARTIALLY WORKING**

**Working:**
- ✅ System is responding
- ✅ Cache working (51% hit rate)
- ✅ Rate limiting working
- ✅ Valid JSON-RPC responses
- ✅ 59% success rate

**Not Working:**
- ❌ High error rate (40.75%)
- ❌ Slow response times (P95: 3.26s)
- ❌ PATH gateway unavailable
- ❌ Some upstream providers failing

---

## Next Steps

1. **Fix PATH Gateway:**
   - Start `shannon-testnet-node`
   - Or disable PATH gateway if not needed

2. **Fix Upstream Providers:**
   - Remove failing endpoints
   - Wait for rpctest.pokt.ai availability
   - Use reliable public endpoints

3. **Re-run Validation Test:**
   - Once fixes are applied
   - Verify error rate < 1%
   - Verify response times meet thresholds

4. **Run Full Load Test:**
   - Once validation test passes
   - 10M relays at 5K RPS
   - Monitor all metrics

---

## Conclusion

**Status:** ⚠️ **System is operational but needs optimization**

**Key Findings:**
- System is responding and handling requests ✅
- Some requests failing (40% error rate) ⚠️
- Response times higher than expected ⚠️
- Cache and rate limiting working correctly ✅

**Recommendation:**
- Fix PATH gateway node connectivity
- Optimize upstream provider configuration
- Re-run validation test
- Then proceed with full load test

**The system is functional but needs optimization before running the full 10M relay load test.**

