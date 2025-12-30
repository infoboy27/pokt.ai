#!/bin/bash

echo "╔═══════════════════════════════════════════════════════════════════════╗"
echo "║              🧪 TESTING STRIPE WEBHOOK                                ║"
echo "╚═══════════════════════════════════════════════════════════════════════╝"
echo ""

# Create a test Stripe webhook event
TIMESTAMP=$(date +%s)
ORG_ID="cmh0k5qfv0007107pe3xkr5lz"  # Your Winu APP org

# Create test event payload
PAYLOAD=$(cat <<EOF
{
  "id": "evt_test_webhook_$(date +%s)",
  "object": "event",
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "cs_test_$(date +%s)",
      "object": "checkout.session",
      "amount_total": 5000,
      "currency": "usd",
      "customer": "cus_test_123",
      "payment_status": "paid",
      "metadata": {
        "org_id": "$ORG_ID"
      }
    }
  }
}
EOF
)

echo "📝 Test Payload:"
echo "$PAYLOAD" | jq .
echo ""

# Generate signature using the webhook secret
SECRET="whsec_8YJQ5SybZKIfD6Vecn4QWEdQhfNC8sFa"
SIGNED_PAYLOAD="${TIMESTAMP}.${PAYLOAD}"
SIGNATURE=$(echo -n "$SIGNED_PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" -hex | awk '{print $2}')
STRIPE_SIGNATURE="t=$TIMESTAMP,v1=$SIGNATURE"

echo "🔐 Generated Signature:"
echo "   $STRIPE_SIGNATURE"
echo ""

echo "📤 Sending webhook to: https://pokt.ai/api/webhooks/stripe"
echo ""

# Send the webhook
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST https://pokt.ai/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -H "stripe-signature: $STRIPE_SIGNATURE" \
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
  docker exec -i poktai-postgres psql -U pokt_ai -d pokt_ai -c "SELECT id, name, payment_status, last_payment_date FROM organizations WHERE id = '$ORG_ID';"
elif [ "$HTTP_STATUS" = "401" ]; then
  echo "❌ SIGNATURE VERIFICATION FAILED"
  echo "   Check if webhook secret is correct"
else
  echo "⚠️  UNEXPECTED RESPONSE"
  echo "   Check /tmp/web.log for details: tail -f /tmp/web.log | grep STRIPE"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════════════"








