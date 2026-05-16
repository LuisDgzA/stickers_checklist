# Endpoint Security Classification

Route handlers in this app:

| Endpoint | Classification | Controls |
| --- | --- | --- |
| `GET /auth/callback` | `sensitive-auth-flow` | Auth-flow rate limit, sanitized redirect, generic failure redirect, audit log on failed exchange. |
| `POST /auth/login` | `sensitive-auth-flow` | Global IP rate limit, strict auth IP rate limit, JSON payload limit, input allowlist, generic auth error, failed-login audit log. |
| `POST /auth/register` | `sensitive-auth-flow` | Global IP rate limit, strict auth IP rate limit, JSON payload limit, input allowlist, nickname/password/email validation, generic signup error, audit log. |
| `POST /auth/signout` | `authenticated` | Requires valid Supabase session, global IP rate limit, audit log. |

Current non-route data access is handled through Supabase client/server helpers and remains protected by Supabase RLS. Owner-only writes use `auth.uid()` policies and server actions validate authenticated user identity before updates.

Reusable security modules:

- `lib/security/rate-limit.ts`: in-memory rate limit buckets for global, auth, mutation, and heavy-operation limits.
- `lib/security/api.ts`: JSON body limits, allowlisted fields, input normalization, authenticated-user helper, safe errors.
- `lib/security/audit.ts`: structured security/audit console events.

Notes:

- This implementation is suitable as an app-level guard. For multi-instance production deployments, move rate limit buckets to shared storage such as Redis or a platform-native edge rate limiter.
- No upload/heavy-operation route exists yet. The `heavy` limiter is defined for future upload or bulk-processing endpoints.
