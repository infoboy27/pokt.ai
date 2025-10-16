import { z } from 'zod';

// User validation schemas
export const userRegistrationSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  company: z.string().optional(),
  plan: z.string().optional(),
});

export const userLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Endpoint validation schemas
export const endpointCreateSchema = z.object({
  name: z.string().min(1, 'Endpoint name is required'),
  chainId: z.string().min(1, 'Chain ID is required'),
  description: z.string().optional(),
});

// API key validation
export const apiKeySchema = z.object({
  key: z.string().min(10, 'API key must be at least 10 characters'),
});

// Rate limiting validation
export const rateLimitSchema = z.object({
  requests: z.number().min(1, 'Rate limit must be at least 1'),
  window: z.number().min(1, 'Window must be at least 1 second'),
});

// Sanitization functions
export function sanitizeString(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

export function validateChainId(chainId: string): boolean {
  const validChainIds = ['1', '137', '56', '42161', '10', '8453', '43114', 'eth', 'poly', 'bsc', 'arb-one', 'opt', 'base', 'avax', 'solana'];
  return validChainIds.includes(chainId);
}

// Error handling
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function handleValidationError(error: z.ZodError) {
  const fieldErrors = error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message,
  }));
  
  return {
    success: false,
    errors: fieldErrors,
  };
}










