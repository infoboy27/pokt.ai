# PATH Gateway Investigation Results

## 🔍 Findings

### PATH Gateway Status ✅

**Container Status:**
- ✅ Running (Up 20 hours)
- ✅ CPU: 0.00% (not resource constrained)
- ✅ Memory: 617.9MB / 62.46GB (plenty available)
- ✅ Network I/O: 5.22GB / 5.48GB (significant traffic)

**Conclusion:** PATH gateway is NOT resource constrained.

### PATH Gateway Errors ⚠️

**Error Pattern:**
```
error getting the selected app from the HTTP request: <nil>: 
getAppAddrFromHTTPReq: no HTTP headers supplied.
```

**Frequency:** Multiple errors in logs

**Impact:** PATH gateway rejecting requests without proper headers

### Header Requirements

PATH gateway requires:
1. ✅ `Target-Service-Id` header (e.g., "eth")
2. ✅ `App-Address` header (e.g., "pokt1q89a5tyhaq5xh49ec5n2wqn5zhynw6fmve06sv")

## 🔍 Next Steps

### 1. Verify Headers Are Being Sent ⭐⭐⭐

**Check gateway route:**
- Verify `App-Address` header is set correctly
- Verify `Target-Service-Id` header is set correctly
- Check if headers are being stripped by Traefik

**Test direct PATH gateway:**
```bash
curl -v -X POST "http://localhost:3069/v1" \
  -H "Content-Type: application/json" \
  -H "Target-Service-Id: eth" \
  -H "App-Address: pokt1q89a5tyhaq5xh49ec5n2wqn5zhynw6fmve06sv" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

### 2. Check Traefik Configuration ⭐⭐

**Potential Issue:** Traefik might be stripping headers

**Check:**
- Traefik middleware configuration
- Header forwarding rules
- Request/response headers

### 3. Monitor PATH Gateway During Load Test ⭐

**Run load test and monitor:**
```bash
# Terminal 1: Run load test
ENDPOINT_ID=ethpath_1764014188689_1764014188693 \
TARGET_RPS=2000 \
TOTAL_REQUESTS=1000000 \
k6 run load-test-path-1m-5krps.js

# Terminal 2: Monitor PATH gateway logs
docker logs shannon-testnet-gateway -f | grep -iE "(error|header|app-address)"

# Terminal 3: Monitor PATH gateway stats
watch -n 1 'docker stats shannon-testnet-gateway --no-stream'
```

## 🎯 Hypothesis

**PATH gateway errors suggest:**
1. Headers might not be reaching PATH gateway
2. Traefik might be stripping headers
3. Some requests might be missing headers

**If headers are missing:**
- PATH gateway rejects requests
- Requests fail or timeout
- Throughput limited by failed requests

## 📊 Current Performance

**Load Test Results:**
- Throughput: 386 RPS (target: 2000 RPS)
- Response time: 4.48s avg
- Error rate: 0.81%

**PATH Gateway:**
- CPU: 0% (not bottleneck)
- Memory: Low usage (not bottleneck)
- Errors: Header-related errors in logs

**Conclusion:** Header issues might be causing request failures/timeouts, limiting throughput.

## ✅ Actions Taken

1. ✅ Fixed PM2 errored instance
2. ✅ Checked PATH gateway status
3. ✅ Identified header-related errors
4. ✅ Created investigation plan

## 🚀 Next Actions

1. **Verify headers in gateway route** - Check if headers are set correctly
2. **Test direct PATH gateway** - Verify headers work when sent directly
3. **Check Traefik configuration** - Verify headers aren't being stripped
4. **Monitor during load test** - See if errors correlate with performance

## Summary

✅ **PATH gateway healthy** - Not resource constrained
⚠️ **Header errors** - PATH gateway rejecting requests without headers
🔍 **Next step** - Verify headers are being sent correctly

**The bottleneck might be header-related request failures!** 🔍

