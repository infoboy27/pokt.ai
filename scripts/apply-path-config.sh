#!/bin/bash

# Apply PATH Gateway Configuration
# This script recreates the web container with PATH gateway environment variables

set -e

echo "🔧 Applying PATH Gateway Configuration"
echo "======================================="
echo ""

WEB_CONTAINER="pokt-ai-web"
COMPOSE_DIR="infra"

# Check if container exists
if ! docker ps -a --format "{{.Names}}" | grep -q "^${WEB_CONTAINER}$"; then
    echo "❌ Container '$WEB_CONTAINER' not found"
    exit 1
fi

echo "📋 Current container status:"
docker ps --filter "name=${WEB_CONTAINER}" --format "  {{.Names}}: {{.Status}}"
echo ""

# Check if managed by docker-compose
COMPOSE_PROJECT=$(docker inspect "$WEB_CONTAINER" --format '{{index .Config.Labels "com.docker.compose.project"}}' 2>/dev/null || echo "")

if [ -n "$COMPOSE_PROJECT" ]; then
    echo "✅ Container is managed by docker-compose"
    echo "   Project: $COMPOSE_PROJECT"
    echo ""
    echo "Recreating container with new environment variables..."
    
    if [ -f "$COMPOSE_DIR/docker-compose.yml" ]; then
        cd "$COMPOSE_DIR"
        docker compose stop web
        docker compose up -d web
        echo ""
        echo "✅ Container recreated!"
    else
        echo "❌ docker-compose.yml not found in $COMPOSE_DIR"
        exit 1
    fi
else
    echo "⚠️  Container is not managed by docker-compose"
    echo ""
    echo "You have two options:"
    echo ""
    echo "Option 1: Stop and recreate manually with env vars"
    echo "  docker stop $WEB_CONTAINER"
    echo "  docker rm $WEB_CONTAINER"
    echo "  # Then start with your docker run command + env vars"
    echo ""
    echo "Option 2: Update docker-compose.yml and use compose"
    echo "  cd $COMPOSE_DIR"
    echo "  docker compose up -d web"
    echo ""
    
    read -p "Do you want to stop the container now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker stop "$WEB_CONTAINER"
        echo "✅ Container stopped"
        echo "Please recreate it with the updated docker-compose.yml"
    fi
fi

echo ""
echo "⏳ Waiting 5 seconds for container to start..."
sleep 5

echo ""
echo "🔍 Verifying environment variables:"
docker exec "$WEB_CONTAINER" printenv | grep -E "(USE_LOCAL_NODE|LOCAL_GATEWAY_URL|PATH_GATEWAY_APP_ADDRESS)" || {
    echo "⚠️  Environment variables not found"
    echo "   Container may need to be recreated"
}

echo ""
echo "✅ Done!"
echo ""
echo "Next: Run ./test-path-gateway.sh to test the integration"

