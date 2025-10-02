import { NextRequest, NextResponse } from 'next/server';
import { userQueries } from '@/lib/database';

// OPTIONS /api/auth/verify-email - Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// POST /api/auth/verify-email - Handle email verification
export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();

    // Validate required fields
    if (!email || !code) {
      const errorResponse = NextResponse.json(
        { success: false, message: 'Email and verification code are required' },
        { status: 400 }
      );
      
      // Add CORS headers
      errorResponse.headers.set('Access-Control-Allow-Origin', '*');
      errorResponse.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
      errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
      return errorResponse;
    }

    // Validate code format
    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      const errorResponse = NextResponse.json(
        { success: false, message: 'Please enter a valid 6-digit verification code' },
        { status: 400 }
      );
      
      // Add CORS headers
      errorResponse.headers.set('Access-Control-Allow-Origin', '*');
      errorResponse.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
      errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
      return errorResponse;
    }

    // Check if user exists
    const existingUser = await userQueries.findByEmail(email);
    if (!existingUser) {
      const errorResponse = NextResponse.json(
        { success: false, message: 'User not found. Please register first.' },
        { status: 404 }
      );
      
      // Add CORS headers
      errorResponse.headers.set('Access-Control-Allow-Origin', '*');
      errorResponse.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
      errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
      return errorResponse;
    }

    // Validate verification code format
    const isValidCodeFormat = code.length === 6 && /^\d{6}$/.test(code);
    
    if (!isValidCodeFormat) {
      const errorResponse = NextResponse.json(
        { success: false, message: 'Invalid verification code format. Please enter a 6-digit code.' },
        { status: 400 }
      );
      
      // Add CORS headers
      errorResponse.headers.set('Access-Control-Allow-Origin', '*');
      errorResponse.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
      errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
      return errorResponse;
    }

    // Verify the user with the provided code
    const verifiedUser = await userQueries.verifyWithCode(email, code);

    if (!verifiedUser) {
      const errorResponse = NextResponse.json(
        { success: false, message: 'Invalid verification code or code has expired. Please try again.' },
        { status: 400 }
      );
      
      // Add CORS headers
      errorResponse.headers.set('Access-Control-Allow-Origin', '*');
      errorResponse.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
      errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
      return errorResponse;
    }
    
    const response = NextResponse.json({
      success: true,
      message: 'Email verified successfully!',
      user: {
        id: verifiedUser.id,
        email: verifiedUser.email,
        status: verifiedUser.status,
        organizationId: verifiedUser.organizationId,
        verifiedAt: verifiedUser.verifiedAt
      }
    });
    
    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;

  } catch (error) {
    const errorResponse = NextResponse.json(
      { success: false, message: 'Email verification failed. Please try again.' },
      { status: 500 }
    );
    
    // Add CORS headers
    errorResponse.headers.set('Access-Control-Allow-Origin', '*');
    errorResponse.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return errorResponse;
  }
}
