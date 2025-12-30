#!/bin/bash

# pokt.ai Traefik Setup Script
set -e

echo "🔧 Setting up pokt.ai for Traefik deployment..."

# Create production environment file
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.prod.example .env
    echo "⚠️  Please edit .env file with your production values before deploying"
else
    echo "✅ .env file already exists"
fi

# Check if Docker networks exist
echo "📋 Checking Docker networks..."

if ! docker network ls | grep -q "lb"; then
    echo "🔧 Creating 'lb' network..."
    docker network create lb
else
    echo "✅ 'lb' network already exists"
fi

if ! docker network ls | grep -q "poktia"; then
    echo "🔧 Creating 'poktia' network..."
    docker network create poktia
else
    echo "✅ 'poktia' network already exists"
fi

# Create Traefik service configuration
echo "📋 Creating Traefik service configuration..."
if [ ! -d ../services ]; then
    echo "📁 Creating services directory..."
    mkdir -p ../services
fi

# Copy Traefik service configuration
cp traefik-services/poktai.yml ../services/

echo "✅ Setup completed successfully!"
echo ""
echo "📝 Next steps:"
echo "1. Edit .env file with your production values"
echo "2. Run ./deploy.sh to deploy the application"
echo "3. Ensure your Traefik configuration includes the services directory"
echo ""
echo "🌐 Your pokt.ai will be available at: https://pokt.ai"
echo "📚 API will be available at: https://pokt.ai/api"
