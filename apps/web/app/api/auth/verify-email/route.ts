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
    // Use INTERNAL_API_URL for Docker network communication
    // Note: Using IP address directly due to DNS resolution issues in Next.js runtime
    const backendUrl = process.env.INTERNAL_API_URL?.replace('api:3001', '172.20.0.7:3001') || 'http://172.20.0.7:3001/api';
    
    console.log('[VERIFY EMAIL] Using backend URL:', backendUrl);
    console.log('[VERIFY EMAIL] Verifying email:', email, 'code:', code.substring(0, 2) + '****');
    
    // Use AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      const response = await fetch(`${backendUrl}/auth/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      console.log('[VERIFY EMAIL] Response status:', response.status);

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
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error('[VERIFY EMAIL] Fetch error:', fetchError);
      throw fetchError;
    }

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