#!/bin/bash

echo "╔═══════════════════════════════════════════════════════╗"
echo "║     🔍 POKT.AI Service Check                         ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

# Check API
echo "1️⃣  Testing API (port 3001)..."
API_RESPONSE=$(curl -s -m 2 http://localhost:3001/api/health 2>&1)
if echo "$API_RESPONSE" | grep -q "ok"; then
    echo "   ✅ API is RUNNING"
    echo "   Response: $API_RESPONSE"
else
    echo "   ❌ API is NOT responding"
    echo "   Response: $API_RESPONSE"
fi
echo ""

# Check Web
echo "2️⃣  Testing Web (port 4000)..."
WEB_RESPONSE=$(curl -s -m 2 http://localhost:4000 2>&1)
if echo "$WEB_RESPONSE" | grep -q "pokt.ai"; then
    echo "   ✅ Web is RUNNING"
    echo "   Title: $(echo "$WEB_RESPONSE" | grep -o '<title>.*</title>')"
else
    echo "   ❌ Web is NOT responding"
    echo "   Response: ${WEB_RESPONSE:0:100}"
fi
echo ""

# Check Traefik
echo "3️⃣  Testing Traefik (port 80)..."
TRAEFIK_STATUS=$(docker ps | grep traefik)
if [ -n "$TRAEFIK_STATUS" ]; then
    echo "   ✅ Traefik container is running"
else
    echo "   ❌ Traefik container is NOT running"
fi
echo ""

# Test Traefik routing WITH Host header
echo "4️⃣  Testing Traefik routing..."
echo "   Testing: curl -H 'Host: pokt.ai' http://localhost/api/health"
TRAEFIK_API=$(curl -s -m 2 -H "Host: pokt.ai" http://localhost/api/health 2>&1)
if echo "$TRAEFIK_API" | grep -q "ok"; then
    echo "   ✅ Traefik → API routing: WORKING"
    echo "   Response: $TRAEFIK_API"
else
    echo "   ⚠️  Traefik → API routing: Not working yet"
    echo "   Response: $TRAEFIK_API"
fi
echo ""

# Test Traefik routing to Web
echo "   Testing: curl -H 'Host: pokt.ai' http://localhost"
TRAEFIK_WEB=$(curl -s -m 2 -H "Host: pokt.ai" http://localhost 2>&1)
if echo "$TRAEFIK_WEB" | grep -q "pokt.ai\|Moved Permanently"; then
    echo "   ✅ Traefik → Web routing: WORKING"
else
    echo "   ⚠️  Traefik → Web routing: Not working yet"
    echo "   Response: ${TRAEFIK_WEB:0:100}"
fi
echo ""

# Test WITHOUT Host header
echo "5️⃣  Testing WITHOUT Host header (will 404)..."
echo "   Testing: curl http://localhost"
NO_HOST=$(curl -s -m 2 http://localhost 2>&1)
echo "   Response: $NO_HOST"
echo "   ℹ️  This is EXPECTED to be 404 without Host header"
echo ""

echo "╔═══════════════════════════════════════════════════════╗"
echo "║     📊 SUMMARY                                       ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""
echo "✅ WHAT SHOULD WORK:"
echo "   - http://localhost:4000 (Direct Web access)"
echo "   - http://localhost:3001 (Direct API access)"
echo "   - curl -H 'Host: pokt.ai' http://localhost"
echo ""
echo "❌ WHAT WON'T WORK:"
echo "   - http://localhost (without Host header = 404)"
echo "   - http://pokt.ai (without DNS/hosts file)"
echo ""
echo "💡 RECOMMENDATION:"
echo "   Just use: http://localhost:4000 in your browser!"
echo ""

















