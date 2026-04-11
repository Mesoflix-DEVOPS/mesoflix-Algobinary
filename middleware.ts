import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('derivex_token')?.value
  const { pathname } = request.nextUrl

  // Check if the path is part of the protected dashboard route group
  // paths: /dashboard, /activity, /leaderboard, /news, /tool/[id], /settings
  const protectedPaths = [
    '/dashboard',
    '/activity',
    '/leaderboard',
    '/news',
    '/tool',
    '/settings',
    '/history'
  ]

  const isProtectedRoute = protectedPaths.some(path => pathname.startsWith(path))

  if (isProtectedRoute && !token) {
    const url = new URL('/login', request.url)
    // Optional: add a redirect parameter to return after login
    // url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  // If already logged in, don't allow access to login page
  if (pathname === '/login' && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
