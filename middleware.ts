import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Initialize cron jobs on first request (development)
  if (process.env.NODE_ENV === 'development' && request.nextUrl.pathname === '/') {
    // This is a simple approach - in production, use a proper cron service
    // or initialize in a separate process
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/',
};
