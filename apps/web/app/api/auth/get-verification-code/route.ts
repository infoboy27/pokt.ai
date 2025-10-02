import { NextRequest, NextResponse } from 'next/server';
import { userQueries } from '@/lib/database';

// OPTIONS /api/auth/get-verification-code - Handle CORS preflight
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

// POST /api/auth/get-verification-code - Get verification code for user
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      const errorResponse = NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      );
      
      // Add CORS headers
      errorResponse.headers.set('Access-Control-Allow-Origin', '*');
      errorResponse.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
      errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
      return errorResponse;
    }

    // Get verification code from database
    const verificationData = await userQueries.getVerificationCode(email);
    
    if (!verificationData) {
      const errorResponse = NextResponse.json(
        { success: false, message: 'User not found or no verification code available' },
        { status: 404 }
      );
      
      // Add CORS headers
      errorResponse.headers.set('Access-Control-Allow-Origin', '*');
      errorResponse.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
      errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
      return errorResponse;
    }

    const isExpired = new Date() > new Date(verificationData.verification_code_expires_at);
    
    if (isExpired) {
      const errorResponse = NextResponse.json(
        { success: false, message: 'Verification code has expired' },
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
      verificationCode: verificationData.verification_code,
      expiresAt: verificationData.verification_code_expires_at
    });
    
    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;

  } catch (error) {
    const errorResponse = NextResponse.json(
      { success: false, message: 'Failed to get verification code. Please try again.' },
      { status: 500 }
    );
    
    // Add CORS headers
    errorResponse.headers.set('Access-Control-Allow-Origin', '*');
    errorResponse.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return errorResponse;
  }
}

