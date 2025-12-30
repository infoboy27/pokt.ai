# Optimal Load Test Setup - 5,000 RPS Multi-Chain

## Recommended Configuration

### Strategy: Distributed Multi-Host

**Target**: 5,000 RPS total  
**Per-Host Rate**: 250-500 RPS  
**Number of Hosts**: 10-20 hosts  
**Duration**: 33 minutes  
**Total Requests**: ~10,000,000

## Why This Works

### Single Host Problems (5,000 RPS)
- ❌ **Ephemeral ports**: ~65K ports exhausted quickly
- ❌ **HTTP/2 GOAWAY**: ENHANCE_YOUR_CALM errors
- ❌ **Connection limits**: OS-level limits hit
- ❌ **Unrealistic**: Single point of failure

### Distributed Solution (250-500 RPS per host)
- ✅ **No port exhaustion**: ~500 connections per host
- ✅ **No HTTP/2 limits**: Well below thresholds
- ✅ **Realistic**: Mimics real-world traffic
- ✅ **Clean metrics**: Accurate per-chain measurements

## Setup Checklist

### 1. System Tuning (Each Load Generator)

```bash
# Run on each load generator host
./loadbalancer/tune-system-limits.sh

# Or manually:
sudo sysctl -w net.ipv4.ip_local_port_range="10000 65535"
sudo sysctl -w net.ipv4.tcp_tw_reuse=1
sudo sysctl -w net.ipv4.tcp_fin_timeout=15
ulimit -n 1000000
```

### 2. Per-Chain Target Files

Create separate target files for accurate metrics:

```bash
# targets-ethereum.txt
POST https://pokt.ai/api/gateway?endpoint=ETH_ENDPOINT
Content-Type: application/json

{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}

# targets-boba.txt
POST https://pokt.ai/api/gateway?endpoint=BOBA_ENDPOINT
Content-Type: application/json

{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}

# targets-mantle.txt
POST https://pokt.ai/api/gateway?endpoint=MANTLE_ENDPOINT
Content-Type: application/json

{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}

# targets-kava.txt
POST https://pokt.ai/api/gateway?endpoint=KAVA_ENDPOINT
Content-Type: application/json

{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}
```

### 3. Load Distribution Plan

#### Option A: Per-Chain Clean Metrics (Recommended)

```
Ethereum: 2,000 RPS (4 hosts × 500 RPS)
Boba:     1,000 RPS (2 hosts × 500 RPS)
Mantle:   1,000 RPS (2 hosts × 500 RPS)
Kava:     1,000 RPS (2 hosts × 500 RPS)
----------------------------------------
Total:    5,000 RPS (10 hosts)
```

#### Option B: Mixed Distribution

```
10 hosts × 500 RPS each = 5,000 RPS total
Each host uses targets-all.txt (random chain selection)
```

### 4. Execution Script

```bash
#!/bin/bash
# run-distributed-test.sh

HOSTS=("host1" "host2" "host3" "host4" "host5" "host6" "host7" "host8" "host9" "host10")
RATES=(500 500 500 500 500 500 500 500 500 500)
TARGETS=("targets-ethereum.txt" "targets-ethereum.txt" "targets-ethereum.txt" "targets-ethereum.txt" \
         "targets-boba.txt" "targets-boba.txt" \
         "targets-mantle.txt" "targets-mantle.txt" \
         "targets-kava.txt" "targets-kava.txt")

DURATION="33m"

# Start all attacks simultaneously
for i in "${!HOSTS[@]}"; do
  ssh "${HOSTS[$i]}" "vegeta attack -rate=${RATES[$i]} -duration=$DURATION -targets=${TARGETS[$i]} -keepalive=true -output=results-host$i.bin" &
done

# Wait for all to complete
wait

echo "✅ All load tests completed"
```

### 5. Results Aggregation

```bash
#!/bin/bash
# aggregate-results.sh

# Collect all results
for i in {1..10}; do
  scp host$i:results-host$i.bin results-host$i.bin
done

# Aggregate all results
echo "=== TOTAL RESULTS ==="
cat results-host*.bin | vegeta report

# Per-chain analysis
echo "=== ETHEREUM ==="
cat results-host{1..4}.bin | vegeta report

echo "=== BOBA ==="
cat results-host{5..6}.bin | vegeta report

echo "=== MANTLE ==="
cat results-host{7..8}.bin | vegeta report

echo "=== KAVA ==="
cat results-host{9..10}.bin | vegeta report

# Generate plots
cat results-host*.bin | vegeta plot > plot.html
```

## Expected Metrics

### Per-Host (500 RPS)
- **Success Rate**: > 99%
- **Average Latency**: < 500ms (p95)
- **Connections**: ~500 concurrent
- **Ports Used**: ~500 (well below 65K limit)

### Aggregate (5,000 RPS)
- **Total Requests**: ~10,000,000
- **Success Rate**: > 99%
- **Per-Chain RPS**: Accurate measurements
- **Cost Analysis**: Reliable CUPR numbers

## Monitoring During Test

```bash
# Monitor each host
for host in host{1..10}; do
  ssh $host 'echo "$host: $(ss -tan | grep ESTAB | wc -l) connections"'
done

# Monitor server
docker logs traefik -f | grep -i "error\|timeout\|goaway"

# Check Traefik metrics
curl http://traefik-server:8082/metrics | grep -i "connection\|request"
```

## Success Criteria

✅ **Success Rate**: > 99% (was 0.16%)  
✅ **No Port Exhaustion**: All hosts stable  
✅ **No HTTP/2 GOAWAY**: No ENHANCE_YOUR_CALM errors  
✅ **Per-Chain Metrics**: Clean measurements  
✅ **Cost Analysis**: Reliable CUPR numbers  

## Quick Start

```bash
# 1. Tune all load generator hosts
for host in host{1..10}; do
  scp tune-system-limits.sh $host:/tmp/
  ssh $host "sudo /tmp/tune-system-limits.sh"
done

# 2. Create target files (see above)

# 3. Run distributed test
./run-distributed-test.sh

# 4. Collect and analyze results
./aggregate-results.sh
```

---

**This setup will give you clean, accurate measurements for capacity and cost analysis.** 🎯

