import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

// Generate a secure API key
function generateApiKey(): string {
  const prefix = 'pokt_';
  const randomPart = randomBytes(32).toString('hex');
  return `${prefix}${randomPart}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { label, endpointId, rpsLimit = 100, rpdLimit = 1000000, rpmLimit = 30000000 } = body;

    if (!label || !endpointId) {
      return NextResponse.json(
        { error: 'Label and endpointId are required' },
        { status: 400 }
      );
    }

    // Check if endpoint exists
    const endpoint = await prisma.endpoint.findUnique({
      where: { id: endpointId },
    });

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint not found' },
        { status: 404 }
      );
    }

    // Generate new API key
    const rawApiKey = generateApiKey();
    const keyHash = `hash_${rawApiKey}`; // In production, use proper hashing like argon2

    // Create the API key
    const apiKey = await prisma.apiKey.create({
      data: {
        label,
        keyHash,
        headerName: 'X-API-Key',
        rpsLimit,
        rpdLimit,
        rpmLimit,
        isActive: true,
        endpointId,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: apiKey.id,
        label: apiKey.label,
        rawKey: rawApiKey, // Only returned once on creation
        rpsLimit: apiKey.rpsLimit,
        rpdLimit: apiKey.rpdLimit,
        rpmLimit: apiKey.rpmLimit,
        isActive: apiKey.isActive,
        createdAt: apiKey.createdAt,
      },
    });

  } catch (error: any) {
    console.error('Error generating API key:', error);
    return NextResponse.json(
      { error: 'Failed to generate API key', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const endpointId = searchParams.get('endpointId');

    const where = endpointId ? { endpointId } : {};

    const apiKeys = await prisma.apiKey.findMany({
      where,
      include: {
        endpoint: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Remove sensitive data
    const safeApiKeys = apiKeys.map(key => ({
      id: key.id,
      label: key.label,
      headerName: key.headerName,
      rpsLimit: key.rpsLimit,
      rpdLimit: key.rpdLimit,
      rpmLimit: key.rpmLimit,
      isActive: key.isActive,
      createdAt: key.createdAt,
      endpoint: key.endpoint,
    }));

    return NextResponse.json({
      success: true,
      data: safeApiKeys,
    });

  } catch (error: any) {
    console.error('Error fetching API keys:', error);
    return NextResponse.json(
      { error: 'Failed to fetch API keys', details: error.message },
      { status: 500 }
    );
  }
}


