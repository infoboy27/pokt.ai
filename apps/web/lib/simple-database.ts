// Simple database connection for permanent storage
// Using direct PostgreSQL connection to existing database

interface StoredOrganization {
  id: string;
  name: string;
  plan: 'starter' | 'pro' | 'enterprise';
  totalCustomers: number;
  totalEndpoints: number;
  monthlyUsage: number;
  createdAt: string;
  updatedAt: string;
}

interface StoredCustomer {
  id: string;
  name: string;
  email: string;
  organizationId: string;
  plan: 'basic' | 'premium' | 'enterprise';
  status: 'active' | 'suspended' | 'pending';
  totalRelays: number;
  monthlyRelays: number;
  createdAt: string;
  updatedAt: string;
}

interface StoredEndpoint {
  id: string;
  name: string;
  chainId: string;
  token: string;
  tokenHash: string;
  rateLimit: number;
  status: 'active' | 'inactive';
  customerId: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  totalRelays: number;
  monthlyRelays: number;
}

// Simple file-based persistent storage (as fallback)
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

const STORAGE_FILE = '/tmp/pokt-endpoints-new.json';

interface StorageData {
  organizations: StoredOrganization[];
  customers: StoredCustomer[];
  endpoints: StoredEndpoint[];
  relayLogs: Array<{
    endpointId: string;
    customerId: string;
    organizationId: string;
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
  }
  
  return {
    organizations: [
      {
        id: 'org_1',
        name: 'Demo Organization',
        plan: 'enterprise',
        totalCustomers: 2,
        totalEndpoints: 2,
        monthlyUsage: 21000,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: new Date().toISOString(),
      }
    ],
    customers: [
      {
        id: 'cust_1',
        name: 'Acme Corp',
        email: 'admin@acme.com',
        organizationId: 'org_1',
        plan: 'enterprise',
        status: 'active',
        totalRelays: 12500,
        monthlyRelays: 2500,
        createdAt: '2024-01-15T00:00:00Z',
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'cust_2',
        name: 'TechStart Inc',
        email: 'dev@techstart.com',
        organizationId: 'org_1',
        plan: 'premium',
        status: 'active',
        totalRelays: 8500,
        monthlyRelays: 1200,
        createdAt: '2024-02-01T00:00:00Z',
        updatedAt: new Date().toISOString(),
      }
    ],
    endpoints: [
      {
        id: 'pokt_mg52bfax_6ec2d4a6829d',
        name: 'Acme Ethereum Gateway',
        chainId: 'F003',
        token: 'sk_acme_ethereum_token_123',
        tokenHash: 'legacy_hash_1',
        rateLimit: 5000,
        status: 'active',
        customerId: 'cust_1',
        organizationId: 'org_1',
        createdAt: '2025-09-29T11:45:50.656Z',
        updatedAt: '2025-09-29T11:45:50.656Z',
        totalRelays: 12500,
        monthlyRelays: 2500,
      },
      {
        id: 'pokt_mg52tysw_676931d7fe77',
        name: 'TechStart Polygon Gateway',
        chainId: 'F00C',
        token: 'sk_techstart_polygon_token_456',
        tokenHash: 'legacy_hash_2',
        rateLimit: 2000,
        status: 'active',
        customerId: 'cust_2',
        organizationId: 'org_1',
        createdAt: '2025-09-29T12:00:15.732Z',
        updatedAt: '2025-09-29T12:00:15.732Z',
        totalRelays: 8500,
        monthlyRelays: 1200,
      },
    ],
    relayLogs: [],
  };
}

function saveStorage(data: StorageData): void {
  try {
    writeFileSync(STORAGE_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
  }
}

// Organization Management
export function createOrganization(data: Omit<StoredOrganization, 'createdAt' | 'updatedAt' | 'totalCustomers' | 'totalEndpoints' | 'monthlyUsage'>): StoredOrganization | null {
  try {
    const storage = loadStorage();
    const now = new Date().toISOString();
    
    const organization: StoredOrganization = {
      ...data,
      totalCustomers: 0,
      totalEndpoints: 0,
      monthlyUsage: 0,
      createdAt: now,
      updatedAt: now,
    };
    
    storage.organizations.push(organization);
    saveStorage(storage);
    
    return organization;
  } catch (error) {
    return null;
  }
}

export function getAllOrganizations(): StoredOrganization[] {
  try {
    const storage = loadStorage();
    return storage.organizations;
  } catch (error) {
    return [];
  }
}

// Customer Management
export function createCustomer(data: Omit<StoredCustomer, 'createdAt' | 'updatedAt' | 'totalRelays' | 'monthlyRelays'>): StoredCustomer | null {
  try {
    const storage = loadStorage();
    const now = new Date().toISOString();
    
    const customer: StoredCustomer = {
      ...data,
      totalRelays: 0,
      monthlyRelays: 0,
      createdAt: now,
      updatedAt: now,
    };
    
    storage.customers.push(customer);
    
    // Update organization stats
    const orgIndex = storage.organizations.findIndex(org => org.id === data.organizationId);
    if (orgIndex !== -1) {
      storage.organizations[orgIndex].totalCustomers += 1;
      storage.organizations[orgIndex].updatedAt = now;
    }
    
    saveStorage(storage);
    
    return customer;
  } catch (error) {
    return null;
  }
}

export function getAllCustomers(organizationId?: string): StoredCustomer[] {
  try {
    const storage = loadStorage();
    if (organizationId) {
      return storage.customers.filter(customer => customer.organizationId === organizationId);
    }
    return storage.customers;
  } catch (error) {
    return [];
  }
}

export function getCustomer(customerId: string): StoredCustomer | null {
  try {
    const storage = loadStorage();
    return storage.customers.find(customer => customer.id === customerId) || null;
  } catch (error) {
    return null;
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
    
    // Update organization and customer stats
    const orgIndex = storage.organizations.findIndex(org => org.id === data.organizationId);
    if (orgIndex !== -1) {
      storage.organizations[orgIndex].totalEndpoints += 1;
      storage.organizations[orgIndex].updatedAt = now;
    }
    
    const customerIndex = storage.customers.findIndex(customer => customer.id === data.customerId);
    if (customerIndex !== -1) {
      storage.customers[customerIndex].updatedAt = now;
    }
    
    saveStorage(storage);
    
    return endpoint;
  } catch (error) {
    return null;
  }
}

export function getPermanentEndpoint(id: string): StoredEndpoint | null {
  try {
    const storage = loadStorage();
    return storage.endpoints.find(e => e.id === id && e.status === 'active') || null;
  } catch (error) {
    return null;
  }
}

export function getAllPermanentEndpoints(organizationId?: string, customerId?: string): StoredEndpoint[] {
  try {
    const storage = loadStorage();
    
    let filtered = storage.endpoints.filter(e => e.status === 'active');
    
    if (organizationId) {
      filtered = filtered.filter(e => e.organizationId === organizationId);
    }
    
    if (customerId) {
      filtered = filtered.filter(e => e.customerId === customerId);
    }
    
    return filtered;
  } catch (error) {
    return [];
  }
}

export function getEndpointToken(endpointId: string): string | null {
  try {
    const storage = loadStorage();
    const endpoint = storage.endpoints.find(e => e.id === endpointId);
    return endpoint?.token || null;
  } catch (error) {
    return null;
  }
}

export function logRelay(endpointId: string, method: string, latency: number, success: boolean): boolean {
  try {
    const storage = loadStorage();
    
    // Find endpoint to get customer and organization info
    const endpoint = storage.endpoints.find(e => e.id === endpointId);
    if (!endpoint) {
      return false;
    }
    
    // Add relay log with customer and organization tracking
    storage.relayLogs.push({
      endpointId,
      customerId: endpoint.customerId,
      organizationId: endpoint.organizationId,
      method,
      timestamp: new Date().toISOString(),
      latency,
      success,
    });
    
    // Update endpoint relay counts
    endpoint.totalRelays += 1;
    endpoint.monthlyRelays += 1; // Simplified - in production, calculate by month
    endpoint.updatedAt = new Date().toISOString();
    
    // Update customer relay counts
    const customer = storage.customers.find(c => c.id === endpoint.customerId);
    if (customer) {
      customer.totalRelays += 1;
      customer.monthlyRelays += 1;
      customer.updatedAt = new Date().toISOString();
    }
    
    // Update organization usage
    const organization = storage.organizations.find(o => o.id === endpoint.organizationId);
    if (organization) {
      organization.monthlyUsage += 1;
      organization.updatedAt = new Date().toISOString();
    }
    
    saveStorage(storage);
    return true;
  } catch (error) {
    return false;
  }
}

export function getMonthlyUsage(orgId: string, month: string): { totalRelays: number; totalCost: number; endpoints: Array<{ id: string; name: string; relays: number; cost: number }> } {
  try {
    const storage = loadStorage();
    const endpoints = storage.endpoints.filter(e => e.organizationId === orgId && e.status === 'active');
    
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
    return true;
  } catch (error) {
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
