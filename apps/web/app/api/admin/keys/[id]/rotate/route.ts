import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAdmin } from '@/lib/admin-auth';
import { hash } from 'argon2';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

// POST /api/admin/keys/[id]/rotate - Rotate API key
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const apiKey = await prisma.apiKey.findUnique({
      where: { id: params.id },
    });

    if (!apiKey) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'API key not found' } },
        { status: 404 }
      );
    }

    // Generate new API key
    const rawKey = `pk_${randomBytes(32).toString('hex')}`;
    const keyHash = await hash(rawKey);

    const updatedApiKey = await prisma.apiKey.update({
      where: { id: params.id },
      data: {
        keyHash,
        updatedAt: new Date(),
      },
    });

    // Return the new API key with the raw key (only time it's shown)
    return NextResponse.json({
      data: {
        ...updatedApiKey,
        rawKey, // Only returned on rotation
      },
      message: 'API key rotated successfully',
    });
  } catch (error) {
    console.error('Error rotating API key:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to rotate API key' } },
      { status: 500 }
    );
  }
}


