#!/bin/bash

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║         🔍 STRIPE PAYMENT INTEGRATION VERIFICATION            ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get database connection details from docker-compose
POSTGRES_USER=${POSTGRES_USER:-pokt_ai}
POSTGRES_DB=${POSTGRES_DB:-pokt_ai}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}

if [ -z "$POSTGRES_PASSWORD" ]; then
    echo -e "${YELLOW}⚠️  POSTGRES_PASSWORD not set, trying to get from docker-compose...${NC}"
    POSTGRES_PASSWORD=$(docker compose -f docker-compose.production.yml exec -T postgres printenv POSTGRES_PASSWORD 2>/dev/null || echo "")
fi

echo "📊 Checking Database Records..."
echo "─────────────────────────────────────────────────────────────────"

# Check if we can connect to database
if [ -z "$POSTGRES_PASSWORD" ]; then
    echo -e "${RED}❌ Cannot connect to database - POSTGRES_PASSWORD not configured${NC}"
    echo ""
    echo "Please set POSTGRES_PASSWORD environment variable or check docker-compose.yml"
    exit 1
fi

# Function to run SQL query
run_query() {
    # Try without password first (if pg_hba.conf allows local connections)
    docker compose -f docker-compose.production.yml exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "$1" 2>/dev/null || \
    docker compose -f docker-compose.production.yml exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -W"$POSTGRES_PASSWORD" -c "$1" 2>/dev/null || \
    PGPASSWORD="$POSTGRES_PASSWORD" docker compose -f docker-compose.production.yml exec -T -e PGPASSWORD="$POSTGRES_PASSWORD" postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "$1" 2>/dev/null
}

echo ""
echo "1️⃣  Recent Payments (last 10):"
echo "─────────────────────────────────────────────────────────────────"
run_query "SELECT 
    id, 
    org_id, 
    amount/100.0 as amount_usd, 
    currency, 
    status, 
    payment_type, 
    external_payment_id,
    created_at 
FROM payments 
WHERE payment_type = 'stripe' 
ORDER BY created_at DESC 
LIMIT 10;" || echo -e "${RED}❌ Could not query payments table${NC}"

echo ""
echo "2️⃣  Organization Payment Status:"
echo "─────────────────────────────────────────────────────────────────"
run_query "SELECT 
    id, 
    name, 
    payment_status, 
    balance_due/100.0 as balance_usd, 
    last_payment_date,
    stripe_customer_id,
    suspended_at
FROM organizations 
ORDER BY last_payment_date DESC NULLS LAST 
LIMIT 10;" || echo -e "${RED}❌ Could not query organizations table${NC}"

echo ""
echo "3️⃣  Recent Invoices:"
echo "─────────────────────────────────────────────────────────────────"
run_query "SELECT 
    id, 
    org_id, 
    stripe_invoice_id, 
    amount/100.0 as amount_usd, 
    status, 
    created_at 
FROM invoices 
ORDER BY created_at DESC 
LIMIT 10;" || echo -e "${YELLOW}⚠️  Invoices table might not exist or is empty${NC}"

echo ""
echo "4️⃣  Webhook Logs (last 50 lines):"
echo "─────────────────────────────────────────────────────────────────"
docker compose -f docker-compose.production.yml logs web --tail=200 2>&1 | grep -i "STRIPE\|WEBHOOK" | tail -20 || echo -e "${YELLOW}⚠️  No webhook logs found${NC}"

echo ""
echo "5️⃣  Environment Variables Check:"
echo "─────────────────────────────────────────────────────────────────"
if docker compose -f docker-compose.production.yml exec -T web printenv STRIPE_SECRET_KEY > /dev/null 2>&1; then
    echo -e "${GREEN}✅ STRIPE_SECRET_KEY is set${NC}"
else
    echo -e "${RED}❌ STRIPE_SECRET_KEY is NOT set${NC}"
fi

if docker compose -f docker-compose.production.yml exec -T web printenv STRIPE_WEBHOOK_SECRET > /dev/null 2>&1; then
    WEBHOOK_SECRET=$(docker compose -f docker-compose.production.yml exec -T web printenv STRIPE_WEBHOOK_SECRET 2>/dev/null)
    if [ -n "$WEBHOOK_SECRET" ]; then
        echo -e "${GREEN}✅ STRIPE_WEBHOOK_SECRET is set${NC}"
    else
        echo -e "${RED}❌ STRIPE_WEBHOOK_SECRET is empty${NC}"
    fi
else
    echo -e "${RED}❌ STRIPE_WEBHOOK_SECRET is NOT set${NC}"
fi

echo ""
echo "6️⃣  Web Service Health:"
echo "─────────────────────────────────────────────────────────────────"
if docker compose -f docker-compose.production.yml ps web | grep -q "Up"; then
    echo -e "${GREEN}✅ Web service is running${NC}"
else
    echo -e "${RED}❌ Web service is NOT running${NC}"
fi

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    ✅ VERIFICATION COMPLETE                  ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "📝 Next Steps:"
echo "   1. Check if payments appear in the database"
echo "   2. Verify organization payment_status is 'active'"
echo "   3. Check Stripe Dashboard: https://dashboard.stripe.com/test/payments"
echo "   4. Check Stripe Webhooks: https://dashboard.stripe.com/test/webhooks"
echo "   5. Look for webhook delivery logs in Stripe dashboard"
echo ""

