import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Get the host from the request to determine the correct redirect URL
  const host = request.headers.get('host') || 'localhost:8080';
  const protocol = request.headers.get('x-forwarded-proto') || 'http';
  
  // Redirect to the homepage through the proxy
  const redirectUrl = `${protocol}://${host}/`;
  
  return NextResponse.redirect(redirectUrl);
}
