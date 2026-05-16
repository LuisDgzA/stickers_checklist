'use client'

import { useMemo, useState, useTransition } from 'react'
import type { MatchResult, Country, Section, StickerWithQuantity } from '@/types/album'
import { proposeExchange } from '@/app/actions/exchange'
import Link from 'next/link'

interface ExchangeContext {
  collectionId: string
  ownerId: string
  shareToken: string
}

interface MatchClientProps {
  matchResult: MatchResult
  ownerName: string
  countries: Country[]
  sections?: Section[]
  embedded?: boolean
  exchangeContext?: ExchangeContext
}

export function MatchClient({ matchResult, ownerName, countries, sections = [], embedded = false, exchangeContext }: MatchClientProps) {
  const { ownerCanGive, visitorCanGive, possibleExchanges } = matchResult

  const [selectedFromOwner, setSelectedFromOwner] = useState<Set<string>>(new Set())
  const [selectedFromVisitor, setSelectedFromVisitor] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()
  const [proposalDoneId, setProposalDoneId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const countryMap = useMemo(() => new Map(countries.map(c => [c.id, c])), [countries])
  const sectionMap = useMemo(() => new Map(sections.map(s => [s.id, s])), [sections])

  function groupByCountry(stickers: StickerWithQuantity[]) {
    const grouped = new Map<string, StickerWithQuantity[]>()
    for (const s of stickers) {
      const key = s.country_id ?? s.section_id ?? 'other'
      const arr = grouped.get(key) ?? []
      arr.push(s)
      grouped.set(key, arr)
    }
    return grouped
  }

  const ownerGrouped = useMemo(() => groupByCountry(ownerCanGive), [ownerCanGive])
  const visitorGrouped = useMemo(() => groupByCountry(visitorCanGive), [visitorCanGive])

  function toggleOwner(id: string) {
    setSelectedFromOwner(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleVisitor(id: string) {
    setSelectedFromVisitor(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const totalOwnerStickers = ownerCanGive.length
  const totalVisitorStickers = visitorCanGive.length

  function handlePropose() {
    if (!exchangeContext) return
    setError(null)
    startTransition(async () => {
      try {
        const id = await proposeExchange({
          collectionId: exchangeContext.collectionId,
          ownerId: exchangeContext.ownerId,
          shareToken: exchangeContext.shareToken,
          ownerGives: Array.from(selectedFromOwner),
          requesterGives: Array.from(selectedFromVisitor),
        })
        setProposalDoneId(id)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al enviar la propuesta')
      }
    })
  }

  const canPropose = exchangeContext && (selectedFromOwner.size > 0 || selectedFromVisitor.size > 0)

  const content = (
    <>
      {!embedded && (
        <nav className="border-b border-(--border) px-4 py-3 flex items-center gap-3">
          <Link href="/" className="text-(--muted) hover:text-(--text) transition-colors">
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

        {proposalDoneId ? (
          <div className="rounded-3xl border border-green-500/30 bg-green-900/20 p-6 text-center space-y-3">
            <p className="text-lg font-semibold text-(--text)">¡Propuesta enviada!</p>
            <p className="text-sm text-(--muted)">
              {ownerName} recibirá tu propuesta. Cuando la acepte, los cambios se aplicarán automáticamente en ambos álbumes.
            </p>
            <Link
              href={`/exchange/${proposalDoneId}`}
              className="inline-block mt-2 rounded-2xl bg-(--accent) px-5 py-2.5 text-sm font-semibold text-white"
            >
              Ver estado del intercambio
            </Link>
          </div>
        ) : (
          <>
            <SelectableStickerSection
              title={`Lo que ${ownerName} te puede dar (${ownerCanGive.length})`}
              grouped={ownerGrouped}
              countryMap={countryMap}
              sectionMap={sectionMap}
              emptyMessage={`${ownerName} no tiene duplicados que te falten.`}
              selected={selectedFromOwner}
              onToggle={exchangeContext ? toggleOwner : undefined}
              allCount={totalOwnerStickers}
              onSelectAll={exchangeContext && totalOwnerStickers > 0
                ? () => setSelectedFromOwner(selectedFromOwner.size === totalOwnerStickers
                    ? new Set()
                    : new Set(ownerCanGive.map(s => s.id)))
                : undefined}
            />

            <SelectableStickerSection
              title={`Lo que tú le puedes dar (${visitorCanGive.length})`}
              grouped={visitorGrouped}
              countryMap={countryMap}
              sectionMap={sectionMap}
              emptyMessage="No tienes duplicados que le falten."
              selected={selectedFromVisitor}
              onToggle={exchangeContext ? toggleVisitor : undefined}
              allCount={totalVisitorStickers}
              onSelectAll={exchangeContext && totalVisitorStickers > 0
                ? () => setSelectedFromVisitor(selectedFromVisitor.size === totalVisitorStickers
                    ? new Set()
                    : new Set(visitorCanGive.map(s => s.id)))
                : undefined}
            />

            {exchangeContext && (
              <div className="rounded-3xl border border-(--border) bg-(--surface) p-5 space-y-3">
                <p className="text-sm text-(--muted)">
                  {selectedFromOwner.size > 0 || selectedFromVisitor.size > 0 ? (
                    <>
                      <span className="text-green-400 font-semibold">{selectedFromOwner.size}</span> recibirás ·{' '}
                      <span className="text-amber-400 font-semibold">{selectedFromVisitor.size}</span> darás
                    </>
                  ) : (
                    'Selecciona las estampas que quieres intercambiar arriba'
                  )}
                </p>
                {error && <p className="text-xs text-red-400">{error}</p>}
                <button
                  onClick={handlePropose}
                  disabled={!canPropose || isPending}
                  className="w-full rounded-2xl bg-(--accent) px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isPending ? 'Enviando propuesta...' : 'Proponer intercambio'}
                </button>
              </div>
            )}
          </>
        )}
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

function SelectableStickerSection({
  title, grouped, countryMap, sectionMap, emptyMessage,
  selected, onToggle, onSelectAll, allCount,
}: {
  title: string
  grouped: Map<string, StickerWithQuantity[]>
  countryMap: Map<string, Country>
  sectionMap: Map<string, Section>
  emptyMessage: string
  selected: Set<string>
  onToggle?: (id: string) => void
  onSelectAll?: () => void
  allCount: number
}) {
  if (grouped.size === 0) {
    return (
      <div className="rounded-3xl border border-(--border) bg-(--surface) p-5">
        <h3 className="font-semibold mb-3">{title}</h3>
        <p className="text-(--muted) text-sm">{emptyMessage}</p>
      </div>
    )
  }

  const allSelected = selected.size === allCount && allCount > 0

  return (
    <div className="rounded-3xl border border-(--border) bg-(--surface) p-5">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h3 className="font-semibold">{title}</h3>
        {onSelectAll && (
          <button
            onClick={onSelectAll}
            className="rounded-lg border border-(--border) bg-(--surface-soft) px-3 py-1.5 text-xs font-medium text-(--muted) transition hover:border-violet-500/60 hover:bg-violet-500/10 hover:text-violet-400"
          >
            {allSelected ? 'Deseleccionar todas' : 'Seleccionar todas'}
          </button>
        )}
      </div>
      {onToggle && (
        <p className="text-xs text-(--muted) mb-3">Toca una estampa para seleccionarla</p>
      )}
      <div className="space-y-4">
        {Array.from(grouped.entries()).map(([countryId, stickers]) => {
          return (
            <div key={countryId}>
              <div className="text-sm font-medium text-(--text) mb-2">
                {countryMap.get(countryId)?.name ?? sectionMap.get(countryId)?.name ?? 'Otros'}
              </div>
              <div className="flex flex-wrap gap-2">
                {stickers.map(s => {
                  const isSelected = selected.has(s.id)
                  return (
                    <button
                      key={s.id}
                      onClick={() => onToggle?.(s.id)}
                      disabled={!onToggle}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-mono border transition-all ${
                        isSelected
                          ? 'bg-violet-600 text-white border-violet-500 shadow-sm shadow-violet-500/30'
                          : 'bg-(--surface-soft) text-(--muted) border-(--border) hover:border-violet-500/40 hover:text-(--text)'
                      } ${onToggle ? 'cursor-pointer active:scale-95' : 'cursor-default'}`}
                    >
                      {isSelected && <span className="font-sans text-[10px]">✓</span>}
                      {s.code}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
