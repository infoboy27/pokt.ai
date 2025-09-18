import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/test/endpoints/[id] - Get specific endpoint (no auth required)
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

