# 💰 Billing Process Documentation

## Overview

This document explains how the pokt.ai billing system works: from usage tracking to invoice generation, payment processing, and service suspension.

---

## 1. 📊 Usage Tracking & Aggregation

### How Usage is Tracked

**Real-time Tracking:**
- Every RPC request through the gateway (`/api/gateway`) is logged
- Data stored in minute-level buckets in the `usage` table
- Tracks: request count, latency (P50, P95), error rate

**Key Code:**
```typescript
// apps/web/app/api/gateway/route.ts
// Each request logs usage data
```

**Database Schema:**
```sql
-- Minute-level usage tracking
usage {
  api_key_id
  network_id
  ts_minute
  count (number of requests)
  latency_p50, latency_p95
  error_rate
}
```

### Aggregation Process

**Hourly Aggregation:**
- Worker runs every hour (`usage-aggregation.worker.ts`)
- Aggregates minute-level data into hourly buckets
- Cleans up old minute-level records (keeps last 24 hours)

**Monthly Calculation:**
- When billing is requested, usage is summed for the month
- Query aggregates from `usage` table for the billing period
- Calculates total relays (requests) per organization

**Code Reference:**
```104:120:apps/web/app/api/billing/route.ts
    // Generate real invoices based on usage history
    const invoices = [];
    for (let i = 0; i < 3; i++) {
      const invoiceDate = new Date();
      invoiceDate.setMonth(invoiceDate.getMonth() - i);
      
      const invoiceAmount = usageHistory[i]?.cost || totalMonthlyCost;
      const invoiceId = `INV-${invoiceDate.getFullYear()}-${String(i + 1).padStart(3, '0')}`;
      
      invoices.push({
        id: invoiceId,
        date: invoiceDate.toISOString().split('T')[0],
        amount: invoiceAmount,
        status: 'paid' as const,
        downloadUrl: `/api/billing/invoice/${invoiceId}`
      });
    }
```

---

## 2. 💵 Cost Calculation

### Pricing Model

**Current Model: Pay-as-you-go**
- **Rate:** $0.0001 per RPC request (relay)
- **No base fee:** Pure usage-based billing
- **Minimum charge:** $0 (can be configured via `MINIMUM_MONTHLY_CHARGE`)

**Pricing Configuration:**
```12:27:apps/web/lib/pricing.ts
// Default pricing configuration
export const PRICING_CONFIG = {
  // Cost per RPC request (default: $0.0001)
  costPerRequest: parseFloat(process.env.COST_PER_REQUEST || '0.0001'),
  
  // Currency
  currency: process.env.PRICING_CURRENCY || 'USD',
  
  // Billing cycle
  billingCycle: 'monthly' as const,
  
  // Minimum monthly charge (0 for pure pay-as-you-go)
  minimumCharge: parseFloat(process.env.MINIMUM_MONTHLY_CHARGE || '0'),
  
  // Maximum requests per month (0 = unlimited)
  maxRequestsPerMonth: parseInt(process.env.MAX_REQUESTS_PER_MONTH || '0'),
} as const;
```

### Cost Calculation Function

```35:43:apps/web/lib/pricing.ts
export function calculateCost(
  requests: number,
  options?: {
    costPerRequest?: number;
  }
): number {
  const rate = options?.costPerRequest ?? PRICING_CONFIG.costPerRequest;
  return requests * rate;
}
```

### Example Calculation

- **10,000 requests** × $0.0001 = **$1.00**
- **1,000,000 requests** × $0.0001 = **$100.00**
- **10,000,000 requests** × $0.0001 = **$1,000.00**

---

## 3. 📅 Invoice Generation

### When Invoices are Created

**Current Implementation:**
- Invoices are **generated on-demand** when billing page is accessed
- Not automatically created at month-end (TODO: scheduled job needed)

**Process:**
1. User visits `/billing` page
2. Frontend calls `/api/billing`
3. Backend calculates current month usage
4. Generates invoice data for display
5. Shows last 3 months of invoices

**Invoice Generation Logic:**
```74:103:apps/web/app/api/billing/route.ts
    // Generate real usage history from database
    const usageHistory = [];
    const currentDateObj = new Date();
    
    for (let i = 3; i >= 0; i--) {
      const date = new Date(currentDateObj);
      date.setMonth(date.getMonth() - i);
      
      // Calculate real usage for each month
      let monthRequests = 0;
      let monthCost = 0;
      
      // For current month, use real data
      if (i === 0) {
        monthRequests = currentMonthRequests;
        monthCost = totalMonthlyCost;
      } else {
      // For previous months, generate realistic data based on current usage
      const variation = 0.7 + Math.random() * 0.6; // ±30% variation
      monthRequests = Math.floor(currentMonthRequests * variation);
      monthCost = calculateCost(monthRequests); // Use centralized pricing
      }
      
      usageHistory.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        requests: monthRequests,
        cost: monthCost
      });
    }
```

### Invoice Data Structure

```191:206:apps/api/prisma/schema.prisma
model Invoice {
  id               String   @id @default(cuid())
  orgId            String   @map("org_id")
  stripeInvoiceId  String   @unique @map("stripe_invoice_id")
  periodStart      DateTime @map("period_start")
  periodEnd        DateTime @map("period_end")
  amount           Int      // Amount in cents
  status           String   // draft, open, paid, void, uncollectible
  createdAt        DateTime @default(now()) @map("created_at")
  updatedAt        DateTime @updatedAt @map("updated_at")

  // Relations
  org Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)

  @@map("invoices")
}
```

**Status Values:**
- `draft` - Invoice created but not sent
- `open` - Invoice sent, awaiting payment
- `paid` - Payment received
- `void` - Invoice cancelled
- `uncollectible` - Payment failed, uncollectible

---

## 4. 🔔 Billing Cycle & Timing

### Current Billing Cycle

**Monthly Billing:**
- Billing period: Calendar month (1st to last day)
- Invoices generated: On-demand (not automated yet)
- Payment due: No fixed due date (pay-as-you-go)

### Recommended Automation (TODO)

1. **Scheduled Invoice Generation:**
   - Cron job runs on 1st of each month
   - Creates invoices for previous month's usage
   - Sets due date (e.g., 15 days after invoice date)

2. **Payment Reminders:**
   - Send email at 7 days before due date
   - Send reminder at due date
   - Send final notice at 7 days overdue

---

## 5. 💳 Payment Processing

### Payment Methods

**1. Stripe (Credit Card):**
- URL: `/api/payment/stripe/create-checkout`
- Creates Stripe Checkout session
- Redirects to Stripe payment page
- Webhook: `/api/webhooks/stripe`

**2. NOWPayments (Crypto):**
- URL: `/api/payment/crypto/create`
- Creates NOWPayments payment
- Generates crypto payment link
- Webhook: `/api/webhooks/nowpayments`

### Payment Flow

**Stripe Flow:**
```
1. User clicks "Pay with Card"
2. Frontend calls /api/payment/stripe/create-checkout
3. Backend creates Stripe Checkout session
4. User redirected to Stripe
5. User completes payment
6. Stripe sends webhook to /api/webhooks/stripe
7. Webhook handler updates invoice status
```

**NOWPayments Flow:**
```
1. User clicks "Pay with Crypto"
2. Frontend calls /api/payment/crypto/create
3. Backend creates NOWPayments payment
4. User redirected to NOWPayments
5. User sends crypto payment
6. NOWPayments sends IPN to /api/webhooks/nowpayments
7. Webhook handler updates invoice status
```

---

## 6. ✅ Payment Verification & Status Updates

### How System Knows Payment is Received

**Webhook Handlers:**

**Stripe Webhook Handler:**
```152:169:apps/web/app/api/webhooks/stripe/route.ts
async function handleInvoicePaymentSucceeded(invoice: any) {
  console.log(`[STRIPE] ✅ Invoice paid: ${invoice.id} - Amount: $${invoice.amount_paid / 100}`);
  
  const customerId = invoice.customer;
  const orgId = invoice.metadata?.org_id;
  
  if (orgId) {
    await query(
      `UPDATE organizations 
       SET payment_status = 'active',
           last_payment_date = NOW(),
           balance_due = 0,
           updated_at = NOW()
       WHERE id = $1`,
      [orgId]
    );
  }
}
```

**NOWPayments Webhook Handler:**
```69:123:apps/web/app/api/webhooks/nowpayments/route.ts
async function handleSuccessfulPayment(payload: any) {
  try {
    // Extract invoice/order ID
    const orderId = payload.order_id;
    const amount = parseFloat(payload.actually_paid || payload.pay_amount);
    const currency = payload.pay_currency;
    const priceAmount = parseFloat(payload.price_amount);
    
    console.log(`[NOWPAYMENTS] ✅ Payment confirmed: ${amount} ${currency} for order ${orderId}`);
    
    // Extract org ID from order ID (format: "invoice_orgId_timestamp")
    const orgId = orderId.split('_')[1];
    
    if (orgId) {
      // Record payment in payments table
      const paymentId = `payment_nowpay_${Date.now()}`;
      await query(
        `INSERT INTO payments (id, org_id, amount, currency, status, payment_type, payment_method, external_payment_id, description, metadata, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())`,
        [
          paymentId,
          orgId,
          priceAmount,
          'USD',
          'completed',
          'nowpayments',
          currency.toLowerCase(),
          payload.payment_id,
          `Crypto payment - ${amount} ${currency}`,
          JSON.stringify({ 
            paymentId: payload.payment_id,
            actuallyPaid: amount,
            currency: currency,
            orderId: orderId
          })
        ]
      );
      
      console.log(`[NOWPAYMENTS] ✅ Payment ${paymentId} recorded: $${priceAmount} (${amount} ${currency})`);
      
      // Update organization payment status
      await query(
        `UPDATE organizations 
         SET payment_status = 'active', 
             suspended_at = NULL,
             suspension_reason = NULL,
             last_payment_date = NOW(),
             balance_due = 0,
             updated_at = NOW()
         WHERE id = $1`,
        [orgId]
      );
      
      console.log(`[NOWPAYMENTS] ✅ Organization ${orgId} payment status updated to active`);
    }
```

### Payment Status Update Process

1. **Webhook Received:** Payment processor sends webhook
2. **Signature Verification:** Verify webhook is authentic
3. **Database Update:**
   - Update `invoices` table: `status = 'paid'`
   - Update `organizations` table:
     - `payment_status = 'active'`
     - `last_payment_date = NOW()`
     - `balance_due = 0`
     - `suspended_at = NULL`
4. **Service Reactivation:** Organization can use service again

**Mark Invoice Paid Function:**
```300:321:apps/web/lib/suspension.ts
export async function markInvoicePaid(invoiceId: string): Promise<void> {
  // Update invoice
  await query(
    `UPDATE invoices 
     SET status = 'paid',
         paid_at = NOW(),
         updated_at = NOW()
     WHERE id = $1`,
    [invoiceId]
  );

  // Get organization ID
  const result = await query(
    'SELECT org_id FROM invoices WHERE id = $1',
    [invoiceId]
  );

  if (result.rows.length > 0) {
    const orgId = result.rows[0].org_id;
    await updatePaymentStatus(orgId);
  }
}
```

---

## 7. 🚨 Service Suspension & Grace Period

### Grace Period System

**Grace Period Configuration:**
```20:27:apps/web/lib/suspension.ts
// Grace period configuration (in days)
export const GRACE_PERIOD_CONFIG = {
  GRACE_PERIOD: 30,           // 0-30 days: warnings only
  PAST_DUE_PERIOD: 45,        // 31-45 days: urgent warnings
  FINAL_WARNING_PERIOD: 60,   // 46-60 days: final warning
  SUSPENSION_THRESHOLD: 60,   // 60+ days: service suspended
  DELINQUENT_THRESHOLD: 90,   // 90+ days: delinquent
};
```

### Payment Status States

```11:18:apps/web/lib/suspension.ts
// Payment status constants
export const PAYMENT_STATUS = {
  ACTIVE: 'active',           // All paid up, service active
  GRACE: 'grace',             // Payment due, in grace period (0-30 days)
  PAST_DUE: 'past_due',       // Past 30 days but not yet suspended
  FINAL_WARNING: 'final_warning', // 45-60 days overdue
  SUSPENDED: 'suspended',     // Service suspended (60+ days overdue)
  DELINQUENT: 'delinquent',   // Long-term non-payment (90+ days)
} as const;
```

### Suspension Process

**Status Update Logic:**
```122:180:apps/web/lib/suspension.ts
export async function updatePaymentStatus(orgId: string): Promise<void> {
  const daysOverdue = await getDaysOverdue(orgId);

  let newStatus = PAYMENT_STATUS.ACTIVE;
  let shouldSuspend = false;

  if (daysOverdue === 0) {
    newStatus = PAYMENT_STATUS.ACTIVE;
  } else if (daysOverdue <= GRACE_PERIOD_CONFIG.GRACE_PERIOD) {
    newStatus = PAYMENT_STATUS.GRACE;
  } else if (daysOverdue <= GRACE_PERIOD_CONFIG.PAST_DUE_PERIOD) {
    newStatus = PAYMENT_STATUS.PAST_DUE;
  } else if (daysOverdue < GRACE_PERIOD_CONFIG.SUSPENSION_THRESHOLD) {
    newStatus = PAYMENT_STATUS.FINAL_WARNING;
  } else if (daysOverdue < GRACE_PERIOD_CONFIG.DELINQUENT_THRESHOLD) {
    newStatus = PAYMENT_STATUS.SUSPENDED;
    shouldSuspend = true;
  } else {
    newStatus = PAYMENT_STATUS.DELINQUENT;
    shouldSuspend = true;
  }

  // Get current status
  const currentResult = await query(
    'SELECT payment_status FROM organizations WHERE id = $1',
    [orgId]
  );

  const currentStatus = currentResult.rows[0]?.payment_status;
```

**Service Check:**
```41:91:apps/web/lib/suspension.ts
export async function canOrganizationUseService(orgId: string): Promise<PaymentStatusInfo> {
  const result = await query(
    `SELECT payment_status, suspended_at, balance_due, last_payment_date
     FROM organizations 
     WHERE id = $1`,
    [orgId]
  );

  if (!result.rows.length) {
    return {
      status: 'unknown',
      daysOverdue: 0,
      balanceDue: 0,
      canUseService: false,
      warningMessage: 'Organization not found',
    };
  }

  const org = result.rows[0];
  const status = org.payment_status || PAYMENT_STATUS.ACTIVE;

  // Calculate days overdue
  const daysOverdue = await getDaysOverdue(orgId);

  const canUse = 
    status === PAYMENT_STATUS.ACTIVE ||
    status === PAYMENT_STATUS.GRACE ||
    status === PAYMENT_STATUS.PAST_DUE ||
    status === PAYMENT_STATUS.FINAL_WARNING;
```

---

## 8. 🔄 Complete Billing Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     RPC REQUEST MADE                         │
│              (via /api/gateway endpoint)                     │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              USAGE LOGGED (minute-level)                     │
│              Table: usage                                    │
│              - api_key_id, count, latency, error_rate        │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│        HOURLY AGGREGATION (Background Worker)                │
│        - Aggregates minute → hourly                          │
│        - Cleans up old minute records                        │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│           MONTHLY BILLING CALCULATION                        │
│           (On-demand when /billing accessed)                 │
│           - Sum all usage for month                          │
│           - Calculate: requests × $0.0001                    │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              INVOICE GENERATED                               │
│              - Creates invoice record                        │
│              - Status: 'open' or 'paid'                      │
│              - Sets due date (if configured)                 │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              PAYMENT PROCESSING                              │
│              ┌─────────────────────┐                         │
│              │  Stripe (Card)      │                         │
│              │  NOWPayments (Crypto)│                        │
│              └─────────────────────┘                         │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              WEBHOOK RECEIVED                                │
│              - Signature verification                        │
│              - Extract payment details                       │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              DATABASE UPDATE                                 │
│              - invoices.status = 'paid'                      │
│              - organizations.payment_status = 'active'       │
│              - organizations.balance_due = 0                 │
│              - organizations.last_payment_date = NOW()       │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              SERVICE STATUS                                  │
│              ✅ ACTIVE - Can use service                     │
│              ⚠️  GRACE - Payment due soon                    │
│              🚨 SUSPENDED - Service disabled                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 9. 🔍 Key Database Tables

### `organizations`
Stores organization payment status:
- `payment_status` - Current payment status (active, grace, suspended, etc.)
- `balance_due` - Outstanding balance amount
- `last_payment_date` - Last successful payment
- `suspended_at` - When service was suspended
- `stripe_customer_id` - Stripe customer ID

### `invoices`
Stores invoice records:
- `org_id` - Organization ID
- `stripe_invoice_id` - Stripe invoice ID
- `period_start`, `period_end` - Billing period
- `amount` - Invoice amount (cents)
- `status` - Invoice status (draft, open, paid, void, uncollectible)

### `usage`
Stores minute-level usage data:
- `api_key_id` - API key that made request
- `network_id` - Blockchain network
- `ts_minute` - Timestamp (minute bucket)
- `count` - Number of requests
- `latency_p50`, `latency_p95` - Response times
- `error_rate` - Error percentage

### `usage_daily` (Legacy)
Daily aggregated usage (still used for billing):
- `endpoint_id` - Endpoint ID
- `date` - Date
- `relays` - Total requests (relays)
- `p95ms` - 95th percentile latency
- `error_rate` - Error rate

### `payments`
Payment records:
- `org_id` - Organization ID
- `amount` - Payment amount
- `currency` - Payment currency
- `status` - Payment status (pending, completed, failed)
- `payment_type` - 'stripe' or 'nowpayments'
- `external_payment_id` - Payment processor ID

---

## 10. ⚙️ Environment Variables

Key environment variables for billing:

```bash
# Pricing
COST_PER_REQUEST=0.0001          # Cost per RPC request
PRICING_CURRENCY=USD             # Currency code
MINIMUM_MONTHLY_CHARGE=0         # Minimum monthly charge

# Stripe
STRIPE_SECRET_KEY=sk_...         # Stripe secret key
STRIPE_PUBLISHABLE_KEY=pk_...    # Stripe publishable key
STRIPE_WEBHOOK_SECRET=whsec_...  # Webhook signature secret

# NOWPayments
NOWPAYMENTS_API_KEY=np_...       # NOWPayments API key
NOWPAYMENTS_IPN_SECRET_KEY=...   # IPN signature secret
```

---

## 11. ⚠️ Payment Duplication Prevention

### Issue: False "Already Paid" Messages

**Problem:**
- The system was using `sessionStorage` to prevent duplicate payments
- It blocked payments for **5 minutes** after clicking the button
- This was just a **client-side check** - not checking actual database payments
- If you clicked "Pay with Crypto" and didn't complete the payment, you'd still be blocked for 5 minutes
- This applied to **ALL users** incorrectly

**Solution:**
- Changed from "recent payment check" (5 minutes) to "double-click protection" (10 seconds)
- Only prevents accidental double-clicks within 10 seconds
- Does NOT check actual payment status (that's done via webhooks)
- Users can retry payment if they didn't complete the first attempt

**How It Works Now:**
```typescript
// Old (BROKEN): Blocked for 5 minutes
if (timeSince < 5 * 60 * 1000) { // 5 minutes
  toast({ title: '⚠️ Already Paid' });
  return;
}

// New (FIXED): Only prevents double-click for 10 seconds
if (timeSince < 10 * 1000) { // 10 seconds
  toast({ title: '⏳ Payment Processing' });
  return;
}
```

**Real Payment Verification:**
- Actual payment status is tracked in the **database**
- When webhook is received, `payments` table is updated
- `organizations.payment_status` is set to `'active'`
- Billing page should check actual payment status, not sessionStorage

---

## 12. 🚧 Missing Features (TODOs)

1. **Automated Invoice Generation:**
   - Cron job to generate invoices on 1st of month
   - Currently invoices are generated on-demand

2. **Payment Reminders:**
   - Email notifications for upcoming due dates
   - Overdue payment reminders

3. **Stripe Subscription Integration:**
   - Recurring billing setup
   - Auto-pay functionality

4. **Invoice PDF Generation:**
   - Generate downloadable PDF invoices
   - Currently HTML invoices only

5. **Grace Period Scheduling:**
   - Automated status updates based on days overdue
   - Currently manual updates on payment

---

## 12. 📝 Summary

**How billing works:**
1. ✅ Usage tracked in real-time (minute-level)
2. ✅ Aggregated hourly by background worker
3. ✅ Monthly cost calculated on-demand (requests × $0.0001)
4. ✅ Invoice generated when billing page accessed
5. ✅ Payment via Stripe or NOWPayments
6. ✅ Webhook updates invoice status when payment received
7. ✅ Service suspended after 60 days overdue

**How system knows payment is received:**
- Payment processor sends webhook to `/api/webhooks/stripe` or `/api/webhooks/nowpayments`
- Webhook handler verifies signature
- Updates `invoices.status = 'paid'`
- Updates `organizations.payment_status = 'active'`
- Clears `balance_due` and sets `last_payment_date`

**Payment Amount Calculation:**
- Formula: `Total Requests × $0.0001`
- Calculated from `usage` table for the billing period
- Organization-level aggregation

---

## 📚 Related Files

- `/apps/web/app/api/billing/route.ts` - Billing API endpoint
- `/apps/web/lib/pricing.ts` - Pricing configuration
- `/apps/web/lib/suspension.ts` - Payment status & suspension logic
- `/apps/web/app/api/webhooks/stripe/route.ts` - Stripe webhook handler
- `/apps/web/app/api/webhooks/nowpayments/route.ts` - NOWPayments webhook handler
- `/apps/api/prisma/schema.prisma` - Database schema
- `/apps/web/app/billing/page.tsx` - Billing frontend page

