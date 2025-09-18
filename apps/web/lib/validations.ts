import { z } from 'zod';

// Admin User Validation
export const zAdminUser = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  role: z.enum(['owner', 'admin', 'viewer']).default('admin'),
  isActive: z.boolean().default(true),
});

// Endpoint Validation
export const zEndpoint = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  baseUrl: z.string().url('Invalid base URL'),
  healthUrl: z.string().url('Invalid health URL'),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const zEndpointUpdate = zEndpoint.partial();

// Network Validation
export const zNetwork = z.object({
  code: z.string().min(2, 'Code must be at least 2 characters'),
  chainId: z.number().int().positive('Chain ID must be positive').optional(),
  rpcUrl: z.string().url('Invalid RPC URL'),
  wsUrl: z.string().url('Invalid WebSocket URL').optional(),
  isTestnet: z.boolean().default(false),
  isEnabled: z.boolean().default(true),
});

export const zNetworkUpdate = zNetwork.partial();

// API Key Validation
export const zApiKey = z.object({
  label: z.string().min(2, 'Label must be at least 2 characters'),
  headerName: z.literal('X-API-Key').default('X-API-Key'),
  rpsLimit: z.number().int().positive().max(10000, 'RPS limit cannot exceed 10,000').default(100),
  rpdLimit: z.number().int().positive().default(1000000),
  rpmLimit: z.number().int().positive().default(30000000),
  isActive: z.boolean().default(true),
});

export const zApiKeyUpdate = zApiKey.partial();

// Usage Query Validation
export const zUsageQuery = z.object({
  from: z.string().datetime('Invalid from date'),
  to: z.string().datetime('Invalid to date'),
  granularity: z.enum(['minute', 'hour', 'day']).default('hour'),
  keyId: z.string().optional(),
  networkId: z.string().optional(),
});

// Health Check Query Validation
export const zHealthQuery = z.object({
  endpointId: z.string().optional(),
  from: z.string().datetime('Invalid from date').optional(),
  to: z.string().datetime('Invalid to date').optional(),
});

// JSON-RPC Request Validation
export const zJsonRpcRequest = z.object({
  method: z.string().min(1, 'Method is required'),
  params: z.array(z.any()).optional(),
  id: z.union([z.string(), z.number()]).optional(),
  jsonrpc: z.literal('2.0').default('2.0'),
});

// Response Types
export const zApiResponse = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: dataSchema.optional(),
    error: z.object({
      code: z.string(),
      message: z.string(),
    }).optional(),
  });

// Pagination
export const zPagination = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

// Common ID validation
export const zId = z.string().cuid('Invalid ID format');

// Export types
export type AdminUser = z.infer<typeof zAdminUser>;
export type Endpoint = z.infer<typeof zEndpoint>;
export type EndpointUpdate = z.infer<typeof zEndpointUpdate>;
export type Network = z.infer<typeof zNetwork>;
export type NetworkUpdate = z.infer<typeof zNetworkUpdate>;
export type ApiKey = z.infer<typeof zApiKey>;
export type ApiKeyUpdate = z.infer<typeof zApiKeyUpdate>;
export type UsageQuery = z.infer<typeof zUsageQuery>;
export type HealthQuery = z.infer<typeof zHealthQuery>;
export type JsonRpcRequest = z.infer<typeof zJsonRpcRequest>;
export type Pagination = z.infer<typeof zPagination>;


