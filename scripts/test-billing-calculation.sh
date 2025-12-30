#!/bin/bash

echo "╔═══════════════════════════════════════════════════════════════════════╗"
echo "║              💰 BILLING CALCULATION TEST                              ║"
echo "╚═══════════════════════════════════════════════════════════════════════╝"
echo ""

docker exec -i poktai-postgres psql -U pokt_ai -d pokt_ai << 'SQL'
-- Calculate billing for each organization
WITH monthly_usage AS (
  SELECT 
    o.id as org_id,
    o.name as org_name,
    COUNT(DISTINCT e.id) as endpoints,
    COALESCE(SUM(ud.relays), 0) as total_relays,
    ROUND(COALESCE(SUM(ud.relays), 0) * 0.0001, 2) as monthly_cost_usd,
    o.payment_status,
    o.balance_due,
    TO_CHAR(o.last_payment_date, 'YYYY-MM-DD HH24:MI') as last_payment
  FROM organizations o
  LEFT JOIN endpoints e ON o.id = e.org_id AND e.is_active = true
  LEFT JOIN usage_daily ud ON e.id = ud.endpoint_id 
    AND DATE_TRUNC('month', ud.date) = DATE_TRUNC('month', CURRENT_DATE)
  GROUP BY o.id, o.name, o.payment_status, o.balance_due, o.last_payment_date
)
SELECT 
  org_name as "Organization",
  endpoints as "Endpoints",
  total_relays as "Relays This Month",
  '$' || monthly_cost_usd as "Current Bill",
  payment_status as "Status",
  '$' || balance_due as "Balance Due",
  COALESCE(last_payment, 'Never') as "Last Payment"
FROM monthly_usage
ORDER BY total_relays DESC;
SQL

echo ""
echo "═══════════════════════════════════════════════════════════════════════"
echo "💡 Billing Rate: $0.000001 per relay ($1 per 1,000,000)"
echo "📅 Billing Period: Monthly (1st of each month)"
echo "⏰ Grace Period: 60 days for overdue payments"
echo "═══════════════════════════════════════════════════════════════════════"

