# Load Balancing Analysis

## Current Results

**Load Test (2000 RPS target):**
- Throughput: 329 RPS (16% of target)
- Average Response: 3.47s
- Error Rate: 0.17% ✅
- Success Rate: 99.83% ✅

**Instance Network I/O:**
- `shannon-testnet-gateway`: 5.45GB (most traffic)
- `path-gateway-1`: 1.8MB
- `path-gateway-2`: 1.8MB
- `path-gateway-3`: 1.8MB
- `path-gateway-4`: 1.8MB

## Problem Identified

**Uneven Load Distribution:**
- Most traffic going to first instance (port 3069)
- Other instances receiving minimal traffic
- Round-robin counter starts at 0 for all PM2 instances

## Solution Applied

**Improved Round-Robin:**
- Random starting point per PM2 instance
- Better distribution across instances
- Each process starts at different index

## Expected Improvement

**After Fix:**
- Traffic should distribute more evenly
- All 5 instances should receive similar load
- Throughput should improve closer to 2000 RPS

## Next Steps

1. ✅ Restart Next.js with improved round-robin
2. 🔄 Re-run load test
3. 📊 Monitor instance distribution
4. 🎯 Verify throughput improvement

## Monitoring

**Check instance distribution:**
```bash
docker stats shannon-testnet-gateway path-gateway-1 path-gateway-2 path-gateway-3 path-gateway-4 --no-stream
```

**Expected:** All instances should have similar network I/O after fix.

