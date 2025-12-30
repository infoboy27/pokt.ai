# Quick Fix Summary - Load Test Infrastructure Issues

## Issues Found
- **0.4% success rate** (only ~10K/2.5M requests succeeded)
- **TLS certificate mismatch** (default cert instead of pokt.ai)
- **HTTP/2 GOAWAY ENHANCE_YOUR_CALM** (rate limiting)
- **Connection timeouts/resets**

## Fixes Applied

### ✅ 1. Traefik Configuration (`loadbalancer/traefik.yml.fixed`)
- **HTTP/2 settings**: `maxConcurrentStreams: 1000` (prevents GOAWAY errors)
- **Connection pool**: `maxIdleConnsPerHost: 2000` (was 400)
- **Timeout increases**: 30s read/write, 90s idle
- **Logging**: Added structured logging

### ✅ 2. Gateway Route Priority (`loadbalancer/services/poktai.yaml`)
- **Priority increased**: 250 → 1000 (ensures gateway matches first)
- **TLS domains**: Explicitly configured for pokt.ai
- **Buffering**: Added middleware for better handling

### ✅ 3. Catch-All Route Priority
- **Priority lowered**: Ensures catch-all only matches if nothing else does

## To Apply Fixes

```bash
cd loadbalancer
./APPLY_FIXES.sh
```

Or manually:
```bash
# Backup current config
cp traefik.yml traefik.yml.backup
cp services/poktai.yaml services/poktai.yaml.backup

# Apply new config
cp traefik.yml.fixed traefik.yml

# Restart Traefik
docker restart traefik
```

## Verify Certificate

```bash
# Check certificate
curl -vI https://pokt.ai/api/gateway?endpoint=test 2>&1 | grep -i "subject"

# Should show: subject: CN=pokt.ai
```

## Recommended Load Test Settings

### Option 1: Single Host (Lower Rate)
```bash
vegeta attack \
  -rate=500 \
  -duration=33m \
  -targets=targets.txt \
  -keepalive=true \
  -timeout=30s
```

### Option 2: Multi-Host (Distributed)
```bash
# Host 1: 400 RPS
# Host 2: 400 RPS  
# Host 3: 450 RPS
# Total: 1,250 RPS
```

## Expected Results After Fixes

- ✅ **Success Rate**: > 99%
- ✅ **TLS**: Valid pokt.ai certificate
- ✅ **No GOAWAY errors**: HTTP/2 limits increased
- ✅ **No timeouts**: Connection pool increased

## Files Changed

1. `loadbalancer/traefik.yml.fixed` - New Traefik config
2. `loadbalancer/services/poktai.yaml` - Updated gateway route
3. `loadbalancer/APPLY_FIXES.sh` - Automated fix script

## Next Steps

1. **Apply fixes** using the script
2. **Verify certificate** is loaded correctly
3. **Run short test** (10 seconds) to verify
4. **Run full load test** with distributed hosts

