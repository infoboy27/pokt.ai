import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const resendVerificationSchema = z.object({
  email: z.string().email('Valid email is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = resendVerificationSchema.parse(body);

    // Proxy to the backend API for resending verification code
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const response = await fetch(`${backendUrl}/auth/resend-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        message: data.message || 'Failed to resend verification code'
      }, { status: response.status });
    }

    return NextResponse.json({
      success: true,
      message: data.message || 'Verification code sent successfully',
      email: data.email
    });

  } catch (error) {
    console.error('Error resending verification code:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      message: 'Failed to resend verification code',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}


