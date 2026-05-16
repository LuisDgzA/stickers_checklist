'use client'

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useConfetti } from '@/hooks/useConfetti'
import { StatsBar } from '@/components/progress/StatsBar'
import { FilterBar } from '@/components/album/FilterBar'
import { GroupNav } from '@/components/album/GroupNav'
import { CountryCard } from '@/components/album/CountryCard'
import { SectionCard } from '@/components/album/SectionCard'
import { ExtraStickerSection } from '@/components/album/ExtraStickerSection'
import { AlbumContextTips, AlbumOnboardingController } from '@/components/album/AlbumOnboarding'
import { ShareModal } from '@/components/share/ShareModal'
import { EmptyState } from '@/components/ui/EmptyState'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { NotificationBell } from '@/components/ui/NotificationBell'
import { ResponsiveMenu } from '@/components/ui/ResponsiveMenu'
import { LogoutButton } from '@/components/auth/LogoutButton'
import { calcCollectionProgress, filterStickers, searchStickers } from '@/lib/progress'
import { updateStickerQuantity, MIN_QUANTITY, MAX_QUANTITY } from '@/lib/stickers'
import { getOrCreateShareLink, getShareUrl } from '@/lib/share'
import { detectAchievementCodes, detectExistingAchievements, unlockAchievements, type AchievementDefinition } from '@/lib/achievements'
import type { Collection, Group, Country, Section, StickerWithQuantity, StickerFilter } from '@/types/album'
import Link from 'next/link'

interface AlbumClientProps {
  user: { id: string; email: string; nickname: string } | null
  collection: Collection
  groups: Group[]
  countries: Country[]
  sections: Section[]
  stickersWithQuantity: StickerWithQuantity[]
  unlockedAchievementCodes: string[]
  mode?: 'authenticated' | 'preview' | 'sandbox'
  continueOnboarding?: boolean
}

type FeedbackToast =
  | { id: string; type: 'achievement'; title: string; description: string; category: string }
  | { id: string; type: 'progress'; title: string; description: string }

export function AlbumClient({ user, collection, groups, countries, sections, stickersWithQuantity: initial, unlockedAchievementCodes, mode = user ? 'authenticated' : 'preview', continueOnboarding = false }: AlbumClientProps) {
  const [stickers, setStickers] = useState(initial)
  const [filter, setFilter] = useState<StickerFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set())
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [isLoadingShare, setIsLoadingShare] = useState(false)
  const shareJustClosedRef = useRef(false)
  const [loginPrompt, setLoginPrompt] = useState<{ title: string; description: string } | null>(null)
  const [feedbackToasts, setFeedbackToasts] = useState<FeedbackToast[]>([])
  const [unlockedCodes, setUnlockedCodes] = useState(() => new Set(unlockedAchievementCodes))

  const fireConfetti = useConfetti()
  const isSandbox = mode === 'sandbox'
  const canPersist = Boolean(user) && mode === 'authenticated'
  const displayNickname = user?.nickname ? `@${user.nickname}` : null

  const progress = useMemo(() => calcCollectionProgress(stickers, countries), [stickers, countries])
  const hasSearchQuery = searchQuery.trim().length > 0
  const hasActiveRefinements = Boolean(selectedGroupId) || filter !== 'all' || hasSearchQuery

  const visibleCountries = useMemo(() => {
    let result = countries
    if (selectedGroupId) result = result.filter(c => c.group_id === selectedGroupId)
    if (hasSearchQuery) {
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
  }, [countries, selectedGroupId, hasSearchQuery, searchQuery, stickers])

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

  const visibleCountryCardsCount = useMemo(() => {
    return visibleCountries.filter(country => {
      if (filter === 'all') return true
      const countryStickers = countryStickersMap.get(country.id) ?? []
      return searchStickers(filterStickers(countryStickers, filter), searchQuery).length > 0
    }).length
  }, [visibleCountries, countryStickersMap, filter, searchQuery])

  const visibleStandaloneSectionsCount = useMemo(() => {
    if (selectedGroupId) return 0

    return [...firstSections, ...lastSections].filter(section => {
      if (!hasActiveRefinements) return true
      const sectionStickers = sectionStickersMap.get(section.id) ?? []
      return searchStickers(filterStickers(sectionStickers, filter), searchQuery).length > 0
    }).length
  }, [selectedGroupId, firstSections, lastSections, hasActiveRefinements, sectionStickersMap, filter, searchQuery])

  const shouldShowEmptyState =
    hasActiveRefinements &&
    visibleCountryCardsCount === 0 &&
    visibleStandaloneSectionsCount === 0

  const dismissToast = useCallback((toastId: string) => {
    setFeedbackToasts(prev => prev.filter(toast => toast.id !== toastId))
  }, [])

  const handleGroupChange = useCallback((groupId: string | null) => {
    setSelectedGroupId(groupId)
    if (groupId) setFilter(current => current === 'special' ? 'all' : current)
  }, [])

  const addFeedbackToasts = useCallback((toasts: Omit<FeedbackToast, 'id'>[]) => {
    if (toasts.length === 0) return
    const withIds = toasts.map(toast => ({ ...toast, id: crypto.randomUUID() }) as FeedbackToast)
    setFeedbackToasts(prev => [...withIds, ...prev].slice(0, 5))
    withIds.forEach(toast => {
      window.setTimeout(() => dismissToast(toast.id), toast.type === 'achievement' ? 6000 : 4500)
    })
  }, [dismissToast])

  const initialCheckDone = useRef(false)
  useEffect(() => {
    if (!user || isSandbox) return
    if (initialCheckDone.current) return
    initialCheckDone.current = true

    const existing = detectExistingAchievements({ stickers: initial, countries, groups, sections, unlockedCodes, collectionSlug: collection.slug })
    if (existing.length === 0) return

    unlockAchievements(user.id, collection.id, existing, collection.slug).then(newAchievements => {
      if (newAchievements.length === 0) return
      fireConfetti()
      setUnlockedCodes(prev => {
        const next = new Set(prev)
        newAchievements.forEach(a => next.add(a.code))
        return next
      })
      newAchievements.forEach((achievement: AchievementDefinition, i) => {
        window.setTimeout(() => {
          addFeedbackToasts([{ type: 'achievement', title: achievement.title, description: achievement.description, category: achievement.category } as Omit<FeedbackToast, 'id'>])
        }, i * 800)
      })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const updateQuantity = useCallback(async (stickerId: string, delta: number) => {
    if (!canPersist && !isSandbox) {
      setLoginPrompt({
        title: 'Guarda tu progreso con una cuenta',
        description: 'Puedes explorar la colección completa, pero necesitas iniciar sesión para guardar cambios reales.',
      })
      return
    }

    const current = stickers.find(s => s.id === stickerId)
    if (!current) return
    const newQty = Math.min(MAX_QUANTITY, Math.max(MIN_QUANTITY, current.quantity + delta))
    if (newQty === current.quantity) return

    const nextStickers = stickers.map(s => s.id === stickerId ? { ...s, quantity: newQty } : s)
    const progressToasts: Omit<FeedbackToast, 'id'>[] = []

    if (current.country_id) {
      const countryStickers = stickers.filter(s => s.country_id === current.country_id)
      const wasComplete = countryStickers.every(s => s.quantity >= 1)
      const willBeComplete = countryStickers.every(s => s.id === stickerId ? newQty >= 1 : s.quantity >= 1)
      if (!wasComplete && willBeComplete) {
        const country = countries.find(item => item.id === current.country_id)
        progressToasts.push({
          type: 'progress',
          title: 'Sección completada',
          description: country ? `${country.name} ya está completo.` : 'Completaste todos los elementos de esta parte.',
        })
      }

      const country = countries.find(item => item.id === current.country_id)
      const group = country?.group_id ? groups.find(item => item.id === country.group_id) : null
      if (group) {
        const groupCountries = countries.filter(item => item.group_id === group.id)
        const wasGroupComplete = groupCountries.length > 0 && groupCountries.every(item => {
          const itemStickers = stickers.filter(sticker => sticker.country_id === item.id)
          return itemStickers.length > 0 && itemStickers.every(sticker => sticker.quantity >= 1)
        })
        const willGroupComplete = groupCountries.length > 0 && groupCountries.every(item => {
          const itemStickers = nextStickers.filter(sticker => sticker.country_id === item.id)
          return itemStickers.length > 0 && itemStickers.every(sticker => sticker.quantity >= 1)
        })
        if (!wasGroupComplete && willGroupComplete) {
          progressToasts.push({
            type: 'progress',
            title: 'Grupo completado',
            description: `${group.name} ya está completo.`,
          })
        }
      }
    } else if (current.section_id) {
      const codeParts = current.code.split('-')
      if (codeParts[0] === 'ES' && codeParts.length === 3) {
        const playerKey = codeParts.slice(0, 2).join('-')
        const playerStickers = stickers.filter(s => s.code.startsWith(playerKey + '-'))
        const wasComplete = playerStickers.every(s => s.quantity >= 1)
        const willBeComplete = playerStickers.every(s => s.id === stickerId ? newQty >= 1 : s.quantity >= 1)
        if (!wasComplete && willBeComplete) {
          progressToasts.push({
            type: 'progress',
            title: 'Grupo completado',
            description: 'Completaste todas las rarezas de este jugador.',
          })
        }
      } else {
        const sectionStickers = stickers.filter(s => s.section_id === current.section_id && !s.country_id)
        const wasComplete = sectionStickers.every(s => s.quantity >= 1)
        const willBeComplete = sectionStickers.every(s => s.id === stickerId ? newQty >= 1 : s.quantity >= 1)
        if (!wasComplete && willBeComplete) {
          const section = sections.find(item => item.id === current.section_id)
          progressToasts.push({
            type: 'progress',
            title: 'Grupo completado',
            description: section ? `${section.name} ya está completo.` : 'Completaste esta sección.',
          })
        }
      }
    }

    const candidateAchievementCodes = detectAchievementCodes({
      previous: stickers,
      next: nextStickers,
      countries,
      groups,
      sections,
      changedSticker: current,
      unlockedCodes,
      collectionSlug: collection.slug,
    })

    setStickers(nextStickers)

    if (isSandbox) {
      if (progressToasts.length > 0) fireConfetti()
      addFeedbackToasts(progressToasts.length > 0 ? progressToasts : [{
        type: 'progress',
        title: 'Cambio aplicado',
        description: 'Cambio aplicado en esta colección de práctica.',
      }])
      return
    }

    if (!user) return

    setUpdatingIds(prev => new Set(prev).add(stickerId))

    try {
      await updateStickerQuantity(user.id, collection.id, stickerId, newQty)
      const newAchievements = await unlockAchievements(user.id, collection.id, candidateAchievementCodes, collection.slug)
      if (progressToasts.length > 0 || newAchievements.length > 0) fireConfetti()
      if (newAchievements.length > 0) {
        setUnlockedCodes(prev => {
          const next = new Set(prev)
          newAchievements.forEach(achievement => next.add(achievement.code))
          return next
        })
      }
      addFeedbackToasts([
        ...newAchievements.map((achievement: AchievementDefinition) => ({
          type: 'achievement' as const,
          title: achievement.title,
          description: achievement.description,
          category: achievement.category,
        })),
        ...progressToasts,
      ])
    } catch {
      setStickers(prev => prev.map(s => s.id === stickerId ? { ...s, quantity: current.quantity } : s))
    } finally {
      setUpdatingIds(prev => { const next = new Set(prev); next.delete(stickerId); return next })
    }
  }, [addFeedbackToasts, canPersist, collection.id, collection.slug, countries, fireConfetti, groups, isSandbox, sections, stickers, unlockedCodes, user])

  const handleShareModalClose = useCallback(() => {
    shareJustClosedRef.current = true
    setIsShareModalOpen(false)
    setTimeout(() => { shareJustClosedRef.current = false }, 400)
  }, [])

  const handleShare = useCallback(async () => {
    if (shareJustClosedRef.current) return
    if (!user || isSandbox) {
      setLoginPrompt({
        title: 'Comparte desde tu cuenta',
        description: 'Para generar un QR y enlace público necesitas iniciar sesión y abrir una colección de tu biblioteca.',
      })
      return
    }

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
  }, [collection.id, isSandbox, user])

  return (
    <div className="min-h-screen bg-(--bg) text-(--text)">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_15%_0%,var(--hero-glow),transparent_32%),radial-gradient(circle_at_90%_10%,var(--hero-glow-secondary),transparent_28%)]" />

      <nav className="sticky top-0 z-20 border-b border-(--border) bg-(--bg)/85 px-3 py-2.5 backdrop-blur-xl sm:px-4 sm:py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 sm:gap-4">
          <Link href="/" className="flex min-w-0 shrink-0 items-center gap-2 rounded-xl px-2 py-2 text-(--muted) transition hover:bg-(--surface) hover:text-(--text) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus)">
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden truncate text-sm font-medium min-[420px]:inline">Colecciones</span>
          </Link>
          <div className="hidden items-center justify-end gap-2 md:flex">
            <ThemeToggle />
            <AlbumOnboardingController
              mode={mode}
              userId={user?.id ?? null}
              collectionSlug={collection.slug}
              autoOpen={continueOnboarding}
            />
            {user && (
              <>
                <Link href={`/logros?back=${encodeURIComponent(`/album/${collection.slug}`)}&collection=${collection.slug}`} className="h-10 shrink-0 rounded-xl border border-(--border) bg-(--surface) px-3 py-2 text-sm font-medium text-(--muted) transition hover:border-(--accent)/50 hover:text-(--text) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus)">
                  Logros
                </Link>
                <Link href={`/perfil?back=${encodeURIComponent(`/album/${collection.slug}`)}`} className="h-10 shrink-0 rounded-xl border border-(--border) bg-(--surface) px-3 py-2 text-sm font-medium text-(--muted) transition hover:border-(--accent)/50 hover:text-(--text) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus)">
                  Perfil
                </Link>
              </>
            )}
            {user ? (
              <LogoutButton className="h-10 shrink-0 whitespace-nowrap rounded-xl border border-(--border) bg-(--surface) px-3 py-2 text-sm font-medium text-(--muted) transition hover:border-(--primary)/50 hover:text-(--text) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus) disabled:cursor-wait disabled:opacity-70" />
            ) : (
              <Link data-album-tour="auth-action" href={`/login?next=${encodeURIComponent(`/album/${collection.slug}`)}`} className="h-10 shrink-0 whitespace-nowrap rounded-xl bg-(--primary) px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-(--primary)/20 transition hover:bg-(--primary-hover) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus)">
                Iniciar sesión
              </Link>
            )}
          </div>

          <ResponsiveMenu targetAttribute={{ 'data-album-tour': 'album-menu-button' }}>
              <div data-menu-keep-open="true" className="flex items-center justify-between rounded-2xl bg-(--surface-soft) px-3 py-2">
                <span className="text-sm font-semibold text-(--muted)">Tema</span>
                <ThemeToggle />
              </div>
              <AlbumOnboardingController
                mode={mode}
                userId={user?.id ?? null}
                collectionSlug={collection.slug}
                autoOpen={continueOnboarding}
              />
            {user && (
              <>
                <Link href={`/logros?back=${encodeURIComponent(`/album/${collection.slug}`)}&collection=${collection.slug}`} className="flex min-h-11 items-center rounded-2xl border border-(--border) bg-(--surface) px-3 py-2 text-sm font-semibold text-(--muted) transition hover:border-(--accent)/50 hover:bg-(--surface-hover) hover:text-(--text) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus)">
                  Logros
                </Link>
                <Link href={`/perfil?back=${encodeURIComponent(`/album/${collection.slug}`)}`} className="flex min-h-11 items-center rounded-2xl border border-(--border) bg-(--surface) px-3 py-2 text-sm font-semibold text-(--muted) transition hover:border-(--accent)/50 hover:bg-(--surface-hover) hover:text-(--text) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus)">
                  Perfil
                </Link>
              </>
            )}
            {user ? (
              <LogoutButton className="flex min-h-11 w-full items-center rounded-2xl border border-(--border) bg-(--surface) px-3 py-2 text-left text-sm font-semibold text-(--muted) transition hover:border-(--primary)/50 hover:bg-(--surface-hover) hover:text-(--text) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus) disabled:cursor-wait disabled:opacity-70" />
            ) : (
              <Link data-album-tour="auth-action" href={`/login?next=${encodeURIComponent(`/album/${collection.slug}`)}`} className="flex min-h-11 items-center justify-center rounded-2xl bg-(--primary) px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-(--primary)/20 transition hover:bg-(--primary-hover) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus)">
                Iniciar sesión
              </Link>
            )}
          </ResponsiveMenu>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl space-y-5 px-4 py-6 sm:py-8">
        {user && (
          <span className="inline-flex items-center rounded-full border border-(--accent)/30 bg-(--accent)/10 px-3 py-1 text-md font-semibold text-(--accent)">
            Hola, {displayNickname}
          </span>
        )}

        {isSandbox && (
          <div data-album-tour="mode-banner" className="rounded-3xl border border-(--accent)/30 bg-(--accent)/10 p-4 text-sm text-(--text) shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-bold text-(--accent)">Colección de práctica</p>
                <p className="mt-1 leading-6 text-(--muted)">
                  Puedes explorar navegación, filtros y estructura. Para guardar progreso o compartir una colección real, inicia sesión.
                </p>
              </div>
              {!user && (
                <Link data-album-tour="auth-action" href={`/login?next=${encodeURIComponent(`/album/${collection.slug}`)}`} className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-(--primary) px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-(--primary-hover) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus)">
                  Guardar mi progreso
                </Link>
              )}
            </div>
          </div>
        )}
        <AlbumContextTips mode={mode} userId={user?.id ?? null} collectionSlug={collection.slug} />
        <div data-album-tour="stats">
          <StatsBar progress={progress} collectionName={collection.name} />
        </div>

        <section data-album-tour="tools" className="rounded-3xl border border-(--border) bg-(--surface)/80 p-3 shadow-sm backdrop-blur sm:p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <label className="relative flex-1">
              <span className="sr-only">Buscar elementos</span>
              <svg className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-(--muted)" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 110-15 7.5 7.5 0 010 15z" />
              </svg>
              <input
                type="text"
                placeholder="Buscar nombre, código o elemento"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="h-12 w-full rounded-2xl border border-(--border) bg-(--surface-soft) pl-11 pr-4 text-sm text-(--text) placeholder-(--muted) transition focus:border-(--accent) focus:outline-none focus:ring-2 focus:ring-(--accent)/20"
              />
            </label>
            <div className="flex shrink-0 items-center gap-2">
              {user && <NotificationBell />}
              <button
                data-album-tour="share"
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
          </div>

          <div className="mt-4 space-y-3">
            <FilterBar activeFilter={filter} onChange={setFilter} hideSpecial={Boolean(selectedGroupId) || !sections.some(s => s.type === 'special')} />

            {groups.length > 0 && (
              <GroupNav groups={groups} selectedGroupId={selectedGroupId} onChange={handleGroupChange} />
            )}
          </div>
        </section>

        <section data-album-tour="stickers" className="space-y-4">
          {!selectedGroupId && firstSections.map(section => (
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

          {shouldShowEmptyState ? (
            <EmptyState
              title="Sin resultados"
              description="Ajusta la búsqueda o cambia el filtro para ver más elementos."
            />
          ) : (
            visibleCountries.map((country, index) => (
              <CountryCard
                key={country.id}
                country={country}
                stickers={countryStickersMap.get(country.id) ?? []}
                filter={filter}
                searchQuery={searchQuery}
                onIncrement={id => updateQuantity(id, 1)}
                onDecrement={id => updateQuantity(id, -1)}
                updatingIds={updatingIds}
                defaultExpanded={isSandbox && index === 0}
                tutorialTarget={isSandbox && index === 0 ? 'demo-country-card' : undefined}
              />
            ))
          )}

          {!selectedGroupId && lastSections.map(section =>
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

      <FeedbackStack toasts={feedbackToasts} onDismiss={dismissToast} />

      {shareUrl && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={handleShareModalClose}
          shareUrl={shareUrl}
        />
      )}

      <LoginPromptModal
        open={Boolean(loginPrompt)}
        title={loginPrompt?.title ?? ''}
        description={loginPrompt?.description ?? ''}
        nextPath={`/album/${collection.slug}`}
        onClose={() => setLoginPrompt(null)}
      />
    </div>
  )
}

function LoginPromptModal({
  open,
  title,
  description,
  nextPath,
  onClose,
}: {
  open: boolean
  title: string
  description: string
  nextPath: string
  onClose: () => void
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 grid place-items-center px-4">
      <button
        type="button"
        aria-label="Cerrar"
        className="absolute inset-0 bg-black/45 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm rounded-3xl border border-(--border) bg-(--surface) p-5 text-(--text) shadow-2xl sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-(--accent)/15 text-(--accent)">
            <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar aviso"
            className="grid size-9 shrink-0 place-items-center rounded-xl text-(--muted) transition hover:bg-(--surface-hover) hover:text-(--text) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus)"
          >
            ×
          </button>
        </div>
        <h2 className="mt-4 text-xl font-bold leading-tight text-(--text)">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-(--muted)">{description}</p>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl px-4 py-2.5 text-sm font-semibold text-(--muted) transition hover:bg-(--surface-hover) hover:text-(--text) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus)"
          >
            Seguir explorando
          </button>
          <Link
            href={`/login?next=${encodeURIComponent(nextPath)}`}
            className="inline-flex items-center justify-center rounded-2xl bg-(--primary) px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-(--primary-hover) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus)"
          >
            Iniciar sesión
          </Link>
        </div>
      </div>
    </div>
  )
}

function FeedbackStack({ toasts, onDismiss }: { toasts: FeedbackToast[]; onDismiss: (id: string) => void }) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed right-4 top-20 z-50 flex w-[min(360px,calc(100vw-2rem))] flex-col gap-3">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className="animate-[toast-in_180ms_ease-out] rounded-2xl border bg-(--surface) p-4 text-(--text) transition duration-200"
          style={{
            borderColor: 'var(--sticker-repeated-border)',
            boxShadow: '0 24px 48px var(--sticker-repeated-shadow), 0 0 0 1px var(--sticker-repeated-bg)',
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className="grid size-10 shrink-0 place-items-center rounded-2xl"
              style={{
                backgroundColor: 'var(--sticker-repeated-bg)',
                color: 'var(--sticker-repeated-text)',
              }}
            >
              {toast.type === 'achievement' ? <AchievementIcon icon={toast.category} /> : (
                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-(--text)">{toast.type === 'achievement' ? 'Logro desbloqueado' : toast.title}</p>
              <p className="mt-0.5 text-sm font-semibold" style={{ color: 'var(--sticker-repeated-text)' }}>{toast.type === 'achievement' ? toast.title : toast.description}</p>
              {toast.type === 'achievement' && <p className="mt-1 text-xs leading-5 text-(--muted)">{toast.description}</p>}
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="grid size-7 shrink-0 place-items-center rounded-full transition focus-visible:outline-none focus-visible:ring-2"
              style={{
                color: 'var(--sticker-repeated-text)',
                outlineColor: 'var(--sticker-repeated-border)',
              }}
              aria-label="Cerrar notificación"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

function AchievementIcon({ icon }: { icon: string }) {
  if (icon === 'trophy') {
    return (
      <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 4h12v4a6 6 0 11-12 0V4zM8 20h8M12 16v4M18 6h2a2 2 0 010 4h-2M6 6H4a2 2 0 000 4h2" />
      </svg>
    )
  }

  if (icon === 'star') {
    return (
      <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    )
  }

  return (
    <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  )
}
