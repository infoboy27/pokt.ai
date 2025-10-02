import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Debug logging
  console.log(`[MIDDLEWARE] Processing: ${pathname}`);
  
  // Define protected routes that require authentication
  const protectedRoutes = [
    '/dashboard',
    '/endpoints', 
    '/usage',
    '/billing',
    '/settings',
    '/members',
    '/admin'
  ];
  
  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  console.log(`[MIDDLEWARE] Is protected route: ${isProtectedRoute}`);
  
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
  
  const isPublicRoute = publicRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  console.log(`[MIDDLEWARE] Is public route: ${isPublicRoute}`);
  
  // If it's a protected route and not a public route, check authentication
  if (isProtectedRoute && !isPublicRoute) {
    console.log(`[MIDDLEWARE] Checking authentication for: ${pathname}`);
    
    // Check for authentication token
    const token = request.cookies.get('auth_token')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '');
    
    console.log(`[MIDDLEWARE] Token found: ${!!token}`);
    
    if (!token) {
      console.log(`[MIDDLEWARE] No token, redirecting to login`);
      // Redirect to login page
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    console.log(`[MIDDLEWARE] Token found, allowing access`);
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









