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
    // Use INTERNAL_API_URL for Docker network communication
    // Note: Using IP address directly due to DNS resolution issues in Next.js runtime
    // The API container IP on backend network is 172.20.0.7
    // TODO: Fix DNS resolution or use service discovery
    const backendUrl = process.env.INTERNAL_API_URL?.replace('api:3001', '172.20.0.7:3001') || 'http://172.20.0.7:3001/api';
    
    console.log('[RESEND VERIFICATION] Using backend URL:', backendUrl);
    console.log('[RESEND VERIFICATION] Sending request for email:', email);
    
    // Use AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      const response = await fetch(`${backendUrl}/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      console.log('[RESEND VERIFICATION] Response status:', response.status);
      
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
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error('[RESEND VERIFICATION] Fetch error:', fetchError);
      throw fetchError;
    }

  } catch (error) {
    console.error('[RESEND VERIFICATION] Error resending verification code:', error);
    console.error('[RESEND VERIFICATION] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      cause: error instanceof Error ? (error as any).cause : undefined,
    });
    
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
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error && (error as any).cause ? String((error as any).cause) : undefined,
    }, { status: 500 });
  }
}


