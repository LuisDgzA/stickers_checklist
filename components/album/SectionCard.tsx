'use client'

import { useMemo, useState } from 'react'
import { StickerCard } from './StickerCard'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { filterStickers, searchStickers, sortStickersForDisplay } from '@/lib/progress'
import type { Section, StickerWithQuantity, StickerFilter } from '@/types/album'

interface SectionCardProps {
  section: Section
  stickers: StickerWithQuantity[]
  filter: StickerFilter
  searchQuery: string
  onIncrement: (stickerId: string) => void
  onDecrement: (stickerId: string) => void
  updatingIds: Set<string>
}

function deriveBadgeCode(slug: string): string {
  if (slug.includes('-')) return slug.split('-').map(w => w[0].toUpperCase()).join('')
  return slug.toUpperCase().slice(0, 3)
}

export function SectionCard({
  section, stickers, filter, searchQuery, onIncrement, onDecrement, updatingIds
}: SectionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const total = stickers.length
  const obtained = stickers.filter(s => s.quantity >= 1).length
  const percentage = total === 0 ? 0 : Math.round((obtained / total) * 100)
  const isComplete = total > 0 && obtained === total

  const visibleStickers = useMemo(() => {
    let result = filterStickers(stickers, filter)
    result = searchStickers(result, searchQuery)
    return sortStickersForDisplay(result)
  }, [stickers, filter, searchQuery])

  if (visibleStickers.length === 0 && (filter !== 'all' || searchQuery.trim())) return null

  const badgeCode = deriveBadgeCode(section.slug)

  return (
    <article className="overflow-hidden rounded-3xl border border-(--border) bg-(--surface) shadow-sm transition hover:border-(--accent)/30 hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-black/20">
      <button
        className="w-full p-4 text-left transition hover:bg-(--surface-hover) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-(--focus) sm:p-5"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="grid size-11 shrink-0 place-items-center rounded-2xl border border-(--border) bg-(--surface-soft)">
              <span className="font-mono text-sm font-bold text-(--text)">{badgeCode}</span>
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-base font-semibold tracking-tight text-(--text)">{section.name}</h3>
                {isComplete && (
                  <span className="rounded-full border border-(--accent)/30 bg-(--accent)/15 px-2.5 py-1 text-xs font-semibold text-(--accent)">
                    Completo
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-(--muted)">
                {obtained}/{total} elementos · {percentage}%
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <div className="hidden min-w-24 sm:block">
              <ProgressBar percentage={percentage} />
            </div>
            <svg
              className={`size-5 text-(--muted) transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </button>

      <div className="px-4 pb-3 sm:hidden">
        <ProgressBar percentage={percentage} />
      </div>

      {isExpanded && (
        <div className="border-t border-(--border) bg-(--surface-soft)/60 px-4 pb-4 pt-4 sm:px-5">
          {visibleStickers.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-(--border) bg-(--surface) py-8 text-center text-sm text-(--muted)">
              No hay elementos con este filtro.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 min-[420px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
              {visibleStickers.map(sticker => (
                <StickerCard
                  key={sticker.id}
                  sticker={sticker}
                  onIncrement={onIncrement}
                  onDecrement={onDecrement}
                  isUpdating={updatingIds.has(sticker.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  )
}
