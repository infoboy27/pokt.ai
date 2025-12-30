#!/bin/bash
# Apply Migration: Add path_app_address to Networks Table

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║   Apply Migration: Add path_app_address to Networks Table     ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Check if PostgreSQL container is running
POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-poktai-postgres}"
if ! docker ps | grep -q "$POSTGRES_CONTAINER"; then
    echo -e "${RED}❌ PostgreSQL container '$POSTGRES_CONTAINER' is not running${NC}"
    echo "   Please start it first: docker start $POSTGRES_CONTAINER"
    exit 1
fi

echo -e "${GREEN}✅ PostgreSQL container found: $POSTGRES_CONTAINER${NC}"
echo ""

# Detect PostgreSQL user from container environment
POSTGRES_USER=$(docker exec "$POSTGRES_CONTAINER" env | grep POSTGRES_USER | cut -d'=' -f2 || echo "pokt_ai")
POSTGRES_DB=$(docker exec "$POSTGRES_CONTAINER" env | grep POSTGRES_DB | cut -d'=' -f2 || echo "pokt_ai")

echo "📋 Database Configuration:"
echo "   User: $POSTGRES_USER"
echo "   Database: $POSTGRES_DB"
echo ""

# Check if column already exists
echo "🔍 Checking if column already exists..."
COLUMN_EXISTS=$(docker exec "$POSTGRES_CONTAINER" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "
SELECT COUNT(*) FROM information_schema.columns 
WHERE table_name = 'networks' AND column_name = 'path_app_address';
" | tr -d ' ')

if [ "$COLUMN_EXISTS" = "1" ]; then
    echo -e "${YELLOW}⚠️  Column 'path_app_address' already exists in 'networks' table${NC}"
    echo "   Migration may have already been applied."
    read -p "   Do you want to continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "   Migration cancelled."
        exit 0
    fi
fi

echo ""
echo "📋 Migration SQL:"
echo "   ALTER TABLE \"networks\" ADD COLUMN \"path_app_address\" VARCHAR(255);"
echo ""

# Confirm before applying
read -p "🚀 Apply migration? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Migration cancelled."
    exit 0
fi

echo ""
echo "⏳ Applying migration..."

# Apply migration
if docker exec -i "$POSTGRES_CONTAINER" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" << EOF
ALTER TABLE "networks" ADD COLUMN IF NOT EXISTS "path_app_address" VARCHAR(255);
EOF
then
    echo -e "${GREEN}✅ Migration applied successfully!${NC}"
else
    echo -e "${RED}❌ Migration failed!${NC}"
    exit 1
fi

echo ""
echo "🔍 Verifying migration..."

# Verify column was added
VERIFY_RESULT=$(docker exec "$POSTGRES_CONTAINER" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'networks' AND column_name = 'path_app_address';
")

if [ -n "$VERIFY_RESULT" ]; then
    echo -e "${GREEN}✅ Column verified:${NC}"
    echo "$VERIFY_RESULT" | sed 's/^/   /'
else
    echo -e "${RED}❌ Column verification failed!${NC}"
    exit 1
fi

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                    Migration Complete!                        ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo "📝 Next Steps:"
echo "   1. Test endpoint creation with pathAppAddress parameter"
echo "   2. Verify gateway uses correct app address per network"
echo "   3. Check APPLY_MIGRATION.md for testing instructions"
echo ""

