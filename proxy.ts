import { NextResponse, type NextRequest } from 'next/server'
import { loginPathForRedirect } from '@/lib/auth-redirect'

const protectedPaths = ['/logros', '/perfil']

function hasValidSession(request: NextRequest): boolean {
  // Optimistic check: look for a Supabase auth cookie without making a network call.
  // Real validation happens in each Server Component via supabase.auth.getUser().
  return request.cookies.getAll().some(({ name }) => name.startsWith('sb-') && name.includes('-auth-token'))
}

export function proxy(request: NextRequest) {
  const isProtected = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))

  if (isProtected && !hasValidSession(request)) {
    const url = request.nextUrl.clone()
    const [pathname, search = ''] = loginPathForRedirect(`${request.nextUrl.pathname}${request.nextUrl.search}`).split('?')
    url.pathname = pathname
    url.search = search ? `?${search}` : ''
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
