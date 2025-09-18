import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  return NextResponse.json({
    message: 'RPC proxy test endpoint working!',
    timestamp: new Date().toISOString(),
  });
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'RPC proxy test endpoint working!',
    timestamp: new Date().toISOString(),
  });
}



