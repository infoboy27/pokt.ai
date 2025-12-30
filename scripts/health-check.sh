#!/bin/bash

# Health Check Script for POKT.ai Admin Portal
# Usage: ./health-check.sh [endpoint-url]

ENDPOINT_URL=${1:-"http://135.125.163.236:4000/health"}
TIMEOUT=10

echo "🏥 Running Health Check..."
echo "📍 Endpoint: $ENDPOINT_URL"
echo "⏱️  Timeout: ${TIMEOUT}s"
echo ""

# Record start time
START_TIME=$(date +%s%3N)

# Perform health check
if curl -s --max-time $TIMEOUT "$ENDPOINT_URL" > /dev/null 2>&1; then
    END_TIME=$(date +%s%3N)
    RESPONSE_TIME=$((END_TIME - START_TIME))
    
    echo "✅ Health Check: PASSED"
    echo "📊 Response Time: ${RESPONSE_TIME}ms"
    echo "🟢 Status: Healthy"
    
    # Get HTTP status code
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$ENDPOINT_URL")
    echo "📡 HTTP Status: $HTTP_STATUS"
    
    exit 0
else
    END_TIME=$(date +%s%3N)
    RESPONSE_TIME=$((END_TIME - START_TIME))
    
    echo "❌ Health Check: FAILED"
    echo "📊 Response Time: ${RESPONSE_TIME}ms"
    echo "🔴 Status: Unhealthy"
    echo "💡 Check if the endpoint is running and accessible"
    
    exit 1
fi


