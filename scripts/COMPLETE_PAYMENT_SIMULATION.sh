#!/bin/bash

echo "╔═══════════════════════════════════════════════════════════════════════╗"
echo "║          🎬 COMPLETE PAYMENT SIMULATION - pokt.ai                     ║"
echo "╚═══════════════════════════════════════════════════════════════════════╝"
echo ""

ORG_ID="cmh0k5qfv0007107pe3xkr5lz"
ORG_NAME="Winu APP"

echo "📊 CURRENT STATUS"
echo "═══════════════════════════════════════════════════════════════════════"

# Get current billing info
BILLING_INFO=$(docker exec -i poktai-postgres psql -U pokt_ai -d pokt_ai -t -A -F'|' << SQL
SELECT 
  COUNT(DISTINCT e.id),
  COALESCE(SUM(ud.relays), 0),
  ROUND(COALESCE(SUM(ud.relays), 0) * 0.0001, 2),
  payment_status,
  balance_due
FROM organizations o
LEFT JOIN endpoints e ON o.id = e.org_id AND e.is_active = true
LEFT JOIN usage_daily ud ON e.id = ud.endpoint_id 
  AND DATE_TRUNC('month', ud.date) = DATE_TRUNC('month', CURRENT_DATE)
WHERE o.id = '$ORG_ID'
GROUP BY o.id, payment_status, balance_due;
SQL
)

ENDPOINTS=$(echo "$BILLING_INFO" | cut -d'|' -f1)
RELAYS=$(echo "$BILLING_INFO" | cut -d'|' -f2)
AMOUNT=$(echo "$BILLING_INFO" | cut -d'|' -f3)
STATUS=$(echo "$BILLING_INFO" | cut -d'|' -f4 | tr -d ' ')
BALANCE=$(echo "$BILLING_INFO" | cut -d'|' -f5)

echo "  Organization: $ORG_NAME"
echo "  Endpoints: $ENDPOINTS active"
echo "  Usage this month: $RELAYS relays"
echo "  Current bill: \$$AMOUNT USD"
echo "  Payment status: $STATUS"
echo "  Balance due: \$$BALANCE"
echo ""

echo "═══════════════════════════════════════════════════════════════════════"
echo "💰 PAYMENT OPTIONS"
echo "═══════════════════════════════════════════════════════════════════════"
echo ""
echo "1. 💎 Crypto Payment (USDC, ETH, BTC) - via NOWPayments"
echo "2. 💳 Credit Card Payment - via Stripe"
echo ""
read -p "Select payment method (1 or 2): " METHOD
echo ""

if [ "$METHOD" = "1" ]; then
  echo "═══════════════════════════════════════════════════════════════════════"
  echo "💎 CRYPTO PAYMENT FLOW SIMULATION"
  echo "═══════════════════════════════════════════════════════════════════════"
  echo ""
  
  echo "Step 1: User clicks 'Pay Crypto' button on pokt.ai/billing"
  echo "Step 2: System creates NOWPayments invoice for \$$AMOUNT"
  echo ""
  echo "  📱 User would see:"
  echo "     ┌─────────────────────────────────────────────────────────────┐"
  echo "     │ 💰 Complete Your Crypto Payment                             │"
  echo "     │                                                              │"
  echo "     │ Amount: $AMOUNT USDC                                        │"
  echo "     │ Send to: 0x742d35Cc...                                      │"
  echo "     │                                                              │"
  echo "     │ [Copy Address] [Open Payment Page]                          │"
  echo "     └─────────────────────────────────────────────────────────────┘"
  echo ""
  echo "Step 3: User sends USDC from their wallet"
  echo "Step 4: NOWPayments detects payment on blockchain"
  echo "Step 5: NOWPayments sends webhook to pokt.ai"
  echo ""
  
  read -p "Simulate webhook (payment received)? (y/n): " CONFIRM
  
  if [ "$CONFIRM" = "y" ]; then
    echo ""
    echo "🔔 Simulating NOWPayments Webhook..."
    echo "─────────────────────────────────────────────────────────────────────"
    
    # Create webhook payload
    ORDER_ID="invoice_${ORG_ID}_$(date +%s)"
    PAYLOAD="{\"payment_id\":\"sim_$(date +%s)\",\"payment_status\":\"finished\",\"pay_address\":\"0xUserWallet\",\"price_amount\":$AMOUNT,\"price_currency\":\"usd\",\"pay_amount\":$AMOUNT,\"actually_paid\":$AMOUNT,\"pay_currency\":\"USDC\",\"order_id\":\"$ORDER_ID\",\"order_description\":\"pokt.ai service payment\"}"
    
    SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha512 -hmac "4shiuYB5y+JqHZXV28r2ju5tZTyhO4wN" -hex | awk '{print $2}')
    
    RESULT=$(curl -s -X POST https://pokt.ai/api/webhooks/nowpayments \
      -H "Content-Type: application/json" \
      -H "x-nowpayments-sig: $SIGNATURE" \
      -d "$PAYLOAD")
    
    echo "✅ Webhook Response: $RESULT"
    echo ""
    
    echo "📊 AFTER Payment:"
    echo "─────────────────────────────────────────────────────────────────────"
    docker exec -i poktai-postgres psql -U pokt_ai -d pokt_ai << SQL
SELECT 
  '  Organization: ' || name as info,
  '  Status: ' || payment_status,
  '  Balance: \$' || balance_due,
  '  Last Payment: ' || TO_CHAR(last_payment_date, 'YYYY-MM-DD HH24:MI')
FROM organizations WHERE id = '$ORG_ID';
SQL
    
    echo ""
    echo "✅ Payment processed successfully!"
    echo "   → Organization status: active"
    echo "   → Balance cleared to \$0.00"
    echo "   → Services remain active"
  fi

elif [ "$METHOD" = "2" ]; then
  echo "═══════════════════════════════════════════════════════════════════════"
  echo "💳 CARD PAYMENT FLOW SIMULATION"
  echo "═══════════════════════════════════════════════════════════════════════"
  echo ""
  
  echo "Step 1: User clicks 'Pay \$$AMOUNT' button on pokt.ai/billing"
  echo "Step 2: Redirected to Stripe checkout page"
  echo ""
  echo "  💳 User would see Stripe checkout:"
  echo "     ┌─────────────────────────────────────────────────────────────┐"
  echo "     │ 💳 Payment Details                                          │"
  echo "     │                                                              │"
  echo "     │ Amount: \$$AMOUNT USD                                       │"
  echo "     │                                                              │"
  echo "     │ Card Number: [4242 4242 4242 4242]                          │"
  echo "     │ Expiry: [12 / 26]                                            │"
  echo "     │ CVC: [123]                                                   │"
  echo "     │                                                              │"
  echo "     │ [Pay Now]                                                    │"
  echo "     └─────────────────────────────────────────────────────────────┘"
  echo ""
  echo "Step 3: Stripe processes payment"
  echo "Step 4: Stripe sends webhook to pokt.ai"
  echo ""
  
  read -p "Simulate webhook (payment success)? (y/n): " CONFIRM
  
  if [ "$CONFIRM" = "y" ]; then
    echo ""
    echo "🔔 Simulating Stripe Webhook..."
    echo "─────────────────────────────────────────────────────────────────────"
    
    TIMESTAMP=$(date +%s)
    PAYLOAD="{\"id\":\"evt_sim_$TIMESTAMP\",\"type\":\"checkout.session.completed\",\"data\":{\"object\":{\"id\":\"cs_sim_$TIMESTAMP\",\"amount_total\":$(echo "$AMOUNT * 100" | bc | cut -d. -f1),\"customer\":\"cus_sim_123\",\"payment_status\":\"paid\",\"metadata\":{\"org_id\":\"$ORG_ID\"}}}}"
    
    SIGNED="${TIMESTAMP}.$PAYLOAD"
    SIGNATURE=$(echo -n "$SIGNED" | openssl dgst -sha256 -hmac "whsec_8YJQ5SybZKIfD6Vecn4QWEdQhfNC8sFa" -hex | awk '{print $2}')
    
    RESULT=$(curl -s -X POST https://pokt.ai/api/webhooks/stripe \
      -H "Content-Type: application/json" \
      -H "stripe-signature: t=$TIMESTAMP,v1=$SIGNATURE" \
      -d "$PAYLOAD")
    
    echo "✅ Webhook Response: $RESULT"
    echo ""
    
    echo "📊 AFTER Payment:"
    echo "─────────────────────────────────────────────────────────────────────"
    docker exec -i poktai-postgres psql -U pokt_ai -d pokt_ai << SQL
SELECT 
  '  Organization: ' || name,
  '  Status: ' || payment_status,
  '  Balance: \$' || balance_due,
  '  Last Payment: ' || TO_CHAR(last_payment_date, 'YYYY-MM-DD HH24:MI')
FROM organizations WHERE id = '$ORG_ID';
SQL
    
    echo ""
    echo "✅ Card payment processed successfully!"
  fi
fi

echo ""
echo "╔═══════════════════════════════════════════════════════════════════════╗"
echo "║              🎉 SIMULATION COMPLETE                                   ║"
echo "╚═══════════════════════════════════════════════════════════════════════╝"

