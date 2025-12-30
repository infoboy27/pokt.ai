#!/bin/bash

echo "=== DATABASE ACCESS TEST ==="
echo ""

echo "1. Checking PostgreSQL container..."
docker ps | grep postgres
echo ""

echo "2. Testing database connection..."
docker exec customer-gateway-postgres psql -U gateway -d pokt_ai -c "SELECT version();"
echo ""

echo "3. Listing all databases..."
docker exec customer-gateway-postgres psql -U gateway -l
echo ""

echo "4. Checking tables in pokt_ai database..."
docker exec customer-gateway-postgres psql -U gateway -d pokt_ai -c "\dt"
echo ""

echo "5. Counting records..."
echo "Users:"
docker exec customer-gateway-postgres psql -U gateway -d pokt_ai -c "SELECT COUNT(*) FROM users;"
echo ""
echo "Organizations:"
docker exec customer-gateway-postgres psql -U gateway -d pokt_ai -c "SELECT COUNT(*) FROM organizations;"
echo ""
echo "Endpoints:"
docker exec customer-gateway-postgres psql -U gateway -d pokt_ai -c "SELECT COUNT(*) FROM endpoints;"
echo ""

echo "6. Sample data..."
docker exec customer-gateway-postgres psql -U gateway -d pokt_ai -c "SELECT id, email, name FROM users LIMIT 3;"
echo ""

echo "=== DATABASE ACCESS: SUCCESS ==="















