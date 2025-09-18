import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { zEndpointUpdate } from '@/lib/validations';
// import { requireAdmin } from '@/lib/admin-auth'; // Temporarily disabled for testing

const prisma = new PrismaClient();

// GET /api/admin/endpoints/[id] - Get specific endpoint
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const endpoint = await prisma.endpoint.findUnique({
      where: { id: params.id },
      include: {
        networks: {
          orderBy: { code: 'asc' },
        },
        apiKeys: {
          orderBy: { createdAt: 'desc' },
        },
        healthChecks: {
          orderBy: { checkedAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!endpoint) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Endpoint not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: endpoint });
  } catch (error) {
    console.error('Error fetching endpoint:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch endpoint' } },
      { status: 500 }
    );
  }
}

// PUT /api/admin/endpoints/[id] - Update endpoint
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = zEndpointUpdate.parse(body);

    // Check if endpoint exists
    const existingEndpoint = await prisma.endpoint.findUnique({
      where: { id: params.id },
    });

    if (!existingEndpoint) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Endpoint not found' } },
        { status: 404 }
      );
    }

    // Check if name is being changed and if it conflicts
    if (validatedData.name && validatedData.name !== existingEndpoint.name) {
      const nameConflict = await prisma.endpoint.findUnique({
        where: { name: validatedData.name },
      });

      if (nameConflict) {
        return NextResponse.json(
          { error: { code: 'CONFLICT', message: 'Endpoint name already exists' } },
          { status: 409 }
        );
      }
    }

    const endpoint = await prisma.endpoint.update({
      where: { id: params.id },
      data: validatedData,
      include: {
        networks: true,
        apiKeys: true,
      },
    });

    return NextResponse.json({ data: endpoint });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid input data' } },
        { status: 400 }
      );
    }

    console.error('Error updating endpoint:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to update endpoint' } },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/endpoints/[id] - Delete endpoint
export async function DELETE(
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

    await prisma.endpoint.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    console.error('Error deleting endpoint:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to delete endpoint' } },
      { status: 500 }
    );
  }
}


