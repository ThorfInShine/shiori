import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Admin dashboard requires admin_session
  if (pathname.startsWith('/admin/dashboard')) {
    if (!request.cookies.get('admin_session')?.value) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
  }

  // User order requires division_session
  if (pathname.startsWith('/user/order')) {
    if (!request.cookies.get('division_session')?.value) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
  }

  // Admin-only APIs require admin_session
  if (
    pathname.startsWith('/api/orders') ||
    pathname.startsWith('/api/admin/accounts')
  ) {
    if (!request.cookies.get('admin_session')?.value) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/dashboard/:path*',
    '/user/order/:path*',
    '/api/orders/:path*',
    '/api/admin/accounts/:path*',
  ],
}
