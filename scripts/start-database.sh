#!/bin/bash

echo "🗄️  Starting PostgreSQL Database..."
echo ""

# Check if PostgreSQL container already exists
if docker ps -a | grep -q "poktai-postgres"; then
    echo "Existing PostgreSQL container found"
    echo "Starting container..."
    docker start poktai-postgres
else
    echo "Creating new PostgreSQL container..."
    docker run -d \
        --name poktai-postgres \
        -e POSTGRES_DB=pokt_ai \
        -e POSTGRES_USER=pokt_ai \
        -e POSTGRES_PASSWORD=pokt_ai_password \
        -p 5432:5432 \
        -v poktai_postgres_data:/var/lib/postgresql/data \
        postgres:15-alpine
fi

echo ""
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 5

# Check if database is responding
if docker exec poktai-postgres pg_isready -U pokt_ai > /dev/null 2>&1; then
    echo "✅ PostgreSQL is running and ready!"
    echo ""
    echo "📊 Database Connection:"
    echo "   Host:     localhost"
    echo "   Port:     5432"
    echo "   Database: pokt_ai"
    echo "   User:     pokt_ai"
    echo "   Password: pokt_ai_password"
    echo ""
    echo "🔗 Connection String:"
    echo "   postgresql://pokt_ai:pokt_ai_password@localhost:5432/pokt_ai"
    echo ""
else
    echo "⚠️  PostgreSQL is starting... (may need a few more seconds)"
    echo ""
    echo "Check status with:"
    echo "   docker logs poktai-postgres"
fi

echo ""
echo "💡 Useful Commands:"
echo "   Stop:   docker stop poktai-postgres"
echo "   Start:  docker start poktai-postgres"
echo "   Logs:   docker logs -f poktai-postgres"
echo "   Shell:  docker exec -it poktai-postgres psql -U pokt_ai -d pokt_ai"
echo ""









