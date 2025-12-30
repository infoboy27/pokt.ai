#!/bin/bash

echo "=== Diagnosing Internal Server Error ==="
echo ""

echo "1. Testing Web directly (port 4000):"
curl -I http://localhost:4000 2>&1 | head -10
echo ""

echo "2. Testing API directly (port 3001):"
curl -s http://localhost:3001/api/health
echo ""

echo "3. Testing via Traefik HTTP (port 80):"
curl -I http://localhost 2>&1 | head -10
echo ""

echo "4. Checking Web logs for errors:"
tail -50 /tmp/web-restart.log 2>/dev/null | grep -i "error\|ready\|compiled" || echo "No web logs"
echo ""

echo "5. Checking if Web is fully compiled:"
tail -20 /tmp/web-restart.log 2>/dev/null | tail -5
echo ""

echo "6. Testing Traefik can reach localhost:"
docker exec traefik ping -c 1 127.0.0.1 2>&1 | head -3
echo ""

echo "7. Checking Traefik logs for errors:"
docker logs traefik 2>&1 | grep -i "error\|500" | tail -10
echo ""

echo "=== Run this to see real-time Web compilation ==="
echo "tail -f /tmp/web-restart.log"
















