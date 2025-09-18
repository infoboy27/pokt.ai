#!/bin/bash

# Monitoring script for pokt.ai services
echo "🔍 pokt.ai Service Monitor"
echo "========================="

# Check service status
echo "📊 Service Status:"
docker-compose -f infra/docker-compose.simple-stable.yml ps

echo ""
echo "🌐 Service Health Checks:"

# Check API health
echo -n "API (port 3001): "
if curl -s -f http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "✅ Healthy"
else
    echo "❌ Unhealthy"
fi

# Check Web health
echo -n "Web (port 3005): "
if curl -s -f http://localhost:3005 > /dev/null 2>&1; then
    echo "✅ Healthy"
else
    echo "❌ Unhealthy"
fi

echo ""
echo "📈 Resource Usage:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"

echo ""
echo "🔗 Access URLs:"
echo "   Web Application: http://localhost:3005"
echo "   API: http://localhost:3001"
echo "   API Documentation: http://localhost:3001/docs"

echo ""
echo "📋 Recent Logs (last 10 lines):"
docker-compose -f infra/docker-compose.simple-stable.yml logs --tail=10


