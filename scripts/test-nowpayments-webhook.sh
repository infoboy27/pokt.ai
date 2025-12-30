#!/bin/bash

echo "╔═══════════════════════════════════════════════════════════════════════╗"
echo "║           🧪 TESTING NOWPAYMENTS WEBHOOK                              ║"
echo "╚═══════════════════════════════════════════════════════════════════════╝"
echo ""

ORG_ID="cmh0k5qfv0007107pe3xkr5lz"  # Your Winu APP org
ORDER_ID="invoice_${ORG_ID}_$(date +%s)"

# Create test IPN payload
PAYLOAD=$(cat <<EOF
{
  "payment_id": "test_payment_$(date +%s)",
  "payment_status": "finished",
  "pay_address": "0xTestAddress123",
  "price_amount": 10.00,
  "price_currency": "usd",
  "pay_amount": 10.0,
  "actually_paid": 10.0,
  "pay_currency": "USDC",
  "order_id": "$ORDER_ID",
  "order_description": "Test payment for pokt.ai services",
  "purchase_id": "test_purchase_123",
  "created_at": "$(date -u +%Y-%m-%dT%H:%M:%S.000Z)",
  "updated_at": "$(date -u +%Y-%m-%dT%H:%M:%S.000Z)"
}
EOF
)

echo "📝 Test Payload:"
echo "$PAYLOAD" | jq .
echo ""

# Generate HMAC signature
IPN_SECRET="4shiuYB5y+JqHZXV28r2ju5tZTyhO4wN"
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha512 -hmac "$IPN_SECRET" -hex | awk '{print $2}')

echo "🔐 Generated Signature:"
echo "   $SIGNATURE"
echo ""

echo "📤 Sending webhook to: https://pokt.ai/api/webhooks/nowpayments"
echo ""

# Send the webhook
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST https://pokt.ai/api/webhooks/nowpayments \
  -H "Content-Type: application/json" \
  -H "x-nowpayments-sig: $SIGNATURE" \
  -d "$PAYLOAD")

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed -e 's/HTTP_STATUS:.*//')

echo "📥 Response:"
echo "   Status: $HTTP_STATUS"
echo "   Body: $BODY"
echo ""

if [ "$HTTP_STATUS" = "200" ]; then
  echo "✅ SUCCESS! Webhook processed successfully"
  echo ""
  echo "🔍 Check database to verify organization was updated:"
  docker exec -i poktai-postgres psql -U pokt_ai -d pokt_ai -c "SELECT id, name, payment_status, last_payment_date, balance_due FROM organizations WHERE id = '$ORG_ID';"
  echo ""
  echo "🔍 Check if payment was recorded:"
  docker exec -i poktai-postgres psql -U pokt_ai -d pokt_ai -c "SELECT id, amount, currency, status, payment_type, payment_method FROM payments ORDER BY created_at DESC LIMIT 3;"
elif [ "$HTTP_STATUS" = "401" ]; then
  echo "❌ SIGNATURE VERIFICATION FAILED"
  echo "   Check if IPN secret is correct"
else
  echo "⚠️  UNEXPECTED RESPONSE"
  echo "   Check /tmp/web.log for details: tail -f /tmp/web.log | grep NOWPAY"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════════════"








