#!/bin/bash

# Set PATH Gateway environment variables directly in running container
# This is a workaround if docker-compose isn't applying the env vars

WEB_CONTAINER="pokt-ai-web"

echo "🔧 Setting PATH Gateway Environment Variables"
echo "============================================="
echo ""

# Check if container exists
if ! docker ps -a --format "{{.Names}}" | grep -q "^${WEB_CONTAINER}$"; then
    echo "❌ Container '$WEB_CONTAINER' not found"
    echo ""
    echo "Available containers:"
    docker ps --format "  - {{.Names}}"
    exit 1
fi

# Check if container is running
if ! docker ps --format "{{.Names}}" | grep -q "^${WEB_CONTAINER}$"; then
    echo "⚠️  Container '$WEB_CONTAINER' is not running"
    echo "Starting container..."
    docker start "$WEB_CONTAINER"
    sleep 5
fi

echo "✅ Container is running"
echo ""

# Since we can't directly modify env vars in a running container,
# we need to recreate it. Let's check how it was started.
echo "📋 Container information:"
docker inspect "$WEB_CONTAINER" --format 'Image: {{.Config.Image}}'
docker inspect "$WEB_CONTAINER" --format 'Command: {{.Config.Cmd}}'
echo ""

echo "⚠️  Note: Environment variables can only be set when container is created."
echo ""
echo "Options:"
echo ""
echo "1. If using docker-compose, recreate the container:"
echo "   cd /home/shannon/poktai/infra"
echo "   docker compose stop web"
echo "   docker compose rm -f web"
echo "   docker compose up -d web"
echo ""
echo "2. If started manually, restart with env vars:"
echo "   docker stop $WEB_CONTAINER"
echo "   docker rm $WEB_CONTAINER"
echo "   # Then start with: docker run -e USE_LOCAL_NODE=true ..."
echo ""
echo "3. Create a .env file in infra/ directory:"
echo "   USE_LOCAL_NODE=true"
echo "   LOCAL_GATEWAY_URL=http://host.docker.internal:3069"
echo "   PATH_GATEWAY_APP_ADDRESS=pokt1q89a5tyhaq5xh49ec5n2wqn5zhynw6fmve06sv"

