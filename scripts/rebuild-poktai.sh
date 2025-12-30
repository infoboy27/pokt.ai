#!/bin/bash

# =============================================================================
# REBUILD POKT.AI APPLICATION
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔨 Rebuilding pokt.ai Application${NC}\n"

# =============================================================================
# CONFIGURATION
# =============================================================================

COMPOSE_FILE="docker-compose.production.yml"
ENV_FILE=".env.production"

# Check if environment file exists
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}⚠️  $ENV_FILE not found, checking for .env...${NC}"
    if [ -f ".env" ]; then
        ENV_FILE=".env"
        echo -e "${GREEN}✅ Using .env file${NC}"
    else
        echo -e "${RED}❌ No environment file found. Please create .env.production or .env${NC}"
        exit 1
    fi
fi

# =============================================================================
# STEP 1: STOP EXISTING SERVICES
# =============================================================================

echo -e "${YELLOW}📋 Step 1: Stopping existing services...${NC}"
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down || true
echo -e "${GREEN}✅ Services stopped${NC}\n"

# =============================================================================
# STEP 2: BUILD DOCKER IMAGES
# =============================================================================

echo -e "${YELLOW}🔨 Step 2: Building Docker images...${NC}"

# Build API image (no production target, it's a single-stage Dockerfile)
echo -e "${BLUE}  → Building API image (poktai-api:latest)...${NC}"
docker build -t poktai-api:latest -f apps/api/Dockerfile . || {
    echo -e "${RED}❌ Failed to build API image${NC}"
    exit 1
}

# Build Web image (uses Dockerfile.production with production target)
echo -e "${BLUE}  → Building Web image (poktai-web:latest)...${NC}"
docker build -t poktai-web:latest -f apps/web/Dockerfile.production --target production . || {
    echo -e "${RED}❌ Failed to build Web image${NC}"
    exit 1
}

echo -e "${GREEN}✅ All images built successfully${NC}\n"

# =============================================================================
# STEP 3: START SERVICES
# =============================================================================

echo -e "${YELLOW}🚀 Step 3: Starting services...${NC}"
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d

# Wait for services to start
echo -e "${BLUE}  → Waiting for services to initialize...${NC}"
sleep 15

echo -e "${GREEN}✅ Services started${NC}\n"

# =============================================================================
# STEP 4: RUN DATABASE MIGRATIONS
# =============================================================================

echo -e "${YELLOW}🗄️  Step 4: Running database migrations...${NC}"

# Wait for database to be ready
echo -e "${BLUE}  → Waiting for database to be ready...${NC}"
sleep 10

# Run migrations
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T api npx prisma migrate deploy || {
    echo -e "${YELLOW}⚠️  Migrations may have failed or already applied${NC}"
}

echo -e "${GREEN}✅ Database migrations completed${NC}\n"

# =============================================================================
# STEP 5: VERIFY SERVICES
# =============================================================================

echo -e "${YELLOW}🔍 Step 5: Verifying services...${NC}"

services=("postgres" "redis" "api" "web")
all_healthy=true

for service in "${services[@]}"; do
    if docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps "$service" | grep -q "Up"; then
        echo -e "${GREEN}  ✅ $service is running${NC}"
    else
        echo -e "${RED}  ❌ $service is not running${NC}"
        all_healthy=false
    fi
done

if [ "$all_healthy" = true ]; then
    echo -e "\n${GREEN}🎉 Rebuild completed successfully!${NC}"
    echo -e "${BLUE}📊 Service Status:${NC}"
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps
else
    echo -e "\n${YELLOW}⚠️  Some services may not be healthy. Check logs:${NC}"
    echo -e "   docker compose -f $COMPOSE_FILE --env-file $ENV_FILE logs"
fi
