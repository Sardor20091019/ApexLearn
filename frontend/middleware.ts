import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function isJwtExpired(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return true;
    const rawPayload = Buffer.from(parts[1], 'base64').toString('utf-8');
    const payload = JSON.parse(rawPayload);
    if (!payload.exp) return false;
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect sensitive endpoints: dashboard, instructor, admin, and classroom player
  const isProtected =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/instructor') ||
    pathname.startsWith('/admin') ||
    (pathname.startsWith('/courses/') && pathname.endsWith('/learn'));

  if (isProtected) {
    const token =
      request.cookies.get('accessToken')?.value ||
      request.cookies.get('access_token')?.value;

    if (!token || isJwtExpired(token)) {
      const loginUrl = new URL('/auth', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/instructor/:path*',
    '/admin/:path*',
    '/courses/:path*/learn',
  ],
};
