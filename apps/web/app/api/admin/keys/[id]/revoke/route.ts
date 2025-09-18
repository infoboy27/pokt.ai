import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAdmin } from '@/lib/admin-auth';

const prisma = new PrismaClient();

// POST /api/admin/keys/[id]/revoke - Revoke API key
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

    const updatedApiKey = await prisma.apiKey.update({
      where: { id: params.id },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      data: updatedApiKey,
      message: 'API key revoked successfully',
    });
  } catch (error) {
    console.error('Error revoking API key:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to revoke API key' } },
      { status: 500 }
    );
  }
}


