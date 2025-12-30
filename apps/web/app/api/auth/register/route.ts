import { NextRequest, NextResponse } from 'next/server';

// OPTIONS /api/auth/register - Handle CORS preflight
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

// POST /api/auth/register - Proxy to backend API
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, company, plan } = body;

    // Validate required fields
    if (!name || !email || !password) {
      const errorResponse = NextResponse.json(
        { success: false, message: 'Name, email, and password are required' },
        { status: 400 }
      );
      
      // Add CORS headers
      errorResponse.headers.set('Access-Control-Allow-Origin', '*');
      errorResponse.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
      errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
      return errorResponse;
    }

    // Proxy to the backend API for registration (which includes email sending)
    // Use internal Docker network URL to avoid Traefik routing issues
    // Note: Using IP address directly due to DNS resolution issues in Next.js runtime
    const backendUrl = process.env.INTERNAL_API_URL?.replace('api:3001', '172.20.0.7:3001') || 'http://172.20.0.7:3001/api';
    console.log('[REGISTER] Calling backend API:', `${backendUrl}/auth/register`);
    
    const backendResponse = await fetch(`${backendUrl}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password, company, plan }),
    });

    const data = await backendResponse.json();
    console.log('[REGISTER] Backend response:', data);

    if (!backendResponse.ok) {
      const errorResponse = NextResponse.json(
        { 
          success: false, 
          message: data.message || 'Registration failed' 
        },
        { status: backendResponse.status }
      );
      
      // Add CORS headers
      errorResponse.headers.set('Access-Control-Allow-Origin', '*');
      errorResponse.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
      errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
      return errorResponse;
    }

    const response = NextResponse.json({
      success: true,
      message: data.message || 'Registration successful! Please check your email for verification.',
      email: data.email
    });
    
    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;

  } catch (error) {
    console.error('[REGISTER] Error:', error);
    const errorResponse = NextResponse.json(
      { 
        success: false, 
        message: 'Registration failed. Please try again.',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
    
    // Add CORS headers
    errorResponse.headers.set('Access-Control-Allow-Origin', '*');
    errorResponse.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return errorResponse;
  }
}
