import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { auditLog } from '@/lib/security/audit'
import { enforceRateLimit, getClientIp, rateLimitRules } from '@/lib/security/rate-limit'
import { normalizeEmail, normalizeNickname, normalizePassword, readLimitedJson, safeError } from '@/lib/security/api'

export async function POST(request: NextRequest) {
  const route = 'POST /auth/register'
  const globalLimit = enforceRateLimit(request, route, rateLimitRules.globalApi)
  if (globalLimit) return globalLimit
  const authLimit = enforceRateLimit(request, route, rateLimitRules.auth)
  if (authLimit) return authLimit

  const parsed = await readLimitedJson(request, ['email', 'password', 'nickname'])
  if (parsed.error) return parsed.error

  const email = normalizeEmail(parsed.data.email)
  const password = normalizePassword(parsed.data.password)
  const nickname = normalizeNickname(parsed.data.nickname)
  if (!email || !password || !nickname) {
    auditLog('auth.signup_failed', { route, ip: getClientIp(request), reason: 'invalid_input' })
    return safeError('No se pudo crear la cuenta.', 400)
  }

  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: available, error: nicknameError } = await (supabase as any).rpc('check_nickname_available', { p_nickname: nickname })
  if (nicknameError || !available) {
    auditLog('auth.signup_failed', { route, ip: getClientIp(request), reason: 'nickname_unavailable' })
    return safeError('No se pudo crear la cuenta.', 400)
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { nickname },
    },
  })

  if (error) {
    auditLog('auth.signup_failed', { route, ip: getClientIp(request), reason: 'provider_error' })
    return safeError('No se pudo crear la cuenta.', 400)
  }

  auditLog('mutation.created', { route, ip: getClientIp(request), resourceType: 'auth_user' })
  return NextResponse.json({ ok: true })
}
