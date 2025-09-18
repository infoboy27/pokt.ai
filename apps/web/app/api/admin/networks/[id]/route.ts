import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { zNetworkUpdate } from '@/lib/validations';
import { requireAdmin } from '@/lib/admin-auth';

const prisma = new PrismaClient();

// PUT /api/admin/networks/[id] - Update network
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = zNetworkUpdate.parse(body);

    // Check if network exists
    const existingNetwork = await prisma.network.findUnique({
      where: { id: params.id },
    });

    if (!existingNetwork) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Network not found' } },
        { status: 404 }
      );
    }

    // Check if code is being changed and if it conflicts
    if (validatedData.code && validatedData.code !== existingNetwork.code) {
      const codeConflict = await prisma.network.findFirst({
        where: {
          endpointId: existingNetwork.endpointId,
          code: validatedData.code,
          id: { not: params.id },
        },
      });

      if (codeConflict) {
        return NextResponse.json(
          { error: { code: 'CONFLICT', message: 'Network code already exists for this endpoint' } },
          { status: 409 }
        );
      }
    }

    const network = await prisma.network.update({
      where: { id: params.id },
      data: validatedData,
    });

    return NextResponse.json({ data: network });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid input data' } },
        { status: 400 }
      );
    }

    console.error('Error updating network:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to update network' } },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/networks/[id] - Delete network
export async function DELETE(
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

    await prisma.network.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    console.error('Error deleting network:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to delete network' } },
      { status: 500 }
    );
  }
}


