#!/bin/bash

# pokt.ai Traefik Deployment Script
set -e

echo "🚀 Deploying pokt.ai with Traefik..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found. Please copy env.prod.example to .env and configure it."
    exit 1
fi

# Load environment variables
source .env

# Check if networks exist
echo "📋 Checking Docker networks..."
if ! docker network ls | grep -q "lb"; then
    echo "❌ Error: 'lb' network not found. Please create it first:"
    echo "   docker network create lb"
    exit 1
fi

if ! docker network ls | grep -q "poktia"; then
    echo "❌ Error: 'poktia' network not found. Please create it first:"
    echo "   docker network create poktia"
    exit 1
fi

# Build Docker images
echo "🔨 Building Docker images..."
docker build -t poktai-api:latest ../apps/api
docker build -t poktai-web:latest ../apps/web

# Stop and remove existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down --remove-orphans

# Start services
echo "🚀 Starting pokt.ai services..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service status
echo "📊 Service status:"
docker-compose -f docker-compose.prod.yml ps

echo "✅ pokt.ai deployed successfully!"
echo "🌐 Access your application at: https://${DOMAIN:-pokt.ai}"
echo "📚 API documentation at: https://${DOMAIN:-pokt.ai}/api/docs"
