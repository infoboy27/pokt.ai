#!/bin/bash

# Stable startup script for pokt.ai
set -e

echo "🚀 Starting pokt.ai services with stability improvements..."

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f infra/docker-compose.yml down

# Clean up any orphaned containers
echo "🧹 Cleaning up orphaned containers..."
docker-compose -f infra/docker-compose.yml down --remove-orphans

# Remove any dangling images
echo "🧹 Cleaning up dangling images..."
docker image prune -f

# Start services in order
echo "📦 Starting infrastructure services..."
docker-compose -f infra/docker-compose.yml up -d postgres redis

# Wait for infrastructure to be healthy
echo "⏳ Waiting for infrastructure services to be healthy..."
sleep 10

# Check if services are healthy
echo "🔍 Checking service health..."
docker-compose -f infra/docker-compose.yml ps

# Start API service
echo "🔧 Starting API service..."
docker-compose -f infra/docker-compose.yml up -d api

# Wait for API to be healthy
echo "⏳ Waiting for API service to be healthy..."
sleep 15

# Start Web service
echo "🌐 Starting Web service..."
docker-compose -f infra/docker-compose.yml up -d web

# Final status check
echo "✅ Final status check..."
docker-compose -f infra/docker-compose.yml ps

echo "🎉 All services started! Access the application at:"
echo "   Web: http://localhost:3005"
echo "   API: http://localhost:3001"
echo "   API Docs: http://localhost:3001/docs"

# Show logs for monitoring
echo "📋 Showing recent logs..."
docker-compose -f infra/docker-compose.yml logs --tail=20


