# Load Test TLS & Infrastructure Fixes

## Issues Identified

1. **TLS Certificate Mismatch**: Default cert being presented instead of pokt.ai cert
2. **HTTP/2 GOAWAY ENHANCE_YOUR_CALM**: HTTP/2 rate limiting triggered
3. **Connection Timeouts/Resets**: Connection pool exhaustion
4. **Low Success Rate**: Only 0.4% HTTP 200 (2.5M requests attempted, 1,250 RPS)

## Root Causes

### 1. TLS Certificate Issue
- The catch-all route (`poktai-default`) might be matching incorrectly
- Certificate resolver might not have valid cert for pokt.ai
- DNS might not be pointing correctly

### 2. HTTP/2 Rate Limiting
- Traefik/Go HTTP/2 server has default limits that are too low
- No explicit HTTP/2 configuration in Traefik
- ENHANCE_YOUR_CALM is Go's way of saying "too many requests per connection"

### 3. Connection Pool Exhaustion
- `maxIdleConnsPerHost: 400` is too low for 1,250 RPS
- No connection pool settings for upstream services
- HTTP/2 multiplexing might be hitting limits

## Fixes Required

### Fix 1: Update Traefik Configuration for HTTP/2 and High Load

```yaml
# loadbalancer/traefik.yml
log:
  level: INFO
  filePath: /var/log/traefik/traefik.log

entryPoints:
  web:
    address: ":80"
    http:
      redirections:
        entryPoint:
          to: websecure
          scheme: https
          permanent: true
  
  websecure:
    address: ":443"
    http:
      # Enable HTTP/2 with higher limits
      http2:
        maxConcurrentStreams: 1000
      # Increase buffer sizes for high load
      middlewares: []
      compression: {}
      # Increase timeouts for high load scenarios
    transport:
      respondingTimeouts:
        readTimeout: 30s
        writeTimeout: 30s
        idleTimeout: 90s
      # Increase connection limits
      maxIdleConns: 10000
      maxIdleConnsPerHost: 2000
      idlenessTimeout: 90s
      # HTTP/2 specific settings
      http2:
        maxConcurrentStreams: 1000

serversTransport:
  insecureSkipVerify: true
  maxIdleConnsPerHost: 2000  # Increased from 400
  maxIdleConns: 10000
  idlenessTimeout: 90s
  forwardingTimeouts:
    dialTimeout: 30s
    responseHeaderTimeout: 30s
    idleConnTimeout: 90s

# ... rest of config
```

### Fix 2: Update poktai.yaml Gateway Route Priority

The gateway route should have the highest priority to ensure it matches first:

```yaml
# loadbalancer/services/poktai.yaml
http:
  routers:
    # Gateway route - HIGHEST PRIORITY
    poktai-gateway:
      rule: "Host(`pokt.ai`) && PathPrefix(`/api/gateway`)"
      service: poktai-web
      middlewares:
        - poktai-gateway-proxy
        - gateway-no-rate-limit  # New middleware
      entryPoints:
        - websecure
      tls:
        certResolver: https-resolver
        # Ensure cert is valid for pokt.ai
        domains:
          - main: "pokt.ai"
          - sans: ["*.pokt.ai"]
      priority: 1000  # Highest priority - ensure it matches first
    
    # Remove or lower priority of catch-all route
    poktai-default:
      rule: "HostRegexp(`.*`)"
      service: poktai-web
      entryPoints:
        - websecure
      tls:
        certResolver: https-resolver
      priority: 1  # Lowest priority - only matches if nothing else does

  middlewares:
    # Gateway should not have rate limiting during load tests
    gateway-no-rate-limit:
      # Empty middleware - no rate limiting
      # Or remove rate limiting entirely for gateway
    
    # Increase connection limits for gateway service
    gateway-connection-pool:
      buffering:
        maxRequestBodyBytes: 10485760  # 10MB
        maxResponseBodyBytes: 10485760
        memRequestBodyBytes: 2097152  # 2MB
        memResponseBodyBytes: 2097152
        retryExpression: "IsNetworkError() && Attempts() < 2"
```

### Fix 3: Verify Certificate Resolution

Check if certificate is properly issued:

```bash
# Check Traefik logs for certificate issues
docker logs traefik | grep -i "certificate\|acme\|letsencrypt"

# Check if cert exists
ls -la /path/to/traefik/certs/letsencrypt/acme.json

# Test certificate
openssl s_client -connect pokt.ai:443 -servername pokt.ai
```

### Fix 4: DNS Verification

Ensure DNS is pointing correctly:

```bash
# Check DNS resolution
dig pokt.ai
nslookup pokt.ai

# Should resolve to your Traefik server IP
```

### Fix 5: Update Docker Compose for Traefik

```yaml
# loadbalancer/docker-compose.yaml
services:
  traefik:
    image: traefik:3.2.3
    container_name: traefik
    restart: unless-stopped
    network_mode: host
    command:
      - --api.dashboard=true
      - --log.level=INFO
      - --log.filePath=/var/log/traefik/traefik.log
      - --accesslog=true
      - --accesslog.filePath=/var/log/traefik/access.log
      # HTTP/2 settings
      - --entrypoints.websecure.http.http2.maxConcurrentStreams=1000
      - --entrypoints.websecure.transport.maxIdleConns=10000
      - --entrypoints.websecure.transport.maxIdleConnsPerHost=2000
      - --serversTransport.maxIdleConnsPerHost=2000
      - --serversTransport.maxIdleConns=10000
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./traefik.yml:/traefik.yml:ro
      - ./services/:/etc/traefik/services/:ro
      - ./certs:/letsencrypt
      - ./logs:/var/log/traefik
```

## Recommended Load Test Settings

### For Single Host Load Test

```bash
# Use lower rate per host to avoid HTTP/2 limits
vegeta attack \
  -rate=500 \  # Reduced from 1,250 to avoid HTTP/2 GOAWAY
  -duration=33m \
  -targets=targets.txt \
  -max-workers=100 \
  -max-body=10485760 \
  -keepalive=true \
  -timeout=30s
```

### For Multi-Host Load Test (Recommended)

```bash
# Distribute load across multiple hosts
# Each host runs at 300-500 RPS
# Total: 1,250 RPS across 3-4 hosts

# Host 1
vegeta attack -rate=400 -duration=33m -targets=targets.txt

# Host 2  
vegeta attack -rate=400 -duration=33m -targets=targets.txt

# Host 3
vegeta attack -rate=450 -duration=33m -targets=targets.txt
```

## Verification Steps

1. **Check Certificate**:
   ```bash
   curl -vI https://pokt.ai/api/gateway?endpoint=test 2>&1 | grep -i "certificate\|subject"
   # Should show: subject: CN=pokt.ai
   ```

2. **Test HTTP/2**:
   ```bash
   curl -v --http2 https://pokt.ai/api/gateway?endpoint=test 2>&1 | grep -i "http/2\|alpnp"
   # Should show: ALPN, server accepted to use h2
   ```

3. **Monitor Traefik**:
   ```bash
   # Watch Traefik logs
   tail -f /var/log/traefik/traefik.log | grep -i "error\|certificate\|goaway"
   
   # Check Traefik dashboard
   curl http://localhost:8080/api/http/routers
   ```

4. **Load Test Verification**:
   ```bash
   # Run short test first
   vegeta attack -rate=500 -duration=10s -targets=targets.txt | vegeta report
   
   # Check success rate - should be > 99%
   ```

## Expected Results After Fixes

- **Success Rate**: > 99% HTTP 200 responses
- **TLS**: Valid pokt.ai certificate presented
- **HTTP/2**: No GOAWAY ENHANCE_YOUR_CALM errors
- **Connections**: No connection timeouts/resets
- **Latency**: p95 < 500ms at 1,250 RPS

## Next Steps

1. Apply Traefik configuration updates
2. Restart Traefik: `docker restart traefik`
3. Verify certificate is loaded
4. Run short test (10 seconds) to verify fixes
5. Run full 33-minute load test with distributed hosts

