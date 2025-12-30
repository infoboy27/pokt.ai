/**
 * Payment Suspension Service
 * 
 * Manages organization payment status and service suspension
 * Grace Period: 60 days before suspension
 */

import { query } from './database';

// Payment status constants
export const PAYMENT_STATUS = {
  ACTIVE: 'active',           // All paid up, service active
  GRACE: 'grace',             // Payment due, in grace period (0-30 days)
  PAST_DUE: 'past_due',       // Past 30 days but not yet suspended
  FINAL_WARNING: 'final_warning', // 45-60 days overdue
  SUSPENDED: 'suspended',     // Service suspended (60+ days overdue)
  DELINQUENT: 'delinquent',   // Long-term non-payment (90+ days)
} as const;

// Grace period configuration (in days)
export const GRACE_PERIOD_CONFIG = {
  GRACE_PERIOD: 30,           // 0-30 days: warnings only
  PAST_DUE_PERIOD: 45,        // 31-45 days: urgent warnings
  FINAL_WARNING_PERIOD: 60,   // 46-60 days: final warning
  SUSPENSION_THRESHOLD: 60,   // 60+ days: service suspended
  DELINQUENT_THRESHOLD: 90,   // 90+ days: delinquent
};

export interface PaymentStatusInfo {
  status: string;
  daysOverdue: number;
  balanceDue: number;
  suspendedAt?: Date;
  canUseService: boolean;
  warningMessage?: string;
}

/**
 * Check if organization can use service based on payment status
 */
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

  let warningMessage: string | undefined;

  if (status === PAYMENT_STATUS.GRACE) {
    warningMessage = `Payment is ${daysOverdue} days overdue. Service will be suspended in ${GRACE_PERIOD_CONFIG.SUSPENSION_THRESHOLD - daysOverdue} days.`;
  } else if (status === PAYMENT_STATUS.PAST_DUE) {
    warningMessage = `Payment is ${daysOverdue} days overdue. Please pay soon to avoid suspension.`;
  } else if (status === PAYMENT_STATUS.FINAL_WARNING) {
    warningMessage = `URGENT: Payment is ${daysOverdue} days overdue. Service will be suspended in ${GRACE_PERIOD_CONFIG.SUSPENSION_THRESHOLD - daysOverdue} days.`;
  } else if (status === PAYMENT_STATUS.SUSPENDED) {
    warningMessage = `Service suspended due to non-payment (${daysOverdue} days overdue).`;
  }

  return {
    status,
    daysOverdue,
    balanceDue: parseFloat(org.balance_due || '0'),
    suspendedAt: org.suspended_at,
    canUseService: canUse,
    warningMessage,
  };
}

/**
 * Get days overdue for oldest unpaid invoice
 */
async function getDaysOverdue(orgId: string): Promise<number> {
  const result = await query(
    `SELECT due_date 
     FROM invoices 
     WHERE org_id = $1 
       AND status IN ('open', 'uncollectible')
     ORDER BY due_date ASC 
     LIMIT 1`,
    [orgId]
  );

  if (!result.rows.length) {
    return 0;
  }

  const dueDate = new Date(result.rows[0].due_date);
  const now = new Date();
  const diffTime = now.getTime() - dueDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
}

/**
 * Update payment status based on days overdue
 */
export async function updatePaymentStatus(orgId: string): Promise<void> {
  const daysOverdue = await getDaysOverdue(orgId);

  let newStatus: typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS] = PAYMENT_STATUS.ACTIVE;
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

  // Update status
  await query(
    `UPDATE organizations 
     SET payment_status = $1,
         updated_at = NOW()
     WHERE id = $2`,
    [newStatus, orgId]
  );

  // Suspend if needed (and not already suspended)
  if (shouldSuspend && currentStatus !== PAYMENT_STATUS.SUSPENDED && currentStatus !== PAYMENT_STATUS.DELINQUENT) {
    await suspendOrganization(orgId, `Payment overdue ${daysOverdue} days`);
  }

  // Reinstate if payment made
  if (newStatus === PAYMENT_STATUS.ACTIVE && (currentStatus === PAYMENT_STATUS.SUSPENDED || currentStatus === PAYMENT_STATUS.DELINQUENT)) {
    await reinstateOrganization(orgId);
  }

  console.log(`[SUSPENSION] Organization ${orgId}: ${currentStatus} → ${newStatus} (${daysOverdue} days overdue)`);
}

/**
 * Suspend an organization's service
 */
export async function suspendOrganization(orgId: string, reason: string): Promise<void> {
  console.warn(`[SUSPENSION] Suspending organization ${orgId}: ${reason}`);

  // Calculate balance due
  const balanceResult = await query(
    `SELECT SUM(amount) as total 
     FROM invoices 
     WHERE org_id = $1 
       AND status IN ('open', 'uncollectible')`,
    [orgId]
  );

  const balanceDue = balanceResult.rows[0]?.total || 0;

  // Update organization
  await query(
    `UPDATE organizations 
     SET payment_status = $1,
         suspended_at = NOW(),
         suspension_reason = $2,
         balance_due = $3,
         updated_at = NOW()
     WHERE id = $4`,
    [PAYMENT_STATUS.SUSPENDED, reason, balanceDue / 100, orgId] // Convert cents to dollars
  );

  // Deactivate all endpoints
  await query(
    `UPDATE endpoints 
     SET is_active = false,
         updated_at = NOW()
     WHERE org_id = $1`,
    [orgId]
  );

  console.log(`[SUSPENSION] Organization ${orgId} suspended. Endpoints deactivated.`);

  // TODO: Send suspension email notification
}

/**
 * Reinstate an organization's service after payment
 */
export async function reinstateOrganization(orgId: string): Promise<void> {
  console.log(`[SUSPENSION] Reinstating organization ${orgId}`);

  // Update organization
  await query(
    `UPDATE organizations 
     SET payment_status = $1,
         suspended_at = NULL,
         suspension_reason = NULL,
         balance_due = 0,
         last_payment_date = NOW(),
         updated_at = NOW()
     WHERE id = $2`,
    [PAYMENT_STATUS.ACTIVE, orgId]
  );

  // Reactivate all endpoints (that weren't manually deleted)
  await query(
    `UPDATE endpoints 
     SET is_active = true,
         updated_at = NOW()
     WHERE org_id = $1 
       AND deleted_at IS NULL`,
    [orgId]
  );

  console.log(`[SUSPENSION] Organization ${orgId} reinstated. Endpoints reactivated.`);

  // TODO: Send service restored email notification
}

/**
 * Check all organizations and update their payment status
 * (Run via cron job)
 */
export async function checkAllOrganizations(): Promise<void> {
  console.log('[SUSPENSION] Checking payment status for all organizations...');

  const result = await query(
    'SELECT id FROM organizations WHERE payment_status IS NOT NULL'
  );

  let suspendedCount = 0;
  let reinstatedCount = 0;

  for (const org of result.rows) {
    try {
      const beforeStatus = await query(
        'SELECT payment_status FROM organizations WHERE id = $1',
        [org.id]
      );

      await updatePaymentStatus(org.id);

      const afterStatus = await query(
        'SELECT payment_status FROM organizations WHERE id = $1',
        [org.id]
      );

      if (afterStatus.rows[0]?.payment_status === PAYMENT_STATUS.SUSPENDED && 
          beforeStatus.rows[0]?.payment_status !== PAYMENT_STATUS.SUSPENDED) {
        suspendedCount++;
      }

      if (afterStatus.rows[0]?.payment_status === PAYMENT_STATUS.ACTIVE && 
          (beforeStatus.rows[0]?.payment_status === PAYMENT_STATUS.SUSPENDED || 
           beforeStatus.rows[0]?.payment_status === PAYMENT_STATUS.DELINQUENT)) {
        reinstatedCount++;
      }
    } catch (error) {
      console.error(`[SUSPENSION] Error checking organization ${org.id}:`, error);
    }
  }

  console.log(`[SUSPENSION] Check complete. Suspended: ${suspendedCount}, Reinstated: ${reinstatedCount}`);
}

/**
 * Mark invoice as paid and update organization status
 */
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

/**
 * Mark invoice as failed and update organization status
 */
export async function markInvoiceFailed(invoiceId: string): Promise<void> {
  // Update invoice
  await query(
    `UPDATE invoices 
     SET status = 'open',
         payment_attempts = payment_attempts + 1,
         last_attempt_at = NOW(),
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









