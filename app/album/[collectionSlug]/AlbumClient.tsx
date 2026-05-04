'use client'

import { useState, useMemo, useCallback } from 'react'
import { useConfetti } from '@/hooks/useConfetti'
import { StatsBar } from '@/components/progress/StatsBar'
import { FilterBar } from '@/components/album/FilterBar'
import { GroupNav } from '@/components/album/GroupNav'
import { CountryCard } from '@/components/album/CountryCard'
import { SectionCard } from '@/components/album/SectionCard'
import { ExtraStickerSection } from '@/components/album/ExtraStickerSection'
import { ShareModal } from '@/components/share/ShareModal'
import { EmptyState } from '@/components/ui/EmptyState'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { calcCollectionProgress } from '@/lib/progress'
import { updateStickerQuantity, MIN_QUANTITY, MAX_QUANTITY } from '@/lib/stickers'
import { getOrCreateShareLink, getShareUrl } from '@/lib/share'
import type { Collection, Group, Country, Section, StickerWithQuantity, StickerFilter } from '@/types/album'
import Link from 'next/link'

interface AlbumClientProps {
  user: { id: string; email: string }
  collection: Collection
  groups: Group[]
  countries: Country[]
  sections: Section[]
  stickersWithQuantity: StickerWithQuantity[]
}

export function AlbumClient({ user, collection, groups, countries, sections, stickersWithQuantity: initial }: AlbumClientProps) {
  const [stickers, setStickers] = useState(initial)
  const [filter, setFilter] = useState<StickerFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set())
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [isLoadingShare, setIsLoadingShare] = useState(false)

  const fireConfetti = useConfetti()

  const progress = useMemo(() => calcCollectionProgress(stickers, countries), [stickers, countries])

  const visibleCountries = useMemo(() => {
    let result = countries
    if (selectedGroupId) result = result.filter(c => c.group_id === selectedGroupId)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        stickers.some(s => s.country_id === c.id && (
          s.code.toLowerCase().includes(q) ||
          (s.name?.toLowerCase().includes(q) ?? false)
        ))
      )
    }
    return result
  }, [countries, selectedGroupId, searchQuery, stickers])

  const countryStickersMap = useMemo(() => {
    const map = new Map<string, StickerWithQuantity[]>()
    for (const s of stickers) {
      if (s.country_id) {
        const arr = map.get(s.country_id) ?? []
        arr.push(s)
        map.set(s.country_id, arr)
      }
    }
    return map
  }, [stickers])

  const sectionStickersMap = useMemo(() => {
    const map = new Map<string, StickerWithQuantity[]>()
    for (const s of stickers) {
      if (s.section_id && !s.country_id) {
        const arr = map.get(s.section_id) ?? []
        arr.push(s)
        map.set(s.section_id, arr)
      }
    }
    return map
  }, [stickers])

  const firstSections = useMemo(() => sections.filter(s => s.sort_order < 1), [sections])
  const lastSections = useMemo(() => sections.filter(s => s.sort_order > 12), [sections])

  const updateQuantity = useCallback(async (stickerId: string, delta: number) => {
    const current = stickers.find(s => s.id === stickerId)
    if (!current) return
    const newQty = Math.min(MAX_QUANTITY, Math.max(MIN_QUANTITY, current.quantity + delta))
    if (newQty === current.quantity) return

    if (current.country_id) {
      const countryStickers = stickers.filter(s => s.country_id === current.country_id)
      const wasComplete = countryStickers.every(s => s.quantity >= 1)
      const willBeComplete = countryStickers.every(s => s.id === stickerId ? newQty >= 1 : s.quantity >= 1)
      if (!wasComplete && willBeComplete) fireConfetti()
    } else if (current.section_id) {
      const codeParts = current.code.split('-')
      if (codeParts[0] === 'ES' && codeParts.length === 3) {
        // Extra sticker: confetti al completar las 4 raridades de un jugador
        const playerKey = codeParts.slice(0, 2).join('-')
        const playerStickers = stickers.filter(s => s.code.startsWith(playerKey + '-'))
        const wasComplete = playerStickers.every(s => s.quantity >= 1)
        const willBeComplete = playerStickers.every(s => s.id === stickerId ? newQty >= 1 : s.quantity >= 1)
        if (!wasComplete && willBeComplete) fireConfetti()
      } else {
        // Sección normal (FWC, Coca Cola): confetti al completar toda la sección
        const sectionStickers = stickers.filter(s => s.section_id === current.section_id && !s.country_id)
        const wasComplete = sectionStickers.every(s => s.quantity >= 1)
        const willBeComplete = sectionStickers.every(s => s.id === stickerId ? newQty >= 1 : s.quantity >= 1)
        if (!wasComplete && willBeComplete) fireConfetti()
      }
    }

    setStickers(prev => prev.map(s => s.id === stickerId ? { ...s, quantity: newQty } : s))
    setUpdatingIds(prev => new Set(prev).add(stickerId))

    try {
      await updateStickerQuantity(user.id, collection.id, stickerId, newQty)
    } catch {
      setStickers(prev => prev.map(s => s.id === stickerId ? { ...s, quantity: current.quantity } : s))
    } finally {
      setUpdatingIds(prev => { const next = new Set(prev); next.delete(stickerId); return next })
    }
  }, [stickers, user.id, collection.id, fireConfetti])

  const handleShare = useCallback(async () => {
    setIsLoadingShare(true)
    try {
      const link = await getOrCreateShareLink(user.id, collection.id)
      setShareUrl(getShareUrl(link.token))
      setIsShareModalOpen(true)
    } catch {
      alert('Error al generar el enlace. Intenta de nuevo.')
    } finally {
      setIsLoadingShare(false)
    }
  }, [user.id, collection.id])

  const sectionCount = sections.length

  return (
    <div className="min-h-screen bg-(--bg) text-(--text)">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_15%_0%,var(--hero-glow),transparent_32%),radial-gradient(circle_at_90%_10%,var(--hero-glow-secondary),transparent_28%)]" />

      <nav className="sticky top-0 z-20 border-b border-(--border) bg-(--bg)/85 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 rounded-xl px-2 py-2 text-(--muted) transition hover:bg-(--surface) hover:text-(--text) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus)">
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium">Colecciones</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <span className="hidden text-xs text-(--muted) sm:block">{user.email}</span>
            <form action="/auth/signout" method="post">
              <button className="rounded-xl border border-(--border) bg-(--surface) px-3 py-2 text-xs font-medium text-(--muted) transition hover:border-(--primary)/50 hover:text-(--text) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus)">
                Salir
              </button>
            </form>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl space-y-5 px-4 py-6 sm:py-8">
        <StatsBar progress={progress} collectionName={collection.name} />

        <section className="rounded-3xl border border-(--border) bg-(--surface)/80 p-3 shadow-sm backdrop-blur sm:p-4">
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-(--muted)">
            <span className="rounded-full border border-(--border) bg-(--surface-soft) px-3 py-1">
              {visibleCountries.length} países visibles
            </span>
            {sectionCount > 0 && (
              <span className="rounded-full border border-(--border) bg-(--surface-soft) px-3 py-1">
                {sectionCount} secciones
              </span>
            )}
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <label className="relative flex-1">
              <span className="sr-only">Buscar estampas</span>
              <svg className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-(--muted)" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 110-15 7.5 7.5 0 010 15z" />
              </svg>
              <input
                type="text"
                placeholder="Buscar país, código o estampa"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="h-12 w-full rounded-2xl border border-(--border) bg-(--surface-soft) pl-11 pr-4 text-sm text-(--text) placeholder-(--muted) transition focus:border-(--accent) focus:outline-none focus:ring-2 focus:ring-(--accent)/20"
              />
            </label>
            <button
              onClick={handleShare}
              disabled={isLoadingShare}
              className="flex h-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-(--primary) px-5 text-sm font-semibold text-white shadow-lg shadow-(--primary)/20 transition hover:-translate-y-0.5 hover:bg-(--primary-hover) disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus)"
            >
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              {isLoadingShare ? 'Generando...' : 'Compartir'}
            </button>
          </div>

          <div className="mt-4 space-y-3">
            <FilterBar activeFilter={filter} onChange={setFilter} />

            {groups.length > 0 && (
              <GroupNav groups={groups} selectedGroupId={selectedGroupId} onChange={setSelectedGroupId} />
            )}
          </div>
        </section>

        <section className="space-y-4">
          {firstSections.map(section => (
            <SectionCard
              key={section.id}
              section={section}
              stickers={sectionStickersMap.get(section.id) ?? []}
              filter={filter}
              searchQuery={searchQuery}
              onIncrement={id => updateQuantity(id, 1)}
              onDecrement={id => updateQuantity(id, -1)}
              updatingIds={updatingIds}
            />
          ))}

          {visibleCountries.length === 0 ? (
            <EmptyState
              title="Sin resultados"
              description="Ajusta la búsqueda o cambia el filtro para ver más países y estampas."
            />
          ) : (
            visibleCountries.map(country => (
              <CountryCard
                key={country.id}
                country={country}
                stickers={countryStickersMap.get(country.id) ?? []}
                filter={filter}
                searchQuery={searchQuery}
                onIncrement={id => updateQuantity(id, 1)}
                onDecrement={id => updateQuantity(id, -1)}
                updatingIds={updatingIds}
              />
            ))
          )}

          {lastSections.map(section =>
            section.type === 'extra' ? (
              <ExtraStickerSection
                key={section.id}
                section={section}
                stickers={sectionStickersMap.get(section.id) ?? []}
                filter={filter}
                searchQuery={searchQuery}
                onIncrement={id => updateQuantity(id, 1)}
                onDecrement={id => updateQuantity(id, -1)}
                updatingIds={updatingIds}
              />
            ) : (
              <SectionCard
                key={section.id}
                section={section}
                stickers={sectionStickersMap.get(section.id) ?? []}
                filter={filter}
                searchQuery={searchQuery}
                onIncrement={id => updateQuantity(id, 1)}
                onDecrement={id => updateQuantity(id, -1)}
                updatingIds={updatingIds}
              />
            )
          )}
        </section>
      </main>

      {shareUrl && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          shareUrl={shareUrl}
        />
      )}
    </div>
  )
}
