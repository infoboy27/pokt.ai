#!/bin/bash
# Script to apply Traefik fixes for load testing

set -e

echo "🔧 Applying Traefik configuration fixes for load testing..."

# Backup current config
echo "📦 Backing up current configuration..."
cp loadbalancer/traefik.yml loadbalancer/traefik.yml.backup.$(date +%Y%m%d_%H%M%S)
cp loadbalancer/services/poktai.yaml loadbalancer/services/poktai.yaml.backup.$(date +%Y%m%d_%H%M%S)

# Apply new config
echo "✅ Applying new Traefik configuration..."
cp loadbalancer/traefik.yml.fixed loadbalancer/traefik.yml

# Create log directory if it doesn't exist
mkdir -p loadbalancer/logs

# Restart Traefik
echo "🔄 Restarting Traefik..."
cd loadbalancer
docker-compose restart traefik || docker restart traefik

echo "⏳ Waiting for Traefik to restart..."
sleep 5

# Verify Traefik is running
if docker ps | grep -q traefik; then
    echo "✅ Traefik restarted successfully"
else
    echo "❌ Traefik failed to start. Check logs:"
    docker logs traefik --tail 50
    exit 1
fi

# Check certificate status
echo "🔍 Checking certificate status..."
sleep 10
curl -sI https://pokt.ai/api/gateway?endpoint=test 2>&1 | grep -i "certificate\|subject" || echo "⚠️  Certificate check - verify manually"

echo ""
echo "✅ Fixes applied successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Verify certificate: curl -vI https://pokt.ai/api/gateway?endpoint=test"
echo "2. Check Traefik logs: docker logs traefik --tail 100"
echo "3. Run short load test to verify: vegeta attack -rate=500 -duration=10s"
echo "4. Monitor for HTTP/2 GOAWAY errors"
echo ""
echo "📝 Logs location:"
echo "   - Traefik: loadbalancer/logs/traefik.log"
echo "   - Access: loadbalancer/logs/access.log"

