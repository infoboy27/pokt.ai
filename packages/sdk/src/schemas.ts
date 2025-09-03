import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().optional(),
  organizations: z.array(z.object({
    id: z.string(),
    name: z.string(),
    role: z.string().optional(),
  })),
  ownedOrganizations: z.array(z.object({
    id: z.string(),
    name: z.string(),
  })),
});

export const EndpointSchema = z.object({
  id: z.string(),
  orgId: z.string(),
  name: z.string(),
  chainId: z.string(),
  rateLimit: z.number(),
  tokenHash: z.string(),
  status: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  endpointUrl: z.string().optional(),
  token: z.string().optional(),
});

export const CreateEndpointRequestSchema = z.object({
  name: z.string().min(1),
  chainId: z.string().min(1),
  rateLimit: z.number().positive(),
});

export const UsageStatsSchema = z.object({
  totalRelays: z.number(),
  avgLatency: z.number(),
  avgErrorRate: z.number(),
  dailyData: z.array(z.object({
    id: z.string(),
    endpointId: z.string(),
    date: z.string(),
    relays: z.number(),
    p95ms: z.number(),
    errorRate: z.number(),
    createdAt: z.string(),
  })),
});

export const AuthResponseSchema = z.object({
  access_token: z.string(),
  user: UserSchema,
});
