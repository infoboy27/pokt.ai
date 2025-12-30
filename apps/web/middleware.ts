import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Define protected routes that require authentication
  const protectedRoutes = [
    '/dashboard',
    '/endpoints', 
    '/usage',
    '/billing',
    '/members',
    '/admin'
  ];
  
  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  // Allow public routes
  const publicRoutes = [
    '/',
    '/login',
    '/register',
    '/api/auth',
    '/api/gateway',
    '/api/rpc',
    '/_next',
    '/favicon.ico'
  ];
  
  // Allow admin endpoints with special header (for internal/admin use)
  const adminKey = request.headers.get('x-admin-key');
  const validAdminKey = process.env.ADMIN_API_KEY || 'dev-admin-key-change-in-production';
  if (pathname.startsWith('/api/admin/') && adminKey === validAdminKey) {
    return NextResponse.next();
  }
  
  const isPublicRoute = publicRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  // If it's a protected route and not a public route, check authentication
  if (isProtectedRoute && !isPublicRoute) {
    // Check for authentication token
    const token = request.cookies.get('auth_token')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      // Redirect to login page
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    // TODO: Validate token with backend
    // For now, we'll allow access if token exists
  }
  
  // Handle RPC proxy requests
  if (pathname.startsWith('/api/rpc/') && pathname !== '/api/rpc/test') {
    // Extract endpoint ID from path
    const pathParts = pathname.split('/');
    const endpointId = pathParts[pathParts.length - 1];
    
    if (endpointId && endpointId !== 'rpc') {
      // Rewrite to gateway with endpoint parameter
      const url = request.nextUrl.clone();
      url.pathname = '/api/gateway';
      url.searchParams.set('endpoint', endpointId);
      
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}









