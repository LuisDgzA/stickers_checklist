import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sanitizeRedirectPath } from '@/lib/auth-redirect'
import { auditLog } from '@/lib/security/audit'
import { enforceRateLimit, getClientIp, rateLimitRules } from '@/lib/security/rate-limit'
import type { NextRequest } from 'next/server'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function upsertProfile(supabase: any, request: NextRequest, route: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const nickname = user.user_metadata?.nickname as string | undefined
  const fullName = user.user_metadata?.full_name as string | undefined
  const avatarUrl = user.user_metadata?.avatar_url as string | undefined
  const { error: upsertError } = await supabase.from('profiles').upsert({
    id: user.id,
    email: user.email ?? null,
    ...(fullName ? { full_name: fullName } : {}),
    ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
    ...(nickname ? { nickname } : {}),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'id', ignoreDuplicates: false })
  if (upsertError) {
    auditLog('auth.callback_failed', { route, ip: getClientIp(request), reason: upsertError.message })
  }
}

export async function GET(request: NextRequest) {
  const route = 'GET /auth/callback'
  const rateLimit = enforceRateLimit(request, route, rateLimitRules.auth)
  if (rateLimit) return rateLimit

  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = sanitizeRedirectPath(searchParams.get('next'))

  // In PM2/nginx setups request.url contains the internal host (localhost:3000).
  // Reconstruct the public origin from forwarded headers set by the reverse proxy.
  const proto = request.headers.get('x-forwarded-proto') ?? 'https'
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? new URL(request.url).host
  const origin = `${proto}://${host}`

  const supabase = await createClient()

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      await upsertProfile(supabase, request, route)
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  if (token_hash && type) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.auth.verifyOtp({ token_hash, type: type as any })
    if (!error) {
      await upsertProfile(supabase, request, route)
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  auditLog('auth.callback_failed', { route, ip: getClientIp(request), reason: 'exchange_failed' })
  return NextResponse.redirect(`${origin}/login?error=auth_error`)
}
