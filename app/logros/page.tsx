import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCollections } from '@/lib/collections'
import { ACHIEVEMENTS } from '@/lib/achievements'
import { loginPathForRedirect, sanitizeRedirectPath } from '@/lib/auth-redirect'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Logros',
  description: 'Consulta los logros desbloqueados y pendientes de tu álbum de stickers.',
  robots: { index: false, follow: false },
}

interface PageProps {
  searchParams: Promise<{ back?: string; collection?: string }>
}

export default async function LogrosPage({ searchParams }: PageProps) {
  const params = await searchParams
  const back = sanitizeRedirectPath(params.back ?? '/')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect(loginPathForRedirect(`/logros?back=${encodeURIComponent(back)}`))

  const collections = await getCollections().catch(() => [])
  const collection = collections.find(item => item.slug === params.collection) ?? collections[0] ?? null
  const { data: unlockedRows } = collection
    ? await (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase as any
    )
      .from('user_achievements')
      .select('achievement_code, unlocked_at')
      .eq('user_id', user.id)
      .eq('collection_id', collection.id)
    : { data: [] }

  const unlockedMap = new Map<string, string>((unlockedRows ?? []).map((row: { achievement_code: string; unlocked_at: string }) => [row.achievement_code, row.unlocked_at]))
  const unlockedCount = ACHIEVEMENTS.filter(achievement => unlockedMap.has(achievement.code)).length

  return (
    <div className="min-h-screen bg-(--bg) text-(--text)">
      <nav className="sticky top-0 z-20 border-b border-(--border) bg-(--bg)/85 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Link href={back} className="flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-medium text-(--muted) transition hover:bg-(--surface) hover:text-(--text)">
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver
          </Link>
          <ThemeToggle />
        </div>
      </nav>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <section className="rounded-3xl border border-(--border) bg-(--surface) p-6 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wide text-(--accent)">Logros</span>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-(--text)">Tus logros</h1>
              <p className="mt-2 text-sm text-(--muted)">
                {collection ? `${collection.name}: ${unlockedCount}/${ACHIEVEMENTS.length} desbloqueados` : 'No hay colecciones disponibles.'}
              </p>
            </div>
            <span className="w-fit rounded-full border border-(--accent)/30 bg-(--accent)/10 px-4 py-2 text-sm font-bold text-(--accent)">
              {Math.round((unlockedCount / ACHIEVEMENTS.length) * 100)}%
            </span>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ACHIEVEMENTS.map(achievement => {
            const unlockedAt = unlockedMap.get(achievement.code)
            const unlocked = Boolean(unlockedAt)

            return (
              <article
                key={achievement.code}
                className={`rounded-3xl border p-5 shadow-sm transition ${
                  unlocked
                    ? 'border-(--accent)/35 bg-(--accent)/10'
                    : 'border-(--border) bg-(--surface) opacity-75'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`grid size-12 shrink-0 place-items-center rounded-2xl ${unlocked ? 'bg-(--accent)/15 text-(--accent)' : 'bg-(--surface-soft) text-(--muted)'}`}>
                    <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={unlocked ? 'M5 13l4 4L19 7' : 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2h-1V7a5 5 0 00-10 0v4H6a2 2 0 00-2 2v6a2 2 0 002 2zm3-10V7a3 3 0 016 0v4'} />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-bold text-(--text)">{achievement.name}</h2>
                    <p className="mt-1 text-sm leading-6 text-(--muted)">{achievement.description}</p>
                    <p className="mt-3 text-xs font-semibold text-(--accent)">
                      {unlockedAt ? `Desbloqueado ${new Date(unlockedAt).toLocaleDateString('es-MX')}` : 'Bloqueado'}
                    </p>
                  </div>
                </div>
              </article>
            )
          })}
        </section>
      </main>
    </div>
  )
}
