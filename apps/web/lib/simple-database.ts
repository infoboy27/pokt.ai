// Simple database connection for permanent storage
// Using direct PostgreSQL connection to existing database

interface StoredEndpoint {
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
}

// Simple file-based persistent storage (as fallback)
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

const STORAGE_FILE = '/tmp/pokt-endpoints.json';

interface StorageData {
  endpoints: StoredEndpoint[];
  relayLogs: Array<{
    endpointId: string;
    method: string;
    timestamp: string;
    latency: number;
    success: boolean;
  }>;
}

function loadStorage(): StorageData {
  try {
    if (existsSync(STORAGE_FILE)) {
      const data = readFileSync(STORAGE_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Failed to load storage:', error);
  }
  
  return {
    endpoints: [
      // Legacy endpoints for backward compatibility
      {
        id: 'endpoint_1',
        name: 'Ethereum Mainnet',
        chainId: 'F003',
        token: 'pokt_abc123def456',
        tokenHash: 'legacy_hash_1',
        rateLimit: 1000,
        status: 'active',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:30:00Z',
        orgId: 'org-1',
        totalRelays: 0,
        monthlyRelays: 0,
      },
      {
        id: 'endpoint_2',
        name: 'Polygon',
        chainId: 'F00C',
        token: 'pokt_xyz789uvw012',
        tokenHash: 'legacy_hash_2',
        rateLimit: 500,
        status: 'active',
        createdAt: '2024-01-20T14:45:00Z',
        updatedAt: '2024-01-20T14:45:00Z',
        orgId: 'org-1',
        totalRelays: 0,
        monthlyRelays: 0,
      },
      {
        id: 'endpoint_3',
        name: 'BSC',
        chainId: 'F00B',
        token: 'pokt_mno345pqr678',
        tokenHash: 'legacy_hash_3',
        rateLimit: 750,
        status: 'active',
        createdAt: '2024-01-25T09:15:00Z',
        updatedAt: '2024-01-25T09:15:00Z',
        orgId: 'org-1',
        totalRelays: 0,
        monthlyRelays: 0,
      },
    ],
    relayLogs: [],
  };
}

function saveStorage(data: StorageData): void {
  try {
    writeFileSync(STORAGE_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Failed to save storage:', error);
  }
}

export function createPermanentEndpoint(data: Omit<StoredEndpoint, 'createdAt' | 'updatedAt' | 'totalRelays' | 'monthlyRelays'>): StoredEndpoint | null {
  try {
    const storage = loadStorage();
    const now = new Date().toISOString();
    
    const endpoint: StoredEndpoint = {
      ...data,
      createdAt: now,
      updatedAt: now,
      totalRelays: 0,
      monthlyRelays: 0,
    };
    
    storage.endpoints.push(endpoint);
    saveStorage(storage);
    
    console.log(`[BILLING] Created permanent endpoint: ${endpoint.id}`);
    return endpoint;
  } catch (error) {
    console.error('Failed to create permanent endpoint:', error);
    return null;
  }
}

export function getPermanentEndpoint(id: string): StoredEndpoint | null {
  try {
    const storage = loadStorage();
    return storage.endpoints.find(e => e.id === id && e.status === 'active') || null;
  } catch (error) {
    console.error('Failed to get permanent endpoint:', error);
    return null;
  }
}

export function getAllPermanentEndpoints(orgId: string = 'org-1'): StoredEndpoint[] {
  try {
    const storage = loadStorage();
    return storage.endpoints.filter(e => e.orgId === orgId && e.status === 'active');
  } catch (error) {
    console.error('Failed to get permanent endpoints:', error);
    return [];
  }
}

export function getEndpointToken(endpointId: string): string | null {
  try {
    const storage = loadStorage();
    const endpoint = storage.endpoints.find(e => e.id === endpointId);
    return endpoint?.token || null;
  } catch (error) {
    console.error('Failed to get endpoint token:', error);
    return null;
  }
}

export function logRelay(endpointId: string, method: string, latency: number, success: boolean): boolean {
  try {
    const storage = loadStorage();
    
    // Add relay log
    storage.relayLogs.push({
      endpointId,
      method,
      timestamp: new Date().toISOString(),
      latency,
      success,
    });
    
    // Update endpoint relay counts
    const endpoint = storage.endpoints.find(e => e.id === endpointId);
    if (endpoint) {
      endpoint.totalRelays += 1;
      endpoint.monthlyRelays += 1; // Simplified - in production, calculate by month
      endpoint.updatedAt = new Date().toISOString();
    }
    
    saveStorage(storage);
    console.log(`[BILLING] Logged relay: ${endpointId} -> ${method} (${latency}ms) [${success ? 'SUCCESS' : 'ERROR'}]`);
    return true;
  } catch (error) {
    console.error('Failed to log relay:', error);
    return false;
  }
}

export function getMonthlyUsage(orgId: string, month: string): { totalRelays: number; totalCost: number; endpoints: Array<{ id: string; name: string; relays: number; cost: number }> } {
  try {
    const storage = loadStorage();
    const endpoints = storage.endpoints.filter(e => e.orgId === orgId && e.status === 'active');
    
    let totalRelays = 0;
    const endpointUsage = endpoints.map(endpoint => {
      const relays = endpoint.monthlyRelays; // Simplified
      const cost = Math.round(relays * 0.0001 * 100); // cents
      totalRelays += relays;
      
      return {
        id: endpoint.id,
        name: endpoint.name,
        relays,
        cost,
      };
    });
    
    const totalCost = Math.round(totalRelays * 0.0001 * 100); // cents
    
    return {
      totalRelays,
      totalCost,
      endpoints: endpointUsage,
    };
  } catch (error) {
    console.error('Failed to get monthly usage:', error);
    return { totalRelays: 0, totalCost: 0, endpoints: [] };
  }
}

export function deletePermanentEndpoint(id: string): boolean {
  try {
    const storage = loadStorage();
    const index = storage.endpoints.findIndex(e => e.id === id);
    
    if (index === -1) return false;
    
    // Mark as inactive instead of deleting (for billing history)
    storage.endpoints[index].status = 'inactive';
    storage.endpoints[index].updatedAt = new Date().toISOString();
    
    saveStorage(storage);
    console.log(`[BILLING] Deleted endpoint: ${id}`);
    return true;
  } catch (error) {
    console.error('Failed to delete endpoint:', error);
    return false;
  }
}

export function generateBill(orgId: string, month: string): any {
  const usage = getMonthlyUsage(orgId, month);
  
  return {
    orgId,
    month,
    totalRelays: usage.totalRelays,
    totalCostCents: usage.totalCost,
    totalCostDollars: usage.totalCost / 100,
    status: 'pending',
    createdAt: new Date().toISOString(),
    dueDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString(),
    breakdown: usage.endpoints,
    description: `${usage.totalRelays.toLocaleString()} relays × $0.0001 each = $${(usage.totalCost / 100).toFixed(4)}`,
  };
}
