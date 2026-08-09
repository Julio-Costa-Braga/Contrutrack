// web/middleware.ts
import { NextResponse, type NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const cookieHeader = request.headers.get('cookie') || ''
  const hasSupabaseCookie = cookieHeader.includes('sb-access-token') || cookieHeader.includes('auth-token')
  const pathname = request.nextUrl.pathname

  const isPublicRoute = pathname.startsWith('/onboarding') ||
                        pathname.startsWith('/convite') ||
                        pathname.startsWith('/auth') ||
                        pathname === '/login' ||
                        pathname.startsWith('/api/')

  if (!hasSupabaseCookie && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (hasSupabaseCookie && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}