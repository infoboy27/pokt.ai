import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { zEndpoint, zEndpointUpdate } from '@/lib/validations';
// import { requireAdmin } from '@/lib/admin-auth'; // Temporarily disabled for testing

const prisma = new PrismaClient();

// GET /api/admin/endpoints - List all endpoints
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const [endpoints, total] = await Promise.all([
      prisma.endpoint.findMany({
        skip,
        take: limit,
        include: {
          networks: {
            select: {
              id: true,
              code: true,
              chainId: true,
              isEnabled: true,
            },
          },
          apiKeys: {
            select: {
              id: true,
              label: true,
              isActive: true,
            },
          },
          healthChecks: {
            orderBy: { checkedAt: 'desc' },
            take: 1,
            select: {
              ok: true,
              latencyMs: true,
              checkedAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.endpoint.count(),
    ]);

    return NextResponse.json({
      data: {
        endpoints,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching endpoints:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch endpoints' } },
      { status: 500 }
    );
  }
}

// POST /api/admin/endpoints - Create new endpoint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = zEndpoint.parse(body);

    // Check if endpoint name already exists
    const existingEndpoint = await prisma.endpoint.findUnique({
      where: { name: validatedData.name },
    });

    if (existingEndpoint) {
      return NextResponse.json(
        { error: { code: 'CONFLICT', message: 'Endpoint name already exists' } },
        { status: 409 }
      );
    }

    const endpoint = await prisma.endpoint.create({
      data: validatedData,
      include: {
        networks: true,
        apiKeys: true,
      },
    });

    return NextResponse.json({ data: endpoint }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid input data' } },
        { status: 400 }
      );
    }

    console.error('Error creating endpoint:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to create endpoint' } },
      { status: 500 }
    );
  }
}


