import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { auditLog } from '@/lib/security/audit'
import { getClientIp } from '@/lib/security/rate-limit'
import type { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const route = 'POST /auth/signout'
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  await supabase.auth.signOut()

  if (user) {
    auditLog('auth.signout', { route, userId: user.id, ip: getClientIp(request) })
  }

  if (request.headers.get('accept')?.includes('application/json')) {
    return NextResponse.json({ ok: true })
  }

  const forwardedProto = request.headers.get('x-forwarded-proto') ?? request.nextUrl.protocol.replace(':', '')
  const forwardedHost = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
  const origin = forwardedHost ? `${forwardedProto}://${forwardedHost}` : request.nextUrl.origin

  return NextResponse.redirect(new URL('/', origin))
}
