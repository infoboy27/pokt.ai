#!/bin/bash

echo "Starting pokt.ai services with nohup..."

# Stop any existing services
echo "Stopping existing services..."
docker-compose -f infra/docker-compose.yml down

# Start services in background with nohup
echo "Starting services in background..."
nohup docker-compose -f infra/docker-compose.yml up -d > docker-compose.log 2>&1 &

# Get the process ID
PID=$!
echo "Services started with PID: $PID"
echo "Log file: docker-compose.log"

# Wait a bit for services to start
echo "Waiting for services to start..."
sleep 15

# Check status
echo "Checking service status..."
docker-compose -f infra/docker-compose.yml ps

echo ""
echo "Services are now running in the background!"
echo "You can close this terminal and they will continue running."
echo ""
echo "To check status: docker-compose -f infra/docker-compose.yml ps"
echo "To view logs: tail -f docker-compose.log"
echo "To stop services: docker-compose -f infra/docker-compose.yml down"
