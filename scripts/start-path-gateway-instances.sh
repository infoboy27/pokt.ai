#!/bin/bash
# Script to start multiple PATH gateway instances for horizontal scaling

set -e

GATEWAY_CONFIG="/home/shannon/shannon/gateway/config/gateway_config.yaml"
GATEWAY_IMAGE="ghcr.io/buildwithgrove/path:main"
NETWORK="shannon"

echo "🚀 Starting PATH Gateway Instances for Load Balancing"
echo ""

# Check if config file exists
if [ ! -f "$GATEWAY_CONFIG" ]; then
    echo "❌ Error: Gateway config file not found at $GATEWAY_CONFIG"
    exit 1
fi

# Function to start a PATH gateway instance
start_instance() {
    local instance_num=$1
    local port=$2
    local container_name="path-gateway-${instance_num}"
    
    echo "Starting ${container_name} on port ${port}..."
    
    # Stop and remove existing container if it exists
    docker stop "$container_name" 2>/dev/null || true
    docker rm "$container_name" 2>/dev/null || true
    
    # Start new container
    docker run -d \
        --name "$container_name" \
        --network "$NETWORK" \
        -p "${port}:3069" \
        -v "${GATEWAY_CONFIG}:/app/config/.config.yaml:ro" \
        --restart unless-stopped \
        "$GATEWAY_IMAGE" \
        ./path
    
    echo "✅ ${container_name} started on port ${port}"
}

# Start 10 instances (ports 3069-3078) for better throughput
# Check if shannon-testnet-gateway is already running on port 3069
if docker ps --format '{{.Names}}' | grep -q "^shannon-testnet-gateway$"; then
    echo "⚠️  shannon-testnet-gateway already running on port 3069"
    echo "   Keeping existing instance"
    echo "   Starting additional instances on ports 3070-3078..."
    # Start instances 1-9 on ports 3070-3078 (skip 3069)
    start_instance 1 3070
    start_instance 2 3071
    start_instance 3 3072
    start_instance 4 3073
    start_instance 5 3074
    start_instance 6 3075
    start_instance 7 3076
    start_instance 8 3077
    start_instance 9 3078
    echo ""
    echo "ℹ️  Total instances: 10 (shannon-testnet-gateway + 9 new instances)"
else
    echo "Starting 10 instances on ports 3069-3078..."
    start_instance 1 3069
    start_instance 2 3070
    start_instance 3 3071
    start_instance 4 3072
    start_instance 5 3073
    start_instance 6 3074
    start_instance 7 3075
    start_instance 8 3076
    start_instance 9 3077
    start_instance 10 3078
fi

echo ""
echo "✅ All PATH Gateway instances started!"
echo ""
echo "📊 Instance Status:"
echo "All PATH gateway instances (including shannon-testnet-gateway):"
docker ps --filter "name=gateway" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "No instances found"

echo ""
echo "🧪 Test instances:"
echo "  curl -X POST http://localhost:3069/v1 -H 'Target-Service-Id: eth' -H 'App-Address: pokt1q89a5tyhaq5xh49ec5n2wqn5zhynw6fmve06sv' -d '{\"jsonrpc\":\"2.0\",\"method\":\"eth_blockNumber\",\"params\":[],\"id\":1}'"
echo "  curl -X POST http://localhost:3070/v1 -H 'Target-Service-Id: eth' -H 'App-Address: pokt1q89a5tyhaq5xh49ec5n2wqn5zhynw6fmve06sv' -d '{\"jsonrpc\":\"2.0\",\"method\":\"eth_blockNumber\",\"params\":[],\"id\":1}'"
echo ""
echo "📝 Next steps:"
echo "  1. Restart Next.js to use round-robin load balancing"
echo "  2. Run load test to verify performance improvement"
echo "  3. Monitor instances: docker stats path-gateway-1 path-gateway-2 path-gateway-3 path-gateway-4 path-gateway-5"

