#!/bin/bash

echo "═══════════════════════════════════════════════════════"
echo "     🔧 FINAL FIX FOR POKT.AI - TRAEFIK ROUTING"
echo "═══════════════════════════════════════════════════════"
echo ""

echo "Step 1: Restarting Traefik with host network..."
cd /home/shannon/poktai/loadbalancer
docker compose down
sleep 2
docker compose up -d
sleep 5

echo "Step 2: Testing connectivity..."
echo ""
echo "Direct API test:"
curl -s http://localhost:3001/api/health
echo ""
echo ""
echo "Direct Web test:"
curl -s http://localhost:4000 | grep -o "<title>.*</title>"
echo ""
echo ""
echo "Traefik → API test:"
curl -s http://localhost/api/health
echo ""
echo ""
echo "Traefik → Web test:"
curl -s http://localhost | head -100
echo ""
echo ""

echo "═══════════════════════════════════════════════════════"
echo "     ✅ CONFIGURATION UPDATED"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "Now try accessing: https://pokt.ai/"
echo ""
echo "If you still get 404, the services need a moment to start."
echo "Wait 30 seconds and try again."
echo ""

















