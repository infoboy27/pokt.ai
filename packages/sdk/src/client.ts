import { 
  User, 
  Endpoint, 
  CreateEndpointRequest, 
  UsageStats, 
  Invoice, 
  AuthResponse,
  ApiError 
} from './types';
import { 
  UserSchema, 
  EndpointSchema, 
  CreateEndpointRequestSchema, 
  UsageStatsSchema, 
  AuthResponseSchema 
} from './schemas';
import { z } from 'zod';

export class PoktAiClient {
  private baseUrl: string;
  private accessToken?: string;

  constructor(baseUrl: string = 'http://localhost:3001/api') {
    this.baseUrl = baseUrl;
  }

  setAccessToken(token: string) {
    this.accessToken = token;
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };

    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error: ApiError = {
        message: `HTTP ${response.status}: ${response.statusText}`,
        statusCode: response.status,
      };
      throw error;
    }

    const data = await response.json() as T;
    return data;
  }

  // Auth endpoints
  async login(auth0Token: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ auth0Token }),
    });
    
    return AuthResponseSchema.parse(response);
  }

  async getProfile(): Promise<User> {
    const response = await this.request<User>('/auth/me');
    return UserSchema.parse(response);
  }

  // Endpoints
  async createEndpoint(data: CreateEndpointRequest): Promise<Endpoint> {
    CreateEndpointRequestSchema.parse(data);
    const response = await this.request<Endpoint>('/endpoints', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return EndpointSchema.parse(response);
  }

  async getEndpoints(): Promise<Endpoint[]> {
    const response = await this.request<Endpoint[]>('/endpoints');
    return z.array(EndpointSchema).parse(response);
  }

  async getEndpoint(id: string): Promise<Endpoint> {
    const response = await this.request<Endpoint>(`/endpoints/${id}`);
    return EndpointSchema.parse(response);
  }

  async rotateToken(id: string): Promise<{ token: string }> {
    return this.request<{ token: string }>(`/endpoints/${id}/rotate-token`, {
      method: 'PUT',
    });
  }

  async revokeEndpoint(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/endpoints/${id}/revoke`, {
      method: 'PUT',
    });
  }

  async deleteEndpoint(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/endpoints/${id}`, {
      method: 'DELETE',
    });
  }

  // Usage
  async getUsageStats(startDate: Date, endDate: Date): Promise<UsageStats> {
    const params = new URLSearchParams({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });
    
    const response = await this.request<UsageStats>(`/usage?${params}`);
    return UsageStatsSchema.parse(response);
  }

  // Billing
  async createBillingPortalSession(): Promise<{ url: string }> {
    return this.request<{ url: string }>('/billing/portal', {
      method: 'POST',
    });
  }

  async getInvoices(): Promise<Invoice[]> {
    return this.request<Invoice[]>('/billing/invoices');
  }

  // Health
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request<{ status: string; timestamp: string }>('/health');
  }
}

// Export a default instance
export const poktAiClient = new PoktAiClient();
