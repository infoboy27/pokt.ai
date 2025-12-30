#!/bin/bash

echo "🔄 Restarting Traefik with host network mode..."
echo ""

cd /home/shannon/poktai/loadbalancer

echo "Step 1: Stopping Traefik..."
docker compose down
echo "  ✓ Traefik stopped"
echo ""

sleep 2

echo "Step 2: Starting Traefik with new configuration..."
docker compose up -d
echo "  ✓ Traefik started"
echo ""

sleep 5

echo "Step 3: Testing..."
echo "  Testing API routing:"
curl -s -H "Host: pokt.ai" http://localhost/api/health
echo ""
echo "  Testing Web routing:"
curl -s -H "Host: pokt.ai" http://localhost | grep -o "<title>.*</title>"
echo ""

echo "✅ Traefik restart complete!"
echo ""
echo "Now try accessing: https://pokt.ai/"

















