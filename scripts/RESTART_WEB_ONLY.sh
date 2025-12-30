#!/bin/bash

echo "🔄 Restarting Web server with fixes..."
echo ""

# Kill web
pkill -9 -f "next dev"
sleep 2

# Start Web
cd /home/shannon/poktai/apps/web
npm run dev > /tmp/web-fixed.log 2>&1 &

echo "⏳ Waiting for Web to compile (20 seconds)..."
sleep 20

echo ""
echo "Testing..."
curl -I http://localhost:4000 | head -5
echo ""
curl http://localhost:4000 | grep -o "<title>.*</title>"
echo ""

echo "✅ Web restarted. Now try https://pokt.ai/ again!"
echo ""
echo "View logs: tail -f /tmp/web-fixed.log"
















