import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { zNetwork } from '@/lib/validations';
import { requireAdmin } from '@/lib/admin-auth';

const prisma = new PrismaClient();

// POST /api/admin/endpoints/[id]/networks - Add network to endpoint
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = zNetwork.parse(body);

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

    // Check if network code already exists for this endpoint
    const existingNetwork = await prisma.network.findFirst({
      where: {
        endpointId: params.id,
        code: validatedData.code,
      },
    });

    if (existingNetwork) {
      return NextResponse.json(
        { error: { code: 'CONFLICT', message: 'Network code already exists for this endpoint' } },
        { status: 409 }
      );
    }

    const network = await prisma.network.create({
      data: {
        ...validatedData,
        endpointId: params.id,
      },
    });

    return NextResponse.json({ data: network }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid input data' } },
        { status: 400 }
      );
    }

    console.error('Error creating network:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to create network' } },
      { status: 500 }
    );
  }
}


