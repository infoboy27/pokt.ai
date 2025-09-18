// Database-based endpoint storage for permanent persistence
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

// Database operations
export async function getAllEndpointsFromDB(): Promise<StoredEndpoint[]> {
  try {
    // Query the actual database using raw SQL to match existing schema
    const endpoints = await prisma.$queryRaw`
      SELECT 
        id, 
        name, 
        chain_id as "chainId", 
        token_hash as "tokenHash",
        rate_limit as "rateLimit", 
        status, 
        created_at as "createdAt", 
        updated_at as "updatedAt",
        org_id as "orgId",
        'hidden' as token
      FROM endpoints 
      WHERE status = 'active'
      ORDER BY created_at DESC
    `;
    
    return endpoints as StoredEndpoint[];
  } catch (error) {
    console.error('Database query failed:', error);
    return [];
  }
}

export async function getEndpointFromDB(id: string): Promise<StoredEndpoint | null> {
  try {
    const endpoints = await prisma.$queryRaw`
      SELECT 
        id, 
        name, 
        chain_id as "chainId", 
        token_hash as "tokenHash",
        rate_limit as "rateLimit", 
        status, 
        created_at as "createdAt", 
        updated_at as "updatedAt",
        org_id as "orgId",
        'hidden' as token
      FROM endpoints 
      WHERE id = ${id} AND status = 'active'
      LIMIT 1
    `;
    
    const result = endpoints as StoredEndpoint[];
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('Database query failed:', error);
    return null;
  }
}

export async function createEndpointInDB(data: Omit<StoredEndpoint, 'createdAt' | 'updatedAt'>): Promise<StoredEndpoint | null> {
  try {
    // Insert into database using raw SQL
    await prisma.$executeRaw`
      INSERT INTO endpoints (id, org_id, name, chain_id, rate_limit, token_hash, status, created_at, updated_at)
      VALUES (${data.id}, ${data.orgId}, ${data.name}, ${data.chainId}, ${data.rateLimit}, ${data.tokenHash}, ${data.status}, NOW(), NOW())
    `;
    
    return {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Database insert failed:', error);
    return null;
  }
}

export async function updateEndpointInDB(id: string, updates: Partial<StoredEndpoint>): Promise<StoredEndpoint | null> {
  try {
    // Update in database
    if (updates.name) {
      await prisma.$executeRaw`UPDATE endpoints SET name = ${updates.name}, updated_at = NOW() WHERE id = ${id}`;
    }
    if (updates.status) {
      await prisma.$executeRaw`UPDATE endpoints SET status = ${updates.status}, updated_at = NOW() WHERE id = ${id}`;
    }
    if (updates.rateLimit) {
      await prisma.$executeRaw`UPDATE endpoints SET rate_limit = ${updates.rateLimit}, updated_at = NOW() WHERE id = ${id}`;
    }
    
    return await getEndpointFromDB(id);
  } catch (error) {
    console.error('Database update failed:', error);
    return null;
  }
}

export async function deleteEndpointFromDB(id: string): Promise<boolean> {
  try {
    await prisma.$executeRaw`UPDATE endpoints SET status = 'inactive', updated_at = NOW() WHERE id = ${id}`;
    return true;
  } catch (error) {
    console.error('Database delete failed:', error);
    return false;
  }
}


