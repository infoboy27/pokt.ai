import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Handle RPC proxy requests
  if (request.nextUrl.pathname.startsWith('/api/rpc/') && request.nextUrl.pathname !== '/api/rpc/test') {
    // Extract endpoint ID from path
    const pathParts = request.nextUrl.pathname.split('/');
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



