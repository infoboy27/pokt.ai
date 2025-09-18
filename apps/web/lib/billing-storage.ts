// Comprehensive billing and relay tracking system
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface EndpointWithBilling {
  id: string;
  name: string;
  chainId: string;
  token: string;
  tokenHash: string;
  rateLimit: number;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  orgId: string;
  totalRelays: number;
  monthlyRelays: number;
  lastBillingDate: string | null;
}

interface RelayUsage {
  endpointId: string;
  method: string;
  timestamp: string;
  latency: number;
  success: boolean;
  clientIp?: string;
}

interface MonthlyBill {
  orgId: string;
  month: string; // YYYY-MM format
  totalRelays: number;
  totalCost: number; // in cents
  status: 'pending' | 'paid' | 'overdue';
  createdAt: string;
  paidAt?: string;
}

// Endpoint Management with Billing
export async function createPermanentEndpoint(data: {
  name: string;
  chainId: string;
  token: string;
  tokenHash: string;
  rateLimit: number;
  orgId: string;
}): Promise<EndpointWithBilling | null> {
  try {
    const endpointId = `pokt_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
    const now = new Date().toISOString();

    // Insert into endpoints table (using existing schema)
    await prisma.$executeRaw`
      INSERT INTO endpoints (id, org_id, name, chain_id, rate_limit, token_hash, status, created_at, updated_at)
      VALUES (${endpointId}, ${data.orgId}, ${data.name}, ${data.chainId}, ${data.rateLimit}, ${data.tokenHash}, 'active', NOW(), NOW())
    `;

    return {
      id: endpointId,
      name: data.name,
      chainId: data.chainId,
      token: data.token,
      tokenHash: data.tokenHash,
      rateLimit: data.rateLimit,
      status: 'active',
      createdAt: now,
      updatedAt: now,
      orgId: data.orgId,
      totalRelays: 0,
      monthlyRelays: 0,
      lastBillingDate: null,
    };
  } catch (error) {
    console.error('Failed to create permanent endpoint:', error);
    return null;
  }
}

export async function getPermanentEndpoint(id: string): Promise<EndpointWithBilling | null> {
  try {
    // Get endpoint from database
    const endpoints = await prisma.$queryRaw`
      SELECT 
        e.id, 
        e.name, 
        e.chain_id as "chainId", 
        e.token_hash as "tokenHash",
        e.rate_limit as "rateLimit", 
        e.status, 
        e.created_at as "createdAt", 
        e.updated_at as "updatedAt",
        e.org_id as "orgId",
        COALESCE(SUM(u.relays), 0) as "totalRelays"
      FROM endpoints e
      LEFT JOIN usage_daily u ON e.id = u.endpoint_id
      WHERE e.id = ${id} AND e.status = 'active'
      GROUP BY e.id, e.name, e.chain_id, e.token_hash, e.rate_limit, e.status, e.created_at, e.updated_at, e.org_id
      LIMIT 1
    `;
    
    const result = endpoints as any[];
    if (result.length === 0) return null;

    const endpoint = result[0];
    
    // Get monthly relays (current month)
    const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
    const monthlyUsage = await prisma.$queryRaw`
      SELECT COALESCE(SUM(relays), 0) as "monthlyRelays"
      FROM usage_daily 
      WHERE endpoint_id = ${id} 
      AND date >= ${currentMonth + '-01'}::date
    `;
    
    const monthlyData = monthlyUsage as any[];
    const monthlyRelays = monthlyData.length > 0 ? monthlyData[0].monthlyRelays : 0;

    return {
      ...endpoint,
      token: 'hidden', // Don't expose token in queries
      totalRelays: parseInt(endpoint.totalRelays) || 0,
      monthlyRelays: parseInt(monthlyRelays) || 0,
      lastBillingDate: null, // TODO: Implement billing date tracking
    };
  } catch (error) {
    console.error('Failed to get permanent endpoint:', error);
    return null;
  }
}

export async function getAllPermanentEndpoints(orgId: string = 'org-1'): Promise<EndpointWithBilling[]> {
  try {
    const endpoints = await prisma.$queryRaw`
      SELECT 
        e.id, 
        e.name, 
        e.chain_id as "chainId", 
        e.token_hash as "tokenHash",
        e.rate_limit as "rateLimit", 
        e.status, 
        e.created_at as "createdAt", 
        e.updated_at as "updatedAt",
        e.org_id as "orgId",
        COALESCE(SUM(u.relays), 0) as "totalRelays"
      FROM endpoints e
      LEFT JOIN usage_daily u ON e.id = u.endpoint_id
      WHERE e.org_id = ${orgId} AND e.status = 'active'
      GROUP BY e.id, e.name, e.chain_id, e.token_hash, e.rate_limit, e.status, e.created_at, e.updated_at, e.org_id
      ORDER BY e.created_at DESC
    `;
    
    return (endpoints as any[]).map(endpoint => ({
      ...endpoint,
      token: 'hidden',
      totalRelays: parseInt(endpoint.totalRelays) || 0,
      monthlyRelays: 0, // TODO: Calculate monthly relays
      lastBillingDate: null,
    }));
  } catch (error) {
    console.error('Failed to get permanent endpoints:', error);
    return [];
  }
}

// Relay Tracking
export async function logRelayUsage(usage: RelayUsage): Promise<boolean> {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Update or create daily usage record
    await prisma.$executeRaw`
      INSERT INTO usage_daily (id, endpoint_id, date, relays, p95_ms, error_rate, created_at)
      VALUES (
        ${`usage_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`},
        ${usage.endpointId},
        ${today}::date,
        1,
        ${usage.latency},
        ${usage.success ? 0.0 : 1.0},
        NOW()
      )
      ON CONFLICT (endpoint_id, date) 
      DO UPDATE SET 
        relays = usage_daily.relays + 1,
        p95_ms = (usage_daily.p95_ms + ${usage.latency}) / 2,
        error_rate = (usage_daily.error_rate + ${usage.success ? 0.0 : 1.0}) / 2
    `;
    
    return true;
  } catch (error) {
    console.error('Failed to log relay usage:', error);
    return false;
  }
}

// Billing System
export async function generateMonthlyBill(orgId: string, month: string): Promise<MonthlyBill | null> {
  try {
    // Calculate total relays for the month
    const usageData = await prisma.$queryRaw`
      SELECT 
        SUM(u.relays) as "totalRelays"
      FROM usage_daily u
      JOIN endpoints e ON u.endpoint_id = e.id
      WHERE e.org_id = ${orgId}
      AND u.date >= ${month + '-01'}::date
      AND u.date < (${month + '-01'}::date + INTERVAL '1 month')
    `;
    
    const usage = usageData as any[];
    const totalRelays = usage.length > 0 ? parseInt(usage[0].totalRelays) || 0 : 0;
    
    // Calculate cost (example: $0.0001 per relay = 1 cent per 100 relays)
    const costPerRelay = 0.0001; // $0.0001 per relay
    const totalCostDollars = totalRelays * costPerRelay;
    const totalCostCents = Math.round(totalCostDollars * 100);

    const bill: MonthlyBill = {
      orgId,
      month,
      totalRelays,
      totalCost: totalCostCents,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    // In production, save bill to database
    console.log(`Generated bill for ${orgId} (${month}):`, bill);
    
    return bill;
  } catch (error) {
    console.error('Failed to generate monthly bill:', error);
    return null;
  }
}

export async function getMonthlyUsage(orgId: string, month: string): Promise<{ totalRelays: number; totalCost: number }> {
  try {
    const usageData = await prisma.$queryRaw`
      SELECT 
        SUM(u.relays) as "totalRelays"
      FROM usage_daily u
      JOIN endpoints e ON u.endpoint_id = e.id
      WHERE e.org_id = ${orgId}
      AND u.date >= ${month + '-01'}::date
      AND u.date < (${month + '-01'}::date + INTERVAL '1 month')
    `;
    
    const usage = usageData as any[];
    const totalRelays = usage.length > 0 ? parseInt(usage[0].totalRelays) || 0 : 0;
    const totalCost = Math.round(totalRelays * 0.0001 * 100); // Cost in cents
    
    return { totalRelays, totalCost };
  } catch (error) {
    console.error('Failed to get monthly usage:', error);
    return { totalRelays: 0, totalCost: 0 };
  }
}


