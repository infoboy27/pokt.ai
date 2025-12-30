/**
 * Centralized Pricing Configuration for pokt.ai
 * 
 * This file contains all pricing-related configuration to avoid
 * hardcoding values throughout the codebase.
 * 
 * To change pricing: Update environment variable COST_PER_REQUEST
 * or modify the defaults below.
 */

// Default pricing configuration
export const PRICING_CONFIG = {
  // Cost per RPC request (default: $0.000001 = $1 per 1,000,000)
  costPerRequest: parseFloat(process.env.COST_PER_REQUEST || '0.000001'),
  
  // Currency
  currency: process.env.PRICING_CURRENCY || 'USD',
  
  // Billing cycle
  billingCycle: 'monthly' as const,
  
  // Minimum monthly charge (0 for pure pay-as-you-go)
  minimumCharge: parseFloat(process.env.MINIMUM_MONTHLY_CHARGE || '0'),
  
  // Maximum requests per month (0 = unlimited)
  maxRequestsPerMonth: parseInt(process.env.MAX_REQUESTS_PER_MONTH || '0'),
} as const;

/**
 * Calculate cost for a given number of requests
 * @param requests - Number of RPC requests
 * @param options - Optional pricing options
 * @returns Total cost in dollars
 */
export function calculateCost(
  requests: number,
  options?: {
    costPerRequest?: number;
  }
): number {
  const rate = options?.costPerRequest ?? PRICING_CONFIG.costPerRequest;
  return requests * rate;
}

/**
 * Calculate cost in cents (for Stripe)
 * @param requests - Number of RPC requests
 * @returns Total cost in cents
 */
export function calculateCostInCents(requests: number): number {
  return Math.round(calculateCost(requests) * 100);
}

/**
 * Get current pricing rate
 * @returns Cost per request in dollars
 */
export function getCurrentRate(): number {
  return PRICING_CONFIG.costPerRequest;
}

/**
 * Format cost as currency string
 * @param amount - Amount in dollars
 * @returns Formatted currency string (e.g., "$1.23")
 */
export function formatCost(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: PRICING_CONFIG.currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(amount);
}

/**
 * Calculate estimated monthly cost based on daily rate
 * @param dailyRequests - Average daily requests
 * @returns Estimated monthly cost
 */
export function estimateMonthlyCost(dailyRequests: number): number {
  const monthlyRequests = dailyRequests * 30;
  return calculateCost(monthlyRequests);
}

/**
 * Get pricing tier information (for future tiered pricing)
 */
export const PRICING_TIERS = {
  free: {
    name: 'Free',
    maxRequests: 10000,
    costPerRequest: 0,
    monthlyFee: 0,
  },
  starter: {
    name: 'Starter',
    maxRequests: 100000,
    costPerRequest: 0.00008,
    monthlyFee: 0,
  },
  pro: {
    name: 'Pro',
    maxRequests: 1000000,
    costPerRequest: 0.00006,
    monthlyFee: 49,
  },
  enterprise: {
    name: 'Enterprise',
    maxRequests: Infinity,
    costPerRequest: 0.00005,
    monthlyFee: 0,
    customPricing: true,
  },
} as const;

/**
 * Calculate cost with tiered pricing
 * @param requests - Number of requests
 * @param tier - Pricing tier
 * @returns Total cost including base fee
 */
export function calculateTieredCost(
  requests: number,
  tier: keyof typeof PRICING_TIERS = 'free'
): number {
  const tierConfig = PRICING_TIERS[tier];
  const usageCost = requests * tierConfig.costPerRequest;
  return tierConfig.monthlyFee + usageCost;
}

// Export types for TypeScript
export type PricingTier = keyof typeof PRICING_TIERS;
export type PricingConfig = typeof PRICING_CONFIG;









