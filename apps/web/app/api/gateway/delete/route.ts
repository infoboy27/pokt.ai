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

    // Delete the endpoint and get final billing info
    const result = deletePermanentEndpoint(endpointId);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 404 }
      );
    }

    console.log(`[pokt.ai] ENDPOINT DELETED: ${endpointId} [Final Bill: ${result.deletedEndpoint?.finalBill?.relays || 0} relays]`);

    return NextResponse.json({
      message: 'Endpoint deleted successfully',
      deletedEndpoint: result.deletedEndpoint,
    });

  } catch (error) {
    console.error('Delete Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}