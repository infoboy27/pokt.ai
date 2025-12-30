# Load Test System Tuning Guide

## Issues Identified at 5,000 RPS

1. **Client-side**: "bind: address already in use" - Ephemeral port exhaustion
2. **HTTP/2 GOAWAY ENHANCE_YOUR_CALM**: HTTP/2 stream limits hit
3. **I/O timeouts**: Connection pool exhaustion
4. **Success Rate**: 0.16% (16,276/10M requests)

## Root Causes

### 1. Ephemeral Port Exhaustion (Client-side)
- **Problem**: Single host can only use ~65K ephemeral ports
- **Math**: At 5,000 RPS with 30s timeout = ~150K connections in TIME_WAIT
- **Solution**: Increase ephemeral port range, reduce TIME_WAIT, or use multiple hosts

### 2. HTTP/2 GOAWAY ENHANCE_YOUR_CALM
- **Problem**: HTTP/2 default maxConcurrentStreams is typically 250-1000
- **Solution**: Already configured in Traefik, but may need Go runtime tuning

### 3. Connection Pool Saturation
- **Problem**: Even with 2000 connections, 5K RPS from single host overwhelms
- **Solution**: Distribute load across multiple hosts

## System Tuning for Load Generator

### Linux Kernel Parameters (Load Generator Host)

```bash
# Increase ephemeral port range (default: 32768-60999 = 28K ports)
# Increase to 10000-65535 = ~55K ports
echo 'net.ipv4.ip_local_port_range = 10000 65535' | sudo tee -a /etc/sysctl.conf

# Reduce TIME_WAIT timeout (default: 60s, reduce to 15s)
echo 'net.ipv4.tcp_tw_reuse = 1' | sudo tee -a /etc/sysctl.conf
echo 'net.ipv4.tcp_fin_timeout = 15' | sudo tee -a /etc/sysctl.conf

# Increase connection tracking
echo 'net.netfilter.nf_conntrack_max = 1000000' | sudo tee -a /etc/sysctl.conf
echo 'net.ipv4.ip_conntrack_max = 1000000' | sudo tee -a /etc/sysctl.conf

# Increase file descriptor limits
echo '* soft nofile 1000000' | sudo tee -a /etc/security/limits.conf
echo '* hard nofile 1000000' | sudo tee -a /etc/security/limits.conf

# Increase TCP connection limits
echo 'net.core.somaxconn = 65535' | sudo tee -a /etc/sysctl.conf
echo 'net.ipv4.tcp_max_syn_backlog = 65535' | sudo tee -a /etc/sysctl.conf

# Apply changes
sudo sysctl -p
```

### Vegeta-Specific Tuning

```bash
# Use connection reuse (keepalive)
vegeta attack \
  -rate=500 \  # Lower rate per host
  -duration=33m \
  -targets=targets.txt \
  -keepalive=true \
  -timeout=30s \
  -max-workers=1000 \  # Increase workers
  -max-body=10485760
```

## Recommended Load Test Strategy

### Option 1: Distributed Multi-Host (Recommended)

**Target**: 5,000 RPS total across 10-20 hosts

```bash
# Each host runs at 250-500 RPS
# Host 1-10: 500 RPS each = 5,000 RPS total

# Host 1
vegeta attack -rate=500 -duration=33m -targets=targets.txt -keepalive=true -timeout=30s

# Host 2
vegeta attack -rate=500 -duration=33m -targets=targets.txt -keepalive=true -timeout=30s

# ... (repeat for 10 hosts)
```

**Benefits**:
- ✅ No ephemeral port exhaustion
- ✅ No single point of failure
- ✅ Realistic distributed traffic pattern
- ✅ Clean measurements per chain

### Option 2: Single Host with Lower Rate

**Target**: 500-1000 RPS per host

```bash
# With system tuning, single host can handle 500-1000 RPS
vegeta attack \
  -rate=500 \
  -duration=33m \
  -targets=targets.txt \
  -keepalive=true \
  -timeout=30s \
  -max-workers=1000
```

**Benefits**:
- ✅ Simpler setup
- ✅ Lower resource requirements
- ✅ Good for testing steady-state capacity

### Option 3: Multi-Host with System Tuning

**Target**: 1,000 RPS per host × 5 hosts = 5,000 RPS

```bash
# Each host tuned + 1,000 RPS
# Provides buffer and realistic distribution
```

## Per-Chain Load Distribution

### Target: 5,000 RPS total across 4 chains

```bash
# Ethereum: 2,000 RPS (40%)
# Boba: 1,000 RPS (20%)
# Mantle: 1,000 RPS (20%)
# Kava: 1,000 RPS (20%)

# Create separate target files
# targets-ethereum.txt
# targets-boba.txt
# targets-mantle.txt
# targets-kava.txt

# Run on separate hosts or sequentially
vegeta attack -rate=2000 -duration=33m -targets=targets-ethereum.txt -keepalive=true
vegeta attack -rate=1000 -duration=33m -targets=targets-boba.txt -keepalive=true
vegeta attack -rate=1000 -duration=33m -targets=targets-mantle.txt -keepalive=true
vegeta attack -rate=1000 -duration=33m -targets=targets-kava.txt -keepalive=true
```

## Server-Side Tuning (Gateway)

### Traefik HTTP/2 Limits (Already Applied)
- ✅ Connection pool: 2000 per host
- ✅ HTTP/2 enabled (default in Traefik 3.x)

### Go Runtime Tuning (if Traefik is hitting limits)

```bash
# Set Go environment variables for Traefik container
export GOMAXPROCS=8  # Match CPU cores
export GODEBUG=http2debug=0  # Disable HTTP/2 debug logging
```

### Additional Traefik Configuration

We may need to add HTTP/2 maxConcurrentStreams via command line flags:

```yaml
# In docker-compose or Traefik command
command:
  - --entrypoints.websecure.http.http2.maxConcurrentStreams=1000
```

## Verification Scripts

### Check System Limits
```bash
#!/bin/bash
echo "Ephemeral ports:"
cat /proc/sys/net/ipv4/ip_local_port_range

echo "File descriptors:"
ulimit -n

echo "Connection tracking:"
cat /proc/sys/net/netfilter/nf_conntrack_max

echo "TIME_WAIT connections:"
ss -tan | grep TIME-WAIT | wc -l
```

### Check Port Usage
```bash
# Monitor ephemeral port usage
watch -n 1 'ss -tan | grep ESTAB | wc -l'

# Check TIME_WAIT connections
ss -tan state time-wait | wc -l
```

## Expected Results After Tuning

### Single Host (500-1000 RPS)
- ✅ **Success Rate**: > 99%
- ✅ **No port exhaustion**: With tuned limits
- ✅ **Clean measurements**: Steady-state capacity

### Multi-Host (5,000 RPS total)
- ✅ **Success Rate**: > 99%
- ✅ **Per-chain metrics**: Clean measurements
- ✅ **Realistic distribution**: Mimics real-world traffic

## Next Steps

1. **Tune system limits** on load generator hosts
2. **Distribute load** across 10-20 hosts (250-500 RPS each)
3. **Create per-chain targets** for accurate metrics
4. **Monitor both client and server** during test
5. **Gradually increase** RPS to find actual capacity limits

## Cost & Capacity Analysis

Once we have clean measurements:
- **Per-chain capacity**: Actual RPS each chain can handle
- **Cost per relay**: Database query costs
- **Scaling requirements**: How many instances needed
- **Bottlenecks**: Where the actual limits are

