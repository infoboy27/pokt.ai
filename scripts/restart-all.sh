#!/bin/bash

echo "╔═══════════════════════════════════════════════════════╗"
echo "║     🔄 Restarting POKT.AI Services                   ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

# Step 1: Stop existing services
echo "Step 1: Stopping existing processes..."
pkill -9 -f "nest start" 2>/dev/null
pkill -9 -f "next dev" 2>/dev/null
echo "  ✓ Processes stopped"
echo ""

# Wait for processes to fully terminate
sleep 3

# Step 2: Start API
echo "Step 2: Starting API server..."
cd /home/shannon/poktai/apps/api
npm run dev > /tmp/api-restart.log 2>&1 &
API_PID=$!
echo "  ✓ API starting (PID: $API_PID)"
echo "  ⏳ Waiting for API to initialize (12 seconds)..."
sleep 12

# Check API
if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "  ✅ API is running and healthy!"
    curl -s http://localhost:3001/api/health
else
    echo "  ⚠️  API is starting... (may need a few more seconds)"
fi
echo ""

# Step 3: Start Web
echo "Step 3: Starting Web server..."
cd /home/shannon/poktai/apps/web
npm run dev > /tmp/web-restart.log 2>&1 &
WEB_PID=$!
echo "  ✓ Web starting (PID: $WEB_PID)"
echo "  ⏳ Waiting for Web to compile (15 seconds)..."
sleep 15

# Check Web
if curl -s http://localhost:4000 | grep -q "pokt.ai"; then
    echo "  ✅ Web is running!"
    curl -s http://localhost:4000 | grep -o "<title>.*</title>"
else
    echo "  ⚠️  Web is starting... (may need a few more seconds)"
fi
echo ""

# Step 4: Verify Traefik
echo "Step 4: Checking Traefik loadbalancer..."
if docker ps | grep -q traefik; then
    echo "  ✅ Traefik is running"
    
    # Test routing
    if curl -s -H "Host: pokt.ai" http://localhost/api/health | grep -q "ok"; then
        echo "  ✅ Traefik routing is working!"
    else
        echo "  ⚠️  Traefik routing needs verification"
        echo "  💡 Restart Traefik: cd /home/shannon/poktai/loadbalancer && docker compose restart"
    fi
else
    echo "  ⚠️  Traefik is not running"
    echo "  💡 Start it: cd /home/shannon/poktai/loadbalancer && docker compose up -d"
fi
echo ""

# Step 5: Status Summary
echo "╔═══════════════════════════════════════════════════════╗"
echo "║     ✅ Restart Complete!                             ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""
echo "🌐 Access Your Application:"
echo ""
echo "   Web:     http://localhost:4000"
echo "   API:     http://localhost:3001"
echo "   Health:  http://localhost:3001/api/health"
echo "   Docs:    http://localhost:3001/docs"
echo ""
echo "📝 View Logs:"
echo ""
echo "   API:  tail -f /tmp/api-restart.log"
echo "   Web:  tail -f /tmp/web-restart.log"
echo ""
echo "✨ All services should be running now!"
echo ""

















