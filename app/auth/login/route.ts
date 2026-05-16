import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { auditLog } from '@/lib/security/audit'
import { enforceRateLimit, getClientIp, rateLimitRules } from '@/lib/security/rate-limit'
import { normalizeEmail, normalizePassword, readLimitedJson, safeError } from '@/lib/security/api'

export async function POST(request: NextRequest) {
  const route = 'POST /auth/login'
  const globalLimit = enforceRateLimit(request, route, rateLimitRules.globalApi)
  if (globalLimit) return globalLimit
  const authLimit = enforceRateLimit(request, route, rateLimitRules.auth)
  if (authLimit) return authLimit

  const parsed = await readLimitedJson(request, ['email', 'password'])
  if (parsed.error) return parsed.error

  const email = normalizeEmail(parsed.data.email)
  const password = normalizePassword(parsed.data.password)
  if (!email || !password) {
    auditLog('auth.login_failed', { route, ip: getClientIp(request), reason: 'invalid_input' })
    return safeError('Correo o contraseña incorrectos.', 401)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    auditLog('auth.login_failed', { route, ip: getClientIp(request), reason: 'invalid_credentials' })
    return safeError('Correo o contraseña incorrectos.', 401)
  }

  return NextResponse.json({ ok: true })
}
