// Simple file-based endpoint storage for demo
// In production, this would be replaced with database operations

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
}

// In-memory storage (persists during container lifetime)
let endpointsStore: StoredEndpoint[] = [
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
  },
];

export function getAllEndpoints(): StoredEndpoint[] {
  return endpointsStore;
}

export function getEndpointById(id: string): StoredEndpoint | undefined {
  return endpointsStore.find(e => e.id === id);
}

export function createEndpoint(data: Omit<StoredEndpoint, 'createdAt' | 'updatedAt'>): StoredEndpoint {
  const now = new Date().toISOString();
  const endpoint: StoredEndpoint = {
    ...data,
    createdAt: now,
    updatedAt: now,
  };
  
  endpointsStore.push(endpoint);
  return endpoint;
}

export function updateEndpoint(id: string, updates: Partial<StoredEndpoint>): StoredEndpoint | null {
  const index = endpointsStore.findIndex(e => e.id === id);
  if (index === -1) return null;
  
  endpointsStore[index] = {
    ...endpointsStore[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  return endpointsStore[index];
}

export function deleteEndpoint(id: string): boolean {
  const index = endpointsStore.findIndex(e => e.id === id);
  if (index === -1) return false;
  
  endpointsStore.splice(index, 1);
  return true;
}









