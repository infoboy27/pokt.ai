import { NextRequest, NextResponse } from 'next/server';
import { userQueries, organizationQueries } from '@/lib/database';
import bcrypt from 'bcryptjs';

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

// POST /api/auth/register - Handle user registration
export async function POST(request: NextRequest) {
  try {
    const { name, email, password, company, plan } = await request.json();

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

    // Validate password strength
    if (password.length < 8) {
      const errorResponse = NextResponse.json(
        { success: false, message: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
      
      // Add CORS headers
      errorResponse.headers.set('Access-Control-Allow-Origin', '*');
      errorResponse.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
      errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
      return errorResponse;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      const errorResponse = NextResponse.json(
        { success: false, message: 'Please enter a valid email address' },
        { status: 400 }
      );
      
      // Add CORS headers
      errorResponse.headers.set('Access-Control-Allow-Origin', '*');
      errorResponse.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
      errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
      return errorResponse;
    }

    // Check if user already exists
    const existingUser = await userQueries.findByEmail(email);
    if (existingUser) {
      const errorResponse = NextResponse.json(
        { success: false, message: 'User with this email already exists' },
        { status: 400 }
      );
      
      // Add CORS headers
      errorResponse.headers.set('Access-Control-Allow-Origin', '*');
      errorResponse.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
      errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
      return errorResponse;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = await userQueries.create({
      name,
      email,
      password: hashedPassword,
      company,
      plan: plan || 'starter'
    });

    // Create organization for the user
    const organization = await organizationQueries.create({
      name: company || `${name}'s Organization`,
      plan: plan || 'starter',
      userId: user.id
    });
    
    const response = NextResponse.json({
      success: true,
      message: 'Registration successful! Please check your email for verification.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        company: user.company || 'Personal',
        plan: user.plan,
        organizationId: user.organizationId,
        status: user.status
      }
    });
    
    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;

  } catch (error) {
    const errorResponse = NextResponse.json(
      { success: false, message: 'Registration failed. Please try again.' },
      { status: 500 }
    );
    
    // Add CORS headers
    errorResponse.headers.set('Access-Control-Allow-Origin', '*');
    errorResponse.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return errorResponse;
  }
}
