export type AuditEvent =
  | 'auth.login_failed'
  | 'auth.signup_failed'
  | 'auth.callback_failed'
  | 'auth.signout'
  | 'auth.unauthorized'
  | 'rate_limit.exceeded'
  | 'resource.forbidden'
  | 'mutation.updated'
  | 'mutation.created'
  | 'mutation.deleted'

interface AuditMeta {
  ip?: string
  userId?: string
  route?: string
  reason?: string
  resourceType?: string
  resourceId?: string
}

export function auditLog(event: AuditEvent, meta: AuditMeta = {}) {
  const payload = {
    event,
    at: new Date().toISOString(),
    ...meta,
  }

  if (event.includes('failed') || event.includes('unauthorized') || event.includes('exceeded') || event.includes('forbidden')) {
    console.warn('[audit]', payload)
    return
  }

  console.info('[audit]', payload)
}
