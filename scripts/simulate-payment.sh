#!/bin/bash

echo "╔═══════════════════════════════════════════════════════════════════════╗"
echo "║              💰 PAYMENT SIMULATION - pokt.ai                          ║"
echo "╚═══════════════════════════════════════════════════════════════════════╝"
echo ""

ORG_ID="cmh0k5qfv0007107pe3xkr5lz"  # Winu APP

echo "📊 Step 1: Check Current Billing Status"
echo "═══════════════════════════════════════════════════════════════════════"
docker exec -i poktai-postgres psql -U pokt_ai -d pokt_ai << SQL
SELECT 
  name as "Organization",
  payment_status as "Status",
  balance_due as "Balance Due",
  last_payment_date as "Last Payment"
FROM organizations 
WHERE id = '$ORG_ID';
SQL

# Calculate current usage
USAGE=$(docker exec -i poktai-postgres psql -U pokt_ai -d pokt_ai -t -c "
SELECT COALESCE(SUM(ud.relays), 0)
FROM usage_daily ud
JOIN endpoints e ON ud.endpoint_id = e.id
WHERE e.org_id = '$ORG_ID'
  AND DATE_TRUNC('month', ud.date) = DATE_TRUNC('month', CURRENT_DATE);
" | tr -d ' ')

COST=$(echo "scale=2; $USAGE * 0.0001" | bc)

echo ""
echo "💡 Current Usage:"
echo "   Relays this month: $USAGE"
echo "   Current bill: \$$COST USD"
echo ""
echo "═══════════════════════════════════════════════════════════════════════"
echo ""
read -p "Choose payment method (1=Crypto, 2=Card): " CHOICE
echo ""

if [ "$CHOICE" = "1" ]; then
  echo "💎 Step 2: Create Crypto Payment (NOWPayments)"
  echo "═══════════════════════════════════════════════════════════════════════"
  
  PAYMENT_RESPONSE=$(curl -s -X POST http://localhost:4000/api/payment/crypto/create \
    -H "Content-Type: application/json" \
    -d "{
      \"amount\": $COST,
      \"currency\": \"USD\",
      \"description\": \"pokt.ai monthly service - $COST USD\",
      \"orgId\": \"$ORG_ID\"
    }")
  
  echo "$PAYMENT_RESPONSE" | jq .
  
  if echo "$PAYMENT_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
    PAYMENT_ID=$(echo "$PAYMENT_RESPONSE" | jq -r '.payment.id')
    PAY_ADDRESS=$(echo "$PAYMENT_RESPONSE" | jq -r '.payment.payAddress')
    PAY_AMOUNT=$(echo "$PAYMENT_RESPONSE" | jq -r '.payment.payAmount')
    PAY_CURRENCY=$(echo "$PAYMENT_RESPONSE" | jq -r '.payment.payCurrency')
    
    echo ""
    echo "✅ Payment Created Successfully!"
    echo ""
    echo "💰 Payment Details:"
    echo "   Payment ID: $PAYMENT_ID"
    echo "   Amount: $PAY_AMOUNT $PAY_CURRENCY"
    echo "   Address: $PAY_ADDRESS"
    echo ""
    echo "═══════════════════════════════════════════════════════════════════════"
    echo ""
    read -p "Simulate payment completion? (y/n): " CONFIRM
    
    if [ "$CONFIRM" = "y" ]; then
      echo ""
      echo "💸 Step 3: Simulate Payment Webhook (Payment Received)"
      echo "═══════════════════════════════════════════════════════════════════════"
      
      # Run the NOWPayments webhook test
      bash /home/shannon/poktai/test-nowpayments-webhook.sh
    fi
  else
    echo "❌ Failed to create payment"
    echo "$PAYMENT_RESPONSE"
  fi
  
elif [ "$CHOICE" = "2" ]; then
  echo "💳 Step 2: Simulate Card Payment (Stripe)"
  echo "═══════════════════════════════════════════════════════════════════════"
  echo ""
  echo "In a real scenario, user would:"
  echo "  1. Click 'Pay \$$COST' button"
  echo "  2. Redirected to Stripe checkout"
  echo "  3. Enter card: 4242 4242 4242 4242"
  echo "  4. Stripe processes payment"
  echo "  5. Webhook sent to your system"
  echo ""
  read -p "Simulate Stripe webhook (payment success)? (y/n): " CONFIRM
  
  if [ "$CONFIRM" = "y" ]; then
    echo ""
    echo "💳 Step 3: Simulate Stripe Webhook"
    echo "═══════════════════════════════════════════════════════════════════════"
    
    # Run the Stripe webhook test
    bash /home/shannon/poktai/test-stripe-webhook.sh
  fi
else
  echo "❌ Invalid choice"
  exit 1
fi

echo ""
echo "╔═══════════════════════════════════════════════════════════════════════╗"
echo "║              ✅ PAYMENT SIMULATION COMPLETE                           ║"
echo "╚═══════════════════════════════════════════════════════════════════════╝"

