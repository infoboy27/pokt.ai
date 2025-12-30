#!/bin/bash

echo "Checking for errors..."
echo ""

echo "=== API Logs (last 30 lines) ==="
tail -30 /tmp/api-restart.log 2>/dev/null || tail -30 /tmp/api-fix.log 2>/dev/null || echo "No API logs found"
echo ""

echo "=== Web Logs (last 30 lines) ==="
tail -30 /tmp/web-restart.log 2>/dev/null || tail -30 /tmp/web-fix.log 2>/dev/null || echo "No Web logs found"
echo ""

echo "=== Traefik Logs (last 20 lines) ==="
docker logs traefik --tail 20 2>&1
echo ""

echo "=== Testing Services ==="
echo "API:"
curl -v http://localhost:3001/api/health 2>&1 | grep -E "HTTP|status"
echo ""
echo "Web:"
curl -I http://localhost:4000 2>&1 | head -5
echo ""

echo "=== Process Status ==="
ps aux | grep -E "nest|next" | grep -v grep

















