#!/bin/bash

# =============================================================================
# PRODUCTION DEPLOYMENT SCRIPT FOR POKT.AI
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="pokt-ai"
COMPOSE_FILE="docker-compose.production.yml"
ENV_FILE=".env.production"

echo -e "${BLUE}🚀 Starting Production Deployment for pokt.ai${NC}"

# =============================================================================
# PRE-DEPLOYMENT CHECKS
# =============================================================================

echo -e "${YELLOW}📋 Running pre-deployment checks...${NC}"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker and try again.${NC}"
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose.${NC}"
    exit 1
fi

# Check if environment file exists
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}❌ Environment file $ENV_FILE not found.${NC}"
    echo -e "${YELLOW}📝 Please copy env.production.example to $ENV_FILE and configure it.${NC}"
    exit 1
fi

# Validate environment variables
echo -e "${YELLOW}🔍 Validating environment variables...${NC}"
source "$ENV_FILE"

required_vars=(
    "DOMAIN"
    "POSTGRES_PASSWORD"
    "REDIS_PASSWORD"
    "JWT_SECRET"
    "AUTH0_DOMAIN"
    "STRIPE_SECRET_KEY"
    "SENDGRID_API_KEY"
)

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ] || [ "${!var}" = "CHANGE_THIS_*" ]; then
        echo -e "${RED}❌ Environment variable $var is not properly configured.${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✅ Pre-deployment checks passed${NC}"

# =============================================================================
# SECURITY SETUP
# =============================================================================

echo -e "${YELLOW}🔒 Setting up security configurations...${NC}"

# Create necessary directories with proper permissions
mkdir -p backups
mkdir -p monitoring
mkdir -p ssl

# Set proper permissions
chmod 600 "$ENV_FILE"
chmod 700 backups
chmod 755 monitoring

# =============================================================================
# DATABASE BACKUP (if exists)
# =============================================================================

if docker ps | grep -q "postgres"; then
    echo -e "${YELLOW}💾 Creating database backup...${NC}"
    timestamp=$(date +%Y%m%d_%H%M%S)
    docker exec postgres pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > "backups/backup_$timestamp.sql"
    echo -e "${GREEN}✅ Database backup created: backups/backup_$timestamp.sql${NC}"
fi

# =============================================================================
# BUILD IMAGES
# =============================================================================

echo -e "${YELLOW}🔨 Building production images...${NC}"

# Build API image
echo -e "${BLUE}Building API image...${NC}"
docker build -t poktai-api:latest -f apps/api/Dockerfile --target production .

# Build Web image
echo -e "${BLUE}Building Web image...${NC}"
docker build -t poktai-web:latest -f apps/web/Dockerfile --target production .

# Build Explorer images (if needed)
if [ -d "blockchainexplorer" ]; then
    echo -e "${BLUE}Building Explorer Backend image...${NC}"
    docker build -t poktai-explorer-backend:latest -f blockchainexplorer/backend/Dockerfile blockchainexplorer/backend/
    
    echo -e "${BLUE}Building Explorer Frontend image...${NC}"
    docker build -t poktai-explorer-frontend:latest -f blockchainexplorer/frontend/Dockerfile blockchainexplorer/frontend/
fi

echo -e "${GREEN}✅ All images built successfully${NC}"

# =============================================================================
# DEPLOY SERVICES
# =============================================================================

echo -e "${YELLOW}🚀 Deploying services...${NC}"

# Stop existing services
echo -e "${BLUE}Stopping existing services...${NC}"
docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down

# Start services
echo -e "${BLUE}Starting services...${NC}"
docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d

# Wait for services to be healthy
echo -e "${BLUE}Waiting for services to be healthy...${NC}"
sleep 30

# Check service health
echo -e "${YELLOW}🏥 Checking service health...${NC}"

services=("postgres" "redis" "api" "web" "traefik")
for service in "${services[@]}"; do
    if docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps "$service" | grep -q "Up"; then
        echo -e "${GREEN}✅ $service is running${NC}"
    else
        echo -e "${RED}❌ $service is not running${NC}"
        echo -e "${YELLOW}📋 Checking logs for $service...${NC}"
        docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" logs "$service" --tail=20
    fi
done

# =============================================================================
# DATABASE MIGRATION
# =============================================================================

echo -e "${YELLOW}🗄️ Running database migrations...${NC}"

# Wait for database to be ready
echo -e "${BLUE}Waiting for database to be ready...${NC}"
sleep 10

# Run migrations
docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec api npx prisma migrate deploy

# Seed database (if needed)
echo -e "${BLUE}Seeding database...${NC}"
docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec api npx prisma db seed

echo -e "${GREEN}✅ Database setup completed${NC}"

# =============================================================================
# SSL CERTIFICATE VERIFICATION
# =============================================================================

echo -e "${YELLOW}🔐 Verifying SSL certificates...${NC}"

# Wait for SSL certificates to be generated
echo -e "${BLUE}Waiting for SSL certificates...${NC}"
sleep 60

# Test SSL certificate
if curl -s -I "https://$DOMAIN" | grep -q "200 OK"; then
    echo -e "${GREEN}✅ SSL certificate is working${NC}"
else
    echo -e "${YELLOW}⚠️ SSL certificate may still be generating. Check Traefik logs.${NC}"
fi

# =============================================================================
# FINAL VERIFICATION
# =============================================================================

echo -e "${YELLOW}🔍 Final verification...${NC}"

# Test API health
if curl -s "https://$DOMAIN/api/health" | grep -q "ok"; then
    echo -e "${GREEN}✅ API is responding${NC}"
else
    echo -e "${RED}❌ API is not responding${NC}"
fi

# Test Web application
if curl -s -I "https://$DOMAIN" | grep -q "200 OK"; then
    echo -e "${GREEN}✅ Web application is responding${NC}"
else
    echo -e "${RED}❌ Web application is not responding${NC}"
fi

# =============================================================================
# DEPLOYMENT SUMMARY
# =============================================================================

echo -e "${GREEN}🎉 Production deployment completed!${NC}"
echo -e "${BLUE}📊 Deployment Summary:${NC}"
echo -e "  • Domain: https://$DOMAIN"
echo -e "  • API: https://$DOMAIN/api"
echo -e "  • Monitoring: https://monitoring.$DOMAIN"
echo -e "  • Grafana: https://grafana.$DOMAIN"
echo -e "  • Explorer: https://explorer.$DOMAIN"

echo -e "${YELLOW}📋 Next Steps:${NC}"
echo -e "  1. Configure your DNS to point to this server"
echo -e "  2. Set up monitoring alerts"
echo -e "  3. Configure backup schedules"
echo -e "  4. Test all functionality"
echo -e "  5. Set up log aggregation"

echo -e "${GREEN}✅ Deployment script completed successfully!${NC}"








