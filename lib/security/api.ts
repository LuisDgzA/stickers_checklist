import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { auditLog } from './audit'
import { enforceRateLimit, getClientIp, rateLimitRules } from './rate-limit'

const MAX_JSON_BYTES = 16 * 1024

export type EndpointClass =
  | 'public'
  | 'authenticated'
  | 'owner-only'
  | 'admin-only'
  | 'sensitive-auth-flow'
  | 'upload/heavy-operation'

export const endpointRegistry = {
  'GET /auth/callback': 'sensitive-auth-flow',
  'POST /auth/login': 'sensitive-auth-flow',
  'POST /auth/register': 'sensitive-auth-flow',
  'POST /auth/signout': 'public',
} satisfies Record<string, EndpointClass>

export function safeError(message = 'No se pudo completar la solicitud.', status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export function assertAllowedFields(input: Record<string, unknown>, allowed: string[]) {
  const allowedSet = new Set(allowed)
  return Object.keys(input).every(key => allowedSet.has(key))
}

export async function readLimitedJson(request: NextRequest, allowedFields: string[], maxBytes = MAX_JSON_BYTES) {
  const contentType = request.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    return { error: safeError('Solicitud inválida.', 415) }
  }

  const length = Number(request.headers.get('content-length') ?? '0')
  if (length > maxBytes) {
    return { error: safeError('La solicitud es demasiado grande.', 413) }
  }

  try {
    const body = await request.json()
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return { error: safeError('Solicitud inválida.', 400) }
    }
    if (!assertAllowedFields(body as Record<string, unknown>, allowedFields)) {
      return { error: safeError('Solicitud inválida.', 400) }
    }
    return { data: body as Record<string, unknown> }
  } catch {
    return { error: safeError('Solicitud inválida.', 400) }
  }
}

export function normalizeEmail(value: unknown) {
  if (typeof value !== 'string') return null
  const email = value.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return null
  return email
}

export function normalizePassword(value: unknown) {
  if (typeof value !== 'string') return null
  if (value.length < 6 || value.length > 128) return null
  return value
}

export function normalizeNickname(value: unknown) {
  if (typeof value !== 'string') return null
  const nickname = value.trim().toLowerCase()
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(nickname)) return null
  return nickname
}

export async function requireAuthenticatedUser(request: NextRequest, route: string) {
  const globalLimit = enforceRateLimit(request, route, rateLimitRules.globalApi)
  if (globalLimit) return { error: globalLimit }

  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    auditLog('auth.unauthorized', { route, ip: getClientIp(request) })
    return { error: safeError('No autorizado.', 401) }
  }

  return { supabase, user }
}

export async function assertOwnUserResource(userId: string, requestedUserId: string, route: string, resourceType = 'user') {
  if (userId === requestedUserId) return null
  auditLog('resource.forbidden', { route, userId, resourceType, resourceId: requestedUserId })
  return safeError('No autorizado.', 403)
}
