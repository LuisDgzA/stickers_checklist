'use client'

import { useMemo } from 'react'
import type { MatchResult, Country, StickerWithQuantity } from '@/types/album'
import Link from 'next/link'

interface MatchClientProps {
  matchResult: MatchResult
  ownerName: string
  countries: Country[]
  embedded?: boolean
}

export function MatchClient({ matchResult, ownerName, countries, embedded = false }: MatchClientProps) {
  const { ownerCanGive, visitorCanGive, possibleExchanges } = matchResult

  const countryMap = useMemo(() => new Map(countries.map(c => [c.id, c])), [countries])

  function groupByCountry(stickers: StickerWithQuantity[]) {
    const grouped = new Map<string, StickerWithQuantity[]>()
    for (const s of stickers) {
      const key = s.country_id ?? 'other'
      const arr = grouped.get(key) ?? []
      arr.push(s)
      grouped.set(key, arr)
    }
    return grouped
  }

  const ownerGrouped = useMemo(() => groupByCountry(ownerCanGive), [ownerCanGive])
  const visitorGrouped = useMemo(() => groupByCountry(visitorCanGive), [visitorCanGive])

  const content = (
    <>
      {!embedded && (
      <nav className="border-b border-(--border) px-4 py-3 flex items-center gap-3">
        <Link href="/" className="text-slate-400 hover:text-slate-200 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <h1 className="text-lg font-semibold">Intercambio con {ownerName}</h1>
      </nav>
      )}

      <main className={`${embedded ? '' : 'px-4 py-6 max-w-4xl mx-auto'} space-y-6`}>
        {embedded && <h2 className="text-2xl font-bold tracking-tight text-(--text)">Posibles intercambios</h2>}
        <div className="grid grid-cols-3 gap-4">
          <SummaryCard label={`${ownerName} te puede dar`} value={ownerCanGive.length} color="text-green-400" />
          <SummaryCard label="Posibles intercambios" value={possibleExchanges} color="text-blue-400" />
          <SummaryCard label="Tú le puedes dar" value={visitorCanGive.length} color="text-amber-400" />
        </div>

        <StickerSection
          title={`Lo que ${ownerName} te puede dar (${ownerCanGive.length})`}
          grouped={ownerGrouped}
          countryMap={countryMap}
          emptyMessage={`${ownerName} no tiene duplicados que te falten.`}
          badgeColor="bg-green-900/50 text-green-300 border-green-500/30"
        />

        <StickerSection
          title={`Lo que tú le puedes dar (${visitorCanGive.length})`}
          grouped={visitorGrouped}
          countryMap={countryMap}
          emptyMessage="No tienes duplicados que le falten."
          badgeColor="bg-amber-900/50 text-amber-300 border-amber-500/30"
        />
      </main>
    </>
  )

  if (embedded) return content

  return (
    <div className="min-h-screen bg-(--bg) text-(--text)">
      {content}
    </div>
  )
}

function SummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-2xl border border-(--border) bg-(--surface) p-4 text-center">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-(--muted) mt-1">{label}</div>
    </div>
  )
}

function StickerSection({
  title, grouped, countryMap, emptyMessage, badgeColor
}: {
  title: string
  grouped: Map<string, StickerWithQuantity[]>
  countryMap: Map<string, Country>
  emptyMessage: string
  badgeColor: string
}) {
  if (grouped.size === 0) {
    return (
      <div className="rounded-3xl border border-(--border) bg-(--surface) p-5">
        <h3 className="font-semibold mb-3">{title}</h3>
        <p className="text-(--muted) text-sm">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="rounded-3xl border border-(--border) bg-(--surface) p-5">
      <h3 className="font-semibold mb-4">{title}</h3>
      <div className="space-y-4">
        {Array.from(grouped.entries()).map(([countryId, stickers]) => {
          const country = countryMap.get(countryId)
          return (
            <div key={countryId}>
              <div className="text-sm font-medium text-(--text) mb-2">
                {country?.name ?? 'Sección especial'}
              </div>
              <div className="flex flex-wrap gap-2">
                {stickers.map(s => (
                  <span
                    key={s.id}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-mono border ${badgeColor}`}
                  >
                    {s.code}
                    {s.quantity > 1 && <span className="opacity-70">×{s.quantity - 1}</span>}
                  </span>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
