const DEFAULT_REDIRECT = '/'

export function sanitizeRedirectPath(value: string | null | undefined): string {
  if (!value) return DEFAULT_REDIRECT

  try {
    const decoded = decodeURIComponent(value)
    if (!decoded.startsWith('/') || decoded.startsWith('//')) return DEFAULT_REDIRECT
    if (decoded.includes('\\')) return DEFAULT_REDIRECT

    const url = new URL(decoded, 'http://internal.local')
    if (url.origin !== 'http://internal.local') return DEFAULT_REDIRECT
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return DEFAULT_REDIRECT
  }
}

export function loginPathForRedirect(path: string | null | undefined): string {
  const next = sanitizeRedirectPath(path)
  return `/login?next=${encodeURIComponent(next)}`
}
