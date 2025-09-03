export interface User {
  id: string;
  email: string;
  name?: string;
  organizations: Organization[];
  ownedOrganizations: Organization[];
}

export interface Organization {
  id: string;
  name: string;
  role?: string;
}

export interface Endpoint {
  id: string;
  orgId: string;
  name: string;
  chainId: string;
  rateLimit: number;
  tokenHash: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  endpointUrl?: string;
  token?: string; // Only returned on creation
}

export interface CreateEndpointRequest {
  name: string;
  chainId: string;
  rateLimit: number;
}

export interface UsageStats {
  totalRelays: number;
  avgLatency: number;
  avgErrorRate: number;
  dailyData: UsageDaily[];
}

export interface UsageDaily {
  id: string;
  endpointId: string;
  date: string;
  relays: number;
  p95ms: number;
  errorRate: number;
  createdAt: string;
  endpoint?: Endpoint;
}

export interface Invoice {
  id: string;
  orgId: string;
  stripeInvoiceId: string;
  periodStart: string;
  periodEnd: string;
  amount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface ApiError {
  message: string;
  statusCode: number;
}
