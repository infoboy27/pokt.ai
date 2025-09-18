import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { zApiKey } from '@/lib/validations';
import { requireAdmin } from '@/lib/admin-auth';
import { hash } from 'argon2';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

// GET /api/admin/endpoints/[id]/keys - List API keys for endpoint
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const endpoint = await prisma.endpoint.findUnique({
      where: { id: params.id },
    });

    if (!endpoint) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Endpoint not found' } },
        { status: 404 }
      );
    }

    const apiKeys = await prisma.apiKey.findMany({
      where: { endpointId: params.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        label: true,
        headerName: true,
        rpsLimit: true,
        rpdLimit: true,
        rpmLimit: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            usages: true,
          },
        },
      },
    });

    return NextResponse.json({ data: apiKeys });
  } catch (error) {
    console.error('Error fetching API keys:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch API keys' } },
      { status: 500 }
    );
  }
}

// POST /api/admin/endpoints/[id]/keys - Generate new API key
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = zApiKey.parse(body);

    // Check if endpoint exists
    const endpoint = await prisma.endpoint.findUnique({
      where: { id: params.id },
    });

    if (!endpoint) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Endpoint not found' } },
        { status: 404 }
      );
    }

    // Generate API key
    const rawKey = `pk_${randomBytes(32).toString('hex')}`;
    const keyHash = await hash(rawKey);

    const apiKey = await prisma.apiKey.create({
      data: {
        ...validatedData,
        keyHash,
        endpointId: params.id,
      },
    });

    // Return the API key with the raw key (only time it's shown)
    return NextResponse.json({
      data: {
        ...apiKey,
        rawKey, // Only returned on creation
      },
    }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid input data' } },
        { status: 400 }
      );
    }

    console.error('Error creating API key:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to create API key' } },
      { status: 500 }
    );
  }
}


