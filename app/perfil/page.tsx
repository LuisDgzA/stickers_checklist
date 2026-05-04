import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { loginPathForRedirect, sanitizeRedirectPath } from '@/lib/auth-redirect'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { updateProfileAction } from './actions'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Perfil',
  description: 'Edita tu nombre y nickname para tus álbumes compartidos.',
  robots: { index: false, follow: false },
}

interface PageProps {
  searchParams: Promise<{ back?: string; saved?: string }>
}

export default async function PerfilPage({ searchParams }: PageProps) {
  const params = await searchParams
  const back = sanitizeRedirectPath(params.back ?? '/')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect(loginPathForRedirect(`/perfil?back=${encodeURIComponent(back)}`))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('full_name, nickname, email')
    .eq('id', user.id)
    .single()

  const displayName = profile?.nickname ? `@${profile.nickname}` : profile?.full_name || user.email || 'Tu perfil'

  return (
    <div className="min-h-screen bg-(--bg) text-(--text)">
      <nav className="sticky top-0 z-20 border-b border-(--border) bg-(--bg)/85 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          <Link href={back} className="flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-medium text-(--muted) transition hover:bg-(--surface) hover:text-(--text)">
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver
          </Link>
          <ThemeToggle />
        </div>
      </nav>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <section className="rounded-3xl border border-(--border) bg-(--surface) p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-2 border-b border-(--border) pb-6">
            <span className="text-xs font-semibold uppercase tracking-wide text-(--accent)">Perfil</span>
            <h1 className="text-3xl font-bold tracking-tight text-(--text)">{displayName}</h1>
            <p className="text-sm text-(--muted)">{user.email}</p>
          </div>

          <form action={updateProfileAction} className="mt-6 max-w-lg space-y-4">
            <input type="hidden" name="back" value="/perfil" />
            <label className="block">
              <span className="text-sm font-semibold text-(--text)">Correo</span>
              <input
                value={user.email ?? profile?.email ?? ''}
                readOnly
                className="mt-2 h-12 w-full rounded-2xl border border-(--border) bg-(--surface-soft) px-4 text-sm text-(--muted)"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-(--text)">Nombre</span>
              <input
                name="full_name"
                defaultValue={profile?.full_name ?? ''}
                required
                maxLength={80}
                className="mt-2 h-12 w-full rounded-2xl border border-(--border) bg-(--surface-soft) px-4 text-sm text-(--text) placeholder-(--muted) transition focus:border-(--accent) focus:outline-none focus:ring-2 focus:ring-(--accent)/20"
                placeholder="Tu nombre"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-(--text)">Nickname</span>
              <input
                name="nickname"
                defaultValue={profile?.nickname ?? ''}
                required
                minLength={3}
                maxLength={20}
                pattern="[A-Za-z0-9_]+"
                className="mt-2 h-12 w-full rounded-2xl border border-(--border) bg-(--surface-soft) px-4 text-sm text-(--text) placeholder-(--muted) transition focus:border-(--accent) focus:outline-none focus:ring-2 focus:ring-(--accent)/20"
                placeholder="tu_nickname"
              />
              <span className="mt-1 block text-xs text-(--muted)">3-20 caracteres, solo letras, números y _.</span>
            </label>
            {params.saved === '1' && (
              <p className="rounded-2xl border border-(--accent)/30 bg-(--accent)/10 px-4 py-3 text-sm font-semibold text-(--accent)">
                Perfil actualizado.
              </p>
            )}
            {params.saved === '0' && (
              <p className="rounded-2xl border border-(--primary)/30 bg-(--primary)/10 px-4 py-3 text-sm font-semibold text-(--primary)">
                No se pudo guardar el perfil.
              </p>
            )}
            <button className="rounded-2xl bg-(--primary) px-5 py-3 text-sm font-semibold text-white transition hover:bg-(--primary-hover) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus)">
              Guardar perfil
            </button>
          </form>
        </section>
      </main>
    </div>
  )
}
