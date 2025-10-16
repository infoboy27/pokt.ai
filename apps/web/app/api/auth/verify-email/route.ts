import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const verifyEmailSchema = z.object({
  email: z.string().email('Valid email is required'),
  code: z.string().length(6, 'Verification code must be 6 digits'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code } = verifyEmailSchema.parse(body);

    // Proxy to the backend API for verification
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const response = await fetch(`${backendUrl}/auth/verify-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, code }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        message: data.message || 'Verification failed'
      }, { status: response.status });
    }

    return NextResponse.json({
      success: true,
      message: data.message || 'Email verified successfully! You can now sign in.',
      user: data.user
    });

  } catch (error) {
    console.error('Error verifying email:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      message: 'Failed to verify email',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}