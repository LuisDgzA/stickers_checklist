'use client'

import { useMemo, useState } from 'react'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { FLAG_ICONS } from '@/lib/flags'
import type { Section, StickerWithQuantity, StickerFilter } from '@/types/album'

const RARITIES = ['REG', 'BRO', 'SIL', 'ORO'] as const
type Rarity = typeof RARITIES[number]

const RARITY_ACTIVE: Record<Rarity, string> = {
  REG: 'border-rose-400   bg-rose-400/10   text-rose-400',
  BRO: 'border-amber-600  bg-amber-600/10  text-amber-600',
  SIL: 'border-slate-400  bg-slate-400/10  text-slate-400',
  ORO: 'border-yellow-400 bg-yellow-400/10 text-yellow-400',
}

interface PlayerGroup {
  key: string
  playerName: string
  countryCode: string
  stickers: Map<Rarity, StickerWithQuantity>
}

function parsePlayerName(name: string | null): { playerName: string; countryCode: string } {
  if (!name) return { playerName: '', countryCode: '' }
  const [playerName = '', countryCode = ''] = name.split('|')
  return { playerName, countryCode }
}

function getRarity(code: string): Rarity | null {
  const suffix = code.split('-').pop() as Rarity
  return (RARITIES as readonly string[]).includes(suffix) ? suffix : null
}

function groupByPlayer(stickers: StickerWithQuantity[]): PlayerGroup[] {
  const map = new Map<string, PlayerGroup>()
  for (const s of stickers) {
    const parts = s.code.split('-')
    const key = parts.slice(0, 2).join('-')
    const rarity = getRarity(s.code)
    if (!rarity) continue
    if (!map.has(key)) {
      const { playerName, countryCode } = parsePlayerName(s.name)
      map.set(key, { key, playerName, countryCode, stickers: new Map() })
    }
    map.get(key)!.stickers.set(rarity, s)
  }
  return Array.from(map.values()).sort((a, b) => a.key.localeCompare(b.key))
}

interface ExtraStickerSectionProps {
  section: Section
  stickers: StickerWithQuantity[]
  filter: StickerFilter
  searchQuery: string
  onIncrement: (stickerId: string) => void
  onDecrement: (stickerId: string) => void
  updatingIds: Set<string>
}

export function ExtraStickerSection({
  section, stickers, filter, searchQuery, onIncrement, onDecrement, updatingIds
}: ExtraStickerSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const total = stickers.length
  const obtained = stickers.filter(s => s.quantity >= 1).length
  const percentage = total === 0 ? 0 : Math.round((obtained / total) * 100)
  const isComplete = total > 0 && obtained === total

  const players = useMemo(() => {
    let groups = groupByPlayer(stickers)

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      groups = groups.filter(g =>
        g.playerName.toLowerCase().includes(q) ||
        g.countryCode.toLowerCase().includes(q)
      )
    }

    if (filter === 'missing') {
      groups = groups.filter(g => Array.from(g.stickers.values()).some(s => s.quantity === 0))
    } else if (filter === 'complete') {
      groups = groups.filter(g => Array.from(g.stickers.values()).every(s => s.quantity >= 1))
    } else if (filter === 'repeated') {
      groups = groups.filter(g => Array.from(g.stickers.values()).some(s => s.quantity > 1))
    }

    return groups
  }, [stickers, filter, searchQuery])

  if (players.length === 0 && (filter !== 'all' || searchQuery.trim())) return null

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
              <span className="font-mono text-xs font-bold text-(--text)">ES</span>
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
                {obtained}/{total} estampas · {percentage}%
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
          {players.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-(--border) bg-(--surface) py-8 text-center text-sm text-(--muted)">
              No hay jugadores con este filtro.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {players.map(player => {
                const playerObtained = Array.from(player.stickers.values()).filter(s => s.quantity >= 1).length
                const playerTotal = player.stickers.size
                const flagCode = FLAG_ICONS[player.countryCode]

                return (
                  <div key={player.key} className="rounded-2xl border border-(--border) bg-(--surface) p-3">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        {flagCode && (
                          <span className={`fi fi-${flagCode} shrink-0 text-xl`} aria-hidden="true" />
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-(--text)">{player.playerName}</p>
                          <p className="text-xs text-(--muted)">{player.countryCode}</p>
                        </div>
                      </div>
                      <span className="shrink-0 rounded-full border border-(--border) px-2 py-0.5 text-xs font-semibold text-(--muted)">
                        {playerObtained}/{playerTotal}
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5">
                      {RARITIES.map(rarity => {
                        const sticker = player.stickers.get(rarity)
                        if (!sticker) return null
                        const isObtained = sticker.quantity >= 1
                        const isUpdating = updatingIds.has(sticker.id)

                        const isRepeated = sticker.quantity > 1

                        return (
                          <div key={rarity} className="relative">
                            <button
                              onClick={() => onIncrement(sticker.id)}
                              disabled={isUpdating}
                              aria-label={`${player.playerName} ${rarity}`}
                              className={`w-full rounded-xl border-2 py-2 text-center text-[10px] font-bold tracking-wide transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus) ${
                                isObtained
                                  ? RARITY_ACTIVE[rarity]
                                  : 'border-dashed border-(--border) text-(--muted) hover:border-(--accent)/40'
                              } ${isUpdating ? 'pointer-events-none opacity-60' : ''}`}
                            >
                              {rarity}
                            </button>

                            {isObtained && (
                              <button
                                onClick={() => onDecrement(sticker.id)}
                                disabled={isUpdating}
                                aria-label={`Quitar ${player.playerName} ${rarity}`}
                                className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full border border-(--border) bg-(--surface) text-[9px] font-bold text-(--muted) shadow-sm transition hover:text-(--primary) disabled:opacity-30 focus-visible:outline-none"
                              >
                                −
                              </button>
                            )}

                            {isRepeated && (
                              <span className="absolute -bottom-1 -left-1 grid size-4 place-content-center rounded-full bg-(--primary) text-[8px] font-bold text-white shadow-md shadow-(--primary)/30">
                                x{sticker.quantity - 1}
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </article>
  )
}
