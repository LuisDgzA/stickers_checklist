import { NextResponse, type NextRequest } from 'next/server'
import { auditLog } from './audit'

interface Bucket {
  count: number
  resetAt: number
}

export interface RateLimitRule {
  name: string
  limit: number
  windowMs: number
}

const buckets = new Map<string, Bucket>()

export const rateLimitRules = {
  globalApi: { name: 'global-api', limit: 120, windowMs: 60_000 },
  auth: { name: 'auth-sensitive', limit: 8, windowMs: 60_000 },
  mutation: { name: 'mutation', limit: 60, windowMs: 60_000 },
  heavy: { name: 'heavy-operation', limit: 10, windowMs: 60_000 },
} satisfies Record<string, RateLimitRule>

export function getClientIp(request: Request | NextRequest): string {
  const headers = request.headers
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    headers.get('cf-connecting-ip') ||
    'unknown'
  )
}

export function checkRateLimit(key: string, rule: RateLimitRule) {
  const now = Date.now()
  const bucketKey = `${rule.name}:${key}`
  const bucket = buckets.get(bucketKey)

  if (!bucket || bucket.resetAt <= now) {
    const next = { count: 1, resetAt: now + rule.windowMs }
    buckets.set(bucketKey, next)
    return { allowed: true, remaining: rule.limit - 1, resetAt: next.resetAt }
  }

  if (bucket.count >= rule.limit) {
    return { allowed: false, remaining: 0, resetAt: bucket.resetAt }
  }

  bucket.count += 1
  return { allowed: true, remaining: rule.limit - bucket.count, resetAt: bucket.resetAt }
}

export function rateLimitResponse(route: string, ip: string, rule: RateLimitRule, resetAt: number) {
  auditLog('rate_limit.exceeded', { route, ip, reason: rule.name })
  return NextResponse.json(
    { error: 'Demasiados intentos. Intenta de nuevo más tarde.' },
    {
      status: 429,
      headers: {
        'Retry-After': String(Math.max(1, Math.ceil((resetAt - Date.now()) / 1000))),
      },
    }
  )
}

export function enforceRateLimit(request: Request | NextRequest, route: string, rule: RateLimitRule, key?: string) {
  const ip = getClientIp(request)
  const result = checkRateLimit(key ?? ip, rule)
  if (!result.allowed) return rateLimitResponse(route, ip, rule, result.resetAt)
  return null
}
