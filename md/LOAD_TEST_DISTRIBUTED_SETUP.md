# Distributed Load Test Setup Guide

## Recommended Configuration

### Target: 5,000 RPS across 10-20 hosts

**Per-Host Rate**: 250-500 RPS (well below system limits)

## Setup Steps

### 1. Prepare Load Generator Hosts

On each load generator host:

```bash
# Copy tuning script
scp tune-system-limits.sh user@load-generator-host:/tmp/

# SSH to each host and run
ssh user@load-generator-host
chmod +x /tmp/tune-system-limits.sh
sudo /tmp/tune-system-limits.sh
```

### 2. Create Target Files

Create separate target files for each chain:

```bash
# targets-ethereum.txt
POST https://pokt.ai/api/gateway?endpoint=ETH_ENDPOINT_ID
Content-Type: application/json

{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}

# targets-boba.txt
POST https://pokt.ai/api/gateway?endpoint=BOBA_ENDPOINT_ID
Content-Type: application/json

{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}

# targets-mantle.txt
POST https://pokt.ai/api/gateway?endpoint=MANTLE_ENDPOINT_ID
Content-Type: application/json

{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}

# targets-kava.txt
POST https://pokt.ai/api/gateway?endpoint=KAVA_ENDPOINT_ID
Content-Type: application/json

{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}
```

### 3. Distribute Load

#### Option A: Equal Distribution (500 RPS per host × 10 hosts)

```bash
# Host 1: Ethereum only
vegeta attack -rate=500 -duration=33m -targets=targets-ethereum.txt -keepalive=true -output=results-host1.bin

# Host 2: Ethereum only
vegeta attack -rate=500 -duration=33m -targets=targets-ethereum.txt -keepalive=true -output=results-host2.bin

# Host 3-4: Boba
vegeta attack -rate=500 -duration=33m -targets=targets-boba.txt -keepalive=true -output=results-host3.bin

# Host 5-6: Mantle
vegeta attack -rate=500 -duration=33m -targets=targets-mantle.txt -keepalive=true -output=results-host5.bin

# Host 7-8: Kava
vegeta attack -rate=500 -duration=33m -targets=targets-kava.txt -keepalive=true -output=results-host7.bin

# Host 9-10: Mixed chains
vegeta attack -rate=500 -duration=33m -targets=targets-all.txt -keepalive=true -output=results-host9.bin
```

#### Option B: Per-Chain Distribution (Clean Metrics)

```bash
# Ethereum: 2,000 RPS (4 hosts × 500 RPS)
# Host 1-4: targets-ethereum.txt at 500 RPS each

# Boba: 1,000 RPS (2 hosts × 500 RPS)
# Host 5-6: targets-boba.txt at 500 RPS each

# Mantle: 1,000 RPS (2 hosts × 500 RPS)
# Host 7-8: targets-mantle.txt at 500 RPS each

# Kava: 1,000 RPS (2 hosts × 500 RPS)
# Host 9-10: targets-kava.txt at 500 RPS each
```

### 4. Run Tests Simultaneously

```bash
# Start all tests at the same time (within 1 second)
# Use a script or orchestration tool

# Example: parallel execution
parallel -j 10 --line-buffer \
  'ssh host{} "vegeta attack -rate=500 -duration=33m -targets=targets.txt -keepalive=true -output=results-host{}.bin"' \
  ::: {1..10}
```

### 5. Collect and Aggregate Results

```bash
# Collect results from all hosts
for i in {1..10}; do
  scp host$i:results-host$i.bin results-host$i.bin
done

# Aggregate results
cat results-host*.bin | vegeta report

# Per-chain analysis
vegeta report results-ethereum-*.bin
vegeta report results-boba-*.bin
vegeta report results-mantle-*.bin
vegeta report results-kava-*.bin
```

## Expected Results

### Per-Host (500 RPS)
- ✅ **Success Rate**: > 99%
- ✅ **No port exhaustion**: ~500 connections max
- ✅ **No HTTP/2 GOAWAY**: Well below limits
- ✅ **Clean metrics**: Steady-state capacity

### Aggregate (5,000 RPS)
- ✅ **Success Rate**: > 99%
- ✅ **Per-chain metrics**: Accurate measurements
- ✅ **Cost analysis**: Reliable CUPR numbers
- ✅ **Capacity planning**: Real bottleneck identification

## Monitoring

### During Test

```bash
# Monitor each host
ssh host1 'watch -n 1 "ss -tan | grep ESTAB | wc -l"'

# Monitor server
docker logs traefik -f | grep -i "error\|timeout"

# Check connection pool usage
# Monitor Traefik metrics endpoint
curl http://traefik-server:8082/metrics | grep -i "connection\|pool"
```

## Troubleshooting

### Port Exhaustion
```bash
# Check current usage
ss -tan state time-wait | wc -l

# If high, reduce rate per host or add more hosts
```

### HTTP/2 GOAWAY
```bash
# Check Traefik logs
docker logs traefik | grep -i "goaway\|enhance"

# If still occurring, reduce RPS per host further
```

## Cost & Capacity Analysis

Once you have clean measurements:

### Per-Chain Capacity
- **Ethereum**: X RPS (actual capacity)
- **Boba**: Y RPS
- **Mantle**: Z RPS
- **Kava**: W RPS

### Cost Per Relay
- Database queries per request
- Redis operations per request
- Network bandwidth
- Compute resources

### Scaling Requirements
- **Current capacity**: X RPS total
- **Target capacity**: 5,000 RPS
- **Instances needed**: Y instances
- **Cost per instance**: $Z/month

