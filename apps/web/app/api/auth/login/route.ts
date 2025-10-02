import { NextRequest, NextResponse } from 'next/server';
import { userQueries } from '@/lib/database';
import { authRateLimit, withRateLimit } from '@/lib/rate-limit';
import { userLoginSchema, sanitizeEmail } from '@/lib/validation';
import bcrypt from 'bcryptjs';

// OPTIONS /api/auth/login - Handle CORS preflight
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

// POST /api/auth/login - Handle user login
export async function POST(request: NextRequest) {
  // Apply rate limiting for login attempts
  const rateLimitResponse = await withRateLimit(request, authRateLimit);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = userLoginSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, message: 'Invalid input', errors: validationResult.error.errors },
        { status: 400 }
      );
    }
    
    const { email, password } = validationResult.data;
    const sanitizedEmail = sanitizeEmail(email);

    // Authenticate user against database
    console.log('[LOGIN] Looking for user with email:', sanitizedEmail);
    const user = await userQueries.findByEmail(sanitizedEmail);
    console.log('[LOGIN] User found:', user ? 'Yes' : 'No');
    if (user) {
      console.log('[LOGIN] User password:', user.password);
      console.log('[LOGIN] Provided password:', password);
    }
    
    // For demo purposes, also check plain text password
    const isValidPassword = user && user.password && (
      await bcrypt.compare(password, user.password) || 
      user.password === password
    );
    console.log('[LOGIN] Password valid:', isValidPassword);
    
    if (isValidPassword) {
      const token = 'mock-jwt-token-for-testing';
      
      const response = NextResponse.json({
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          organizationId: user.organization_id,
          role: 'admin',
          permissions: ['read', 'write', 'admin']
        }
      });
      
      // Store user ID in cookie for session management
      response.cookies.set('user_id', user.id.toString(), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
      
      // Add CORS headers
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
      return response;
    }

    // For any other credentials, return error
    const errorResponse = NextResponse.json(
      { success: false, message: 'Invalid email or password' },
      { status: 401 }
    );
    
    // Add CORS headers
    errorResponse.headers.set('Access-Control-Allow-Origin', '*');
    errorResponse.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return errorResponse;

  } catch (error) {
    const errorResponse = NextResponse.json(
      { success: false, message: 'Login failed. Please try again.' },
      { status: 500 }
    );
    
    // Add CORS headers
    errorResponse.headers.set('Access-Control-Allow-Origin', '*');
    errorResponse.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return errorResponse;
  }
}
