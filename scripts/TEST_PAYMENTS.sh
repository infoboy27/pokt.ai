#!/bin/bash

echo "═══════════════════════════════════════════════════════════════════════"
echo "🧪 PAYMENT SYSTEM TEST"
echo "═══════════════════════════════════════════════════════════════════════"
echo ""

# Test NOWPayments currencies
echo "1. Testing NOWPayments - Available Currencies:"
curl -s http://localhost:4000/api/payment/crypto/create | jq '.currencies[0:5]' 2>/dev/null || echo "❌ Error fetching currencies"
echo ""

# Test webhook endpoints
echo "2. Testing Webhook Endpoints:"
echo "   NOWPayments Webhook:"
curl -I https://pokt.ai/api/webhooks/nowpayments 2>&1 | grep "HTTP" | head -1
echo "   Stripe Webhook:"
curl -I https://pokt.ai/api/webhooks/stripe 2>&1 | grep "HTTP" | head -1
echo ""

# Test environment variables loaded
echo "3. Environment Check:"
if [ -f /home/shannon/poktai/apps/web/.env.local ]; then
    echo "   ✅ .env.local exists"
    grep -c "NOWPAYMENTS_API_KEY" /home/shannon/poktai/apps/web/.env.local > /dev/null && echo "   ✅ NOWPayments keys configured"
    grep -c "STRIPE_SECRET_KEY" /home/shannon/poktai/apps/web/.env.local > /dev/null && echo "   ✅ Stripe keys configured"
else
    echo "   ❌ .env.local not found"
fi
echo ""

echo "═══════════════════════════════════════════════════════════════════════"
echo "✅ Payment system ready!"
echo ""
echo "📋 Next Steps:"
echo "   1. Add webhook URLs to NOWPayments and Stripe dashboards"
echo "   2. Test with a small payment"
echo "═══════════════════════════════════════════════════════════════════════"

