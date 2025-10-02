import { NextRequest, NextResponse } from 'next/server';
import { deletePermanentEndpoint } from '@/lib/simple-database';

// POST /api/gateway/delete - Delete endpoint via gateway
export async function POST(request: NextRequest) {
  try {
    const { endpointId } = await request.json();
    
    if (!endpointId) {
      return NextResponse.json(
        { error: 'Endpoint ID is required' },
        { status: 400 }
      );
    }

    // Delete the endpoint
    const result = deletePermanentEndpoint(endpointId);
    
    if (!result) {
      return NextResponse.json(
        { error: 'Endpoint not found' },
        { status: 404 }
      );
    }


    return NextResponse.json({
      message: 'Endpoint deleted successfully',
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}