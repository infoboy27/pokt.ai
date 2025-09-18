import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAdmin } from '@/lib/admin-auth';

const prisma = new PrismaClient();

// PATCH /api/admin/networks/[id]/toggle - Toggle network enabled/disabled
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const network = await prisma.network.findUnique({
      where: { id: params.id },
    });

    if (!network) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Network not found' } },
        { status: 404 }
      );
    }

    const updatedNetwork = await prisma.network.update({
      where: { id: params.id },
      data: {
        isEnabled: !network.isEnabled,
      },
    });

    return NextResponse.json({
      data: {
        ...updatedNetwork,
        message: `Network ${updatedNetwork.isEnabled ? 'enabled' : 'disabled'}`,
      },
    });
  } catch (error) {
    console.error('Error toggling network:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to toggle network' } },
      { status: 500 }
    );
  }
}


