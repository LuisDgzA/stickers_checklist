'use client'

import { useState } from 'react'
import { ProgressBar } from '@/components/ui/ProgressBar'

interface AchievementItem {
  code: string
  name: string
  description: string
  unlockedAt: string | null
}

interface CollectionAchievementsItem {
  id: string
  name: string
  unlockedCount: number
  totalCount: number
  progressPercentage: number
  achievements: AchievementItem[]
}

interface AchievementsAccordionProps {
  items: CollectionAchievementsItem[]
  initialCollectionId?: string | null
}

export function AchievementsAccordion({ items, initialCollectionId }: AchievementsAccordionProps) {
  const [openCollectionId, setOpenCollectionId] = useState<string | null>(initialCollectionId ?? items[0]?.id ?? null)

  return (
    <div className="space-y-4">
      {items.map(item => {
        const isExpanded = item.id === openCollectionId

        return (
          <article
            key={item.id}
            className="overflow-hidden rounded-3xl border border-(--border) bg-(--surface) shadow-sm transition hover:border-(--border-hover) hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-black/20"
          >
            <button
              className="w-full p-4 text-left transition hover:bg-(--surface-hover) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-(--focus) sm:p-5"
              onClick={() => setOpenCollectionId(current => current === item.id ? null : item.id)}
              aria-expanded={isExpanded}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-xl font-bold tracking-tight text-(--text)">{item.name}</h2>
                    {item.progressPercentage === 100 && (
                      <span className="rounded-full border border-(--primary)/20 bg-(--primary)/8 px-2.5 py-1 text-xs font-semibold text-(--primary)">
                        Completa
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-(--muted)">
                    {item.unlockedCount}/{item.totalCount} logros desbloqueados
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="hidden rounded-full border border-(--border) bg-(--surface-soft) px-4 py-2 text-sm font-bold text-(--text) sm:inline-flex">
                    {item.progressPercentage}%
                  </span>
                  <svg
                    className={`size-5 text-(--muted) transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </button>

            <div className="px-4 pb-3 sm:hidden">
              <ProgressBar percentage={item.progressPercentage} />
            </div>

            {isExpanded && (
              <div className="border-t border-(--border) bg-(--surface-soft)/60 px-4 pb-4 pt-4 sm:px-5">
                <div className="mb-4 hidden sm:block">
                  <ProgressBar percentage={item.progressPercentage} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {item.achievements.map(achievement => {
                    const unlocked = Boolean(achievement.unlockedAt)

                    return (
                      <article
                        key={achievement.code}
                        className={`rounded-3xl border p-5 shadow-sm transition ${
                          unlocked
                            ? 'border-(--primary)/20 bg-(--primary)/6'
                            : 'border-(--border) bg-(--surface) opacity-75'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`grid size-12 shrink-0 place-items-center rounded-2xl ${unlocked ? 'bg-(--primary)/10 text-(--primary)' : 'bg-(--surface-soft) text-(--muted)'}`}>
                            <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={unlocked ? 'M5 13l4 4L19 7' : 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2h-1V7a5 5 0 00-10 0v4H6a2 2 0 00-2 2v6a2 2 0 002 2zm3-10V7a3 3 0 016 0v4'} />
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-(--text)">{achievement.name}</h3>
                            <p className="mt-1 text-sm leading-6 text-(--muted)">{achievement.description}</p>
                            <p className={`mt-3 text-xs font-semibold ${unlocked ? 'text-(--primary)' : 'text-(--muted)'}`}>
                              {achievement.unlockedAt ? `Desbloqueado ${new Date(achievement.unlockedAt).toLocaleDateString('es-MX')}` : 'Bloqueado'}
                            </p>
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>
              </div>
            )}
          </article>
        )
      })}
    </div>
  )
}
