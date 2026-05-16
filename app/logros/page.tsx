import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCollections } from '@/lib/collections'
import { getAchievementsForCollection } from '@/lib/achievements'
import { loginPathForRedirect, sanitizeRedirectPath } from '@/lib/auth-redirect'
import { AchievementsAccordion } from '@/components/progress/AchievementsAccordion'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Logros',
  description: 'Consulta los logros desbloqueados y pendientes de tus colecciones.',
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
  const { data: unlockedRows } = collections.length > 0
    ? await (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase as any
    )
      .from('user_achievements')
      .select('collection_id, achievement_code, unlocked_at')
      .eq('user_id', user.id)
    : { data: [] }

  const unlockedByCollection = new Map<string, Map<string, string>>()

  for (const row of (unlockedRows ?? []) as { collection_id: string; achievement_code: string; unlocked_at: string }[]) {
    const collectionAchievements = unlockedByCollection.get(row.collection_id) ?? new Map<string, string>()
    collectionAchievements.set(row.achievement_code, row.unlocked_at)
    unlockedByCollection.set(row.collection_id, collectionAchievements)
  }

  const collectionItems = collections.map(collection => {
    const availableAchievements = getAchievementsForCollection(collection.slug)
    const unlockedMap = unlockedByCollection.get(collection.id) ?? new Map<string, string>()
    const unlockedCount = availableAchievements.filter(achievement => unlockedMap.has(achievement.code)).length
    const progressPercentage = availableAchievements.length > 0 ? Math.round((unlockedCount / availableAchievements.length) * 100) : 0

    return {
      id: collection.id,
      slug: collection.slug,
      name: collection.name,
      unlockedCount,
      totalCount: availableAchievements.length,
      progressPercentage,
      achievements: availableAchievements.map(achievement => ({
        code: achievement.code,
        title: achievement.title,
        description: achievement.description,
        unlockedAt: unlockedMap.get(achievement.code) ?? null,
      })),
    }
  })

  const initialCollectionId = collectionItems.find(item => item.slug === params.collection)?.id ?? collectionItems[0]?.id ?? null

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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-(--text)">Tus logros</h1>
              <p className="mt-2 text-sm text-(--muted)">
                Revisa tu avance por colección y expande cada una para ver sus logros desbloqueados y pendientes.
              </p>
            </div>
            <span className="w-fit rounded-full border border-(--border) bg-(--surface-soft) px-4 py-2 text-sm font-bold text-(--text)">
              {collectionItems.length} {collectionItems.length === 1 ? 'colección' : 'colecciones'}
            </span>
          </div>
        </section>

        {collectionItems.length === 0 ? (
          <section className="rounded-3xl border border-dashed border-(--border) bg-(--surface-soft) px-6 py-14 text-center shadow-sm">
            <h2 className="text-base font-semibold text-(--text)">No hay colecciones disponibles</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-(--muted)">
              Cuando agregues colecciones activas aparecerán aquí con sus logros correspondientes.
            </p>
          </section>
        ) : (
          <AchievementsAccordion items={collectionItems} initialCollectionId={initialCollectionId} />
        )}
      </main>
    </div>
  )
}
