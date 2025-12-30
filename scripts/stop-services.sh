#!/bin/bash

echo "Stopping pokt.ai services..."

# Stop all services
docker-compose -f infra/docker-compose.yml down

echo "Services stopped successfully!"
echo ""
echo "To start services again: ./start-services.sh"




