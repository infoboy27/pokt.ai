import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { zApiKeyUpdate } from '@/lib/validations';
import { requireAdmin } from '@/lib/admin-auth';

const prisma = new PrismaClient();

// PUT /api/admin/keys/[id] - Update API key
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = zApiKeyUpdate.parse(body);

    // Check if API key exists
    const existingApiKey = await prisma.apiKey.findUnique({
      where: { id: params.id },
    });

    if (!existingApiKey) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'API key not found' } },
        { status: 404 }
      );
    }

    const apiKey = await prisma.apiKey.update({
      where: { id: params.id },
      data: validatedData,
    });

    return NextResponse.json({ data: apiKey });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid input data' } },
        { status: 400 }
      );
    }

    console.error('Error updating API key:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to update API key' } },
      { status: 500 }
    );
  }
}


