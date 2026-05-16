import { AdSlot } from '@/components/ads/AdSlot'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { ShareQrPanel } from '@/components/share/ShareQrPanel'
import { ThemedLogo } from '@/components/ui/ThemedLogo'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { NotificationBell } from '@/components/ui/NotificationBell'
import { ResponsiveMenu } from '@/components/ui/ResponsiveMenu'
import { LogoutButton } from '@/components/auth/LogoutButton'
import { createClient } from '@/lib/supabase/server'
import { calcCollectionProgress } from '@/lib/progress'
import { getCountries, getSections, getStickers, mergeStickersWithQuantity } from '@/lib/collections'
import { calcMatchResult } from '@/lib/share'
import { getOwnerNickname } from '@/lib/profile.server'
import { FLAG_ICONS } from '@/lib/flags'
import { SITE_NAME, SITE_URL, collectionKeywords, truncateDescription } from '@/lib/seo'
import { MatchClient } from './MatchClient'
import type { Metadata } from 'next'
import type { ShareLink, Collection, UserSticker } from '@/types/album'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ token: string }>
}

async function getSharedAlbum(token: string) {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: shareLinkRaw } = await (supabase as any)
    .from('share_links')
    .select('*')
    .eq('token', token)
    .eq('is_active', true)
    .single()

  const shareLink = shareLinkRaw as ShareLink | null
  if (!shareLink) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: collectionRaw } = await (supabase as any)
    .from('collections')
    .select('*')
    .eq('id', shareLink.collection_id)
    .eq('is_active', true)
    .single()

  const collection = collectionRaw as Collection | null
  if (!collection) return null

  const [countries, sections, stickers, userStickersResult, ownerNickname] = await Promise.all([
    getCountries(collection.id),
    getSections(collection.id),
    getStickers(collection.id),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from('user_stickers').select('*').eq('user_id', shareLink.user_id).eq('collection_id', collection.id),
    getOwnerNickname(shareLink.user_id),
  ])

  const userStickers = (userStickersResult.data ?? []) as UserSticker[]
  const stickersWithQuantity = mergeStickersWithQuantity(stickers, userStickers)
  const progress = calcCollectionProgress(stickersWithQuantity, countries)

  return { shareLink, collection, countries, sections, stickers, stickersWithQuantity, progress, ownerNickname }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params
  const shared = await getSharedAlbum(token)
  const ownerLabel = shared?.ownerNickname ? `@${shared.ownerNickname}` : null
  const title = shared
    ? `Colección de ${ownerLabel ?? 'coleccionista'}: ${shared.collection.name}`
    : 'Colección compartida'
  const description = shared
    ? truncateDescription(`Consulta el progreso público de ${shared.collection.name}${ownerLabel ? ` de ${ownerLabel}` : ''}: ${shared.progress.percentage}% completado, ${shared.progress.missing} pendientes y ${shared.progress.duplicates} repetidos disponibles para intercambio.`)
    : `Consulta una colección digital compartida en ${SITE_NAME}.`
  const url = `${SITE_URL}/share/${token}`

  return {
    title,
    description,
    keywords: collectionKeywords(shared?.collection.name),
    alternates: { canonical: url },
    robots: {
      index: Boolean(shared),
      follow: true,
      googleBot: {
        index: Boolean(shared),
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: 'website',
      locale: 'es_MX',
      images: shared?.collection.cover_image_url ? [{ url: shared.collection.cover_image_url, alt: shared.collection.name }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: shared?.collection.cover_image_url ? [shared.collection.cover_image_url] : undefined,
    },
  }
}

export default async function SharePage({ params }: PageProps) {
  const { token } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const shared = await getSharedAlbum(token)

  if (!shared) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-(--bg) px-4 text-(--text)">
        <div className="max-w-sm rounded-3xl border border-(--border) bg-(--surface) p-8 text-center shadow-xl">
          <h1 className="text-xl font-bold">Enlace no válido</h1>
          <p className="mt-2 text-sm leading-6 text-(--muted)">Este enlace no existe o ya no está activo.</p>
          <Link href="/" className="mt-6 inline-flex rounded-2xl bg-(--primary) px-5 py-3 text-sm font-semibold text-white">
            Explorar álbumes
          </Link>
        </div>
      </main>
    )
  }

  const { shareLink, collection, countries, sections, stickers, stickersWithQuantity, progress, ownerNickname } = shared
  const ownerLabel = ownerNickname ? `@${ownerNickname}` : 'Este coleccionista'
  const shareUrl = `${SITE_URL}/share/${token}`
  const countryMap = new Map(countries.map(country => [country.id, country]))
  const duplicateStickers = stickersWithQuantity.filter(sticker => sticker.quantity > 1)
  const grouped = user ? new Map<string, typeof stickersWithQuantity>() : (() => {
    const map = new Map<string, typeof stickersWithQuantity>()
    for (const sticker of stickersWithQuantity) {
      const key = sticker.country_id ?? 'other'
      const current = map.get(key) ?? []
      current.push(sticker)
      map.set(key, current)
    }
    return map
  })()
  const duplicateGroups = new Map<string, typeof duplicateStickers>()
  for (const sticker of duplicateStickers) {
    const key = sticker.country_id ?? 'other'
    const current = duplicateGroups.get(key) ?? []
    current.push(sticker)
    duplicateGroups.set(key, current)
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `Álbum de ${ownerLabel}: ${collection.name}`,
    description: collection.description ?? `Progreso público de ${collection.name}: ${progress.percentage}% completado.`,
    url: shareUrl,
    isAccessibleForFree: true,
    inLanguage: 'es-MX',
    about: {
      '@type': 'CreativeWork',
      name: collection.name,
    },
    creator: ownerNickname ? {
      '@type': 'Person',
      alternateName: ownerLabel,
    } : undefined,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: stickersWithQuantity.length,
      itemListElement: stickersWithQuantity.slice(0, 80).map((sticker, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: sticker.name ?? sticker.code,
        identifier: sticker.code,
      })),
    },
  }

  const showMatch = user && user.id !== shareLink.user_id
  let matchResult = null
  if (showMatch) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const visitorUserStickersResult = await (supabase as any)
      .from('user_stickers')
      .select('*')
      .eq('user_id', user.id)
      .eq('collection_id', collection.id)
    const visitorStickers = mergeStickersWithQuantity(stickers, (visitorUserStickersResult.data ?? []) as UserSticker[])
    matchResult = calcMatchResult(stickersWithQuantity, visitorStickers)
  }

  return (
    <div className="min-h-screen bg-(--bg) text-(--text)">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,var(--hero-glow),transparent_34%),radial-gradient(circle_at_80%_0%,var(--hero-glow-secondary),transparent_30%)]" />

      <nav className="sticky top-0 z-20 border-b border-(--border) bg-(--bg)/85 px-3 py-2.5 backdrop-blur-xl sm:px-4 sm:py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 sm:gap-4">
          <Link href="/" className="flex min-w-0 shrink-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus)">
            <ThemedLogo />
          </Link>

          <div className="flex items-center gap-2">
            <NotificationBell />

            {user ? (
              <>
                <div className="hidden items-center gap-2 md:flex">
                  <ThemeToggle />
                  <Link href="/logros?back=/" className="h-10 shrink-0 rounded-xl border border-(--border) bg-(--surface) px-3 py-2 text-sm font-medium text-(--muted) transition hover:border-(--accent)/50 hover:text-(--text) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus)">
                    Logros
                  </Link>
                  <Link href="/perfil" className="h-10 shrink-0 rounded-xl border border-(--border) bg-(--surface) px-3 py-2 text-sm font-medium text-(--muted) transition hover:border-(--accent)/50 hover:text-(--text) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus)">
                    Perfil
                  </Link>
                  <LogoutButton className="h-10 shrink-0 whitespace-nowrap rounded-xl border border-(--border) bg-(--surface) px-3 py-2 text-sm font-medium text-(--muted) transition hover:border-(--primary)/50 hover:text-(--text) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus) disabled:cursor-wait disabled:opacity-70" />
                </div>

                <ResponsiveMenu>
                  <div data-menu-keep-open="true" className="flex items-center justify-between rounded-2xl bg-(--surface-soft) px-3 py-2">
                    <span className="text-sm font-semibold text-(--muted)">Tema</span>
                    <ThemeToggle />
                  </div>
                  <Link href="/logros?back=/" className="flex min-h-11 items-center rounded-2xl border border-(--border) bg-(--surface) px-3 py-2 text-sm font-semibold text-(--muted) transition hover:border-(--accent)/50 hover:bg-(--surface-hover) hover:text-(--text)">
                    Logros
                  </Link>
                  <Link href="/perfil" className="flex min-h-11 items-center rounded-2xl border border-(--border) bg-(--surface) px-3 py-2 text-sm font-semibold text-(--muted) transition hover:border-(--accent)/50 hover:bg-(--surface-hover) hover:text-(--text)">
                    Perfil
                  </Link>
                  <LogoutButton className="flex min-h-11 w-full items-center rounded-2xl border border-(--border) bg-(--surface) px-3 py-2 text-left text-sm font-semibold text-(--muted) transition hover:border-(--primary)/50 hover:bg-(--surface-hover) hover:text-(--text) disabled:cursor-wait disabled:opacity-70" />
                </ResponsiveMenu>
              </>
            ) : (
              <Link href="/login" className="rounded-xl bg-(--primary) px-4 py-2 text-sm font-semibold text-white">
                Empieza tu checklist
              </Link>
            )}
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:py-12">
        <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr] lg:items-start">
          <div className="rounded-3xl border border-(--border) bg-(--surface) p-6 shadow-xl shadow-black/5">
            {ownerNickname && (
              <p className="mt-4 text-lg font-semibold text-(--text)">
                Álbum de <span className="text-(--accent)">{ownerLabel}</span>
              </p>
            )}
            <h1 className="mt-1 text-4xl font-bold tracking-tight text-(--text) sm:text-5xl">{collection.name}</h1>
            {collection.description && <p className="mt-4 max-w-2xl text-base leading-7 text-(--muted)">{collection.description}</p>}
            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between text-sm text-(--muted)">
                <span>{progress.obtained}/{progress.total} items completados</span>
                <span className="font-bold text-(--accent)">{progress.percentage}%</span>
              </div>
              <ProgressBar percentage={progress.percentage} />
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Obtenidas" value={progress.obtained} />
              <Stat label="Pendientes" value={progress.missing} />
              <Stat label="Duplicadas" value={progress.duplicates} />
              <Stat label="Países completos" value={progress.completedCountries} />
            </div>
          </div>

          <div className="space-y-4">
            <ShareQrPanel shareUrl={shareUrl} />
            {showMatch ? (
              <div className="rounded-3xl border border-(--accent)/30 bg-(--accent)/8 p-5 shadow-sm">
                <h2 className="text-lg font-bold text-(--text)">¡Puedes intercambiar!</h2>
                <p className="mt-2 text-sm leading-6 text-(--muted)">
                  {ownerNickname
                    ? `${ownerLabel} tiene algunos repetidos que podrían servirte. Más abajo verás los posibles intercambios.`
                    : 'Más abajo verás qué elementos pueden intercambiarse entre tu colección y la de este usuario.'}
                </p>
                <div className="mt-4 flex flex-col gap-2">
                  <Link href="/" className="rounded-2xl bg-(--accent) px-4 py-3 text-center text-sm font-semibold text-white">Ver mi colección</Link>
                  <Link href="/" className="rounded-2xl border border-(--border) bg-(--surface-soft) px-4 py-3 text-center text-sm font-semibold text-(--text)">Mi colección</Link>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-(--border) bg-(--surface) p-5 shadow-sm">
                <h2 className="text-lg font-bold text-(--text)">Crea tu propia colección</h2>
                <p className="mt-2 text-sm leading-6 text-(--muted)">Guarda una copia, empieza tu checklist y comparte tu avance con otras personas.</p>
                <div className="mt-4 flex flex-col gap-2">
                  <Link href="/login" className="rounded-2xl bg-(--primary) px-4 py-3 text-center text-sm font-semibold text-white">Empieza tu checklist</Link>
                  <Link href="/" className="rounded-2xl border border-(--border) bg-(--surface-soft) px-4 py-3 text-center text-sm font-semibold text-(--text)">Ver más colecciones</Link>
                </div>
              </div>
            )}
          </div>
        </section>

        <AdSlot title="Patrocinio contextual" description="Bloque preparado para marcas de coleccionables, sin interrumpir lectura ni navegación." />

        {matchResult && (
          <section id="intercambios" aria-label="Comparación de intercambios">
            <MatchClient
              matchResult={matchResult}
              ownerName={ownerLabel}
              countries={countries}
              sections={sections}
              embedded
              exchangeContext={showMatch ? {
                collectionId: collection.id,
                ownerId: shareLink.user_id,
                shareToken: token,
              } : undefined}
            />
          </section>
        )}

        {!user && <section>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-(--text)">Duplicadas disponibles</h2>
              <p className="mt-2 text-sm text-(--muted)">
                {duplicateStickers.length > 0
                  ? `${ownerLabel} tiene ${progress.duplicates} repetidos en ${duplicateStickers.length} elementos.`
                  : `${ownerLabel} todavía no tiene elementos duplicados.`}
              </p>
            </div>
            <span className="w-fit rounded-full border border-(--accent)/30 bg-(--accent)/10 px-4 py-2 text-sm font-bold text-(--accent)">
              {progress.duplicates} extras
            </span>
          </div>

          {duplicateGroups.size > 0 ? (
            <div className="mt-5 space-y-4">
              {Array.from(duplicateGroups.entries()).map(([countryId, stickers]) => {
                const country = countryMap.get(countryId)
                return (
                  <article key={countryId} className="rounded-3xl border border-(--accent)/25 bg-(--surface) p-5 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="flex items-center gap-2 font-semibold text-(--text)">
                        {country && FLAG_ICONS[country.code] && (
                          <span className={`fi fi-${FLAG_ICONS[country.code]} text-xl`} aria-hidden="true" />
                        )}
                        <span>{country?.name ?? 'Sección especial'}</span>
                      </h3>
                      <span className="rounded-full border border-(--accent)/30 bg-(--accent)/10 px-3 py-1 text-xs font-semibold text-(--accent)">
                        {stickers.reduce((total, sticker) => total + Math.max(0, sticker.quantity - 1), 0)} extras
                      </span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {stickers.map(sticker => (
                        <span
                          key={sticker.id}
                          className="inline-flex items-center gap-2 rounded-xl border border-(--accent)/30 bg-(--accent)/10 px-3 py-2 text-xs font-semibold text-(--accent)"
                        >
                          <span className="font-mono">{sticker.code}</span>
                          {sticker.name && <span className="max-w-36 truncate text-(--text)">{sticker.name}</span>}
                          <span className="rounded-full bg-(--accent) px-2 py-0.5 text-[10px] font-bold text-white">
                            x{sticker.quantity - 1}
                          </span>
                        </span>
                      ))}
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="mt-5 rounded-3xl border border-dashed border-(--border) bg-(--surface) p-6 text-sm text-(--muted)">
              Cuando marque repetidas, aparecerán aquí para facilitar intercambios.
            </div>
          )}
        </section>}

        {!user && (
          <section>
            <h2 className="text-2xl font-bold tracking-tight text-(--text)">Checklist visible</h2>
            <div className="mt-5 space-y-4">
              {Array.from(grouped.entries()).map(([countryId, stickers]) => {
                const country = countryMap.get(countryId)
                const obtained = stickers.filter(sticker => sticker.quantity > 0).length
                return (
                  <article key={countryId} className="rounded-3xl border border-(--border) bg-(--surface) p-5 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="flex items-center gap-2 font-semibold text-(--text)">
                        {country && FLAG_ICONS[country.code] && (
                          <span className={`fi fi-${FLAG_ICONS[country.code]} text-xl`} aria-hidden="true" />
                        )}
                        <span>{country?.name ?? 'Sección especial'}</span>
                      </h3>
                      <span className="rounded-full border border-(--border) bg-(--surface-soft) px-3 py-1 text-xs text-(--muted)">
                        {obtained}/{stickers.length}
                      </span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2 min-[420px]:grid-cols-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9">
                      {stickers.map(sticker => (
                        <div
                          key={sticker.id}
                          className={`rounded-2xl border p-3 text-center text-xs ${
                            sticker.quantity > 0
                              ? 'border-(--accent)/40 bg-(--accent)/10 text-(--accent)'
                              : 'border-(--border) bg-(--surface-soft) text-(--muted)'
                          }`}
                        >
                          <div className="font-mono font-bold">{sticker.code}</div>
                          <div className="mt-1 line-clamp-2 text-[11px]">{sticker.name ?? (sticker.quantity > 0 ? 'Completada' : 'Pendiente')}</div>
                        </div>
                      ))}
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        )}

        <AdSlot variant="footer" title="Premium sin anuncios" description="Estructura lista para futuros planes con álbumes privados, estadísticas avanzadas y exportación de progreso." />
      </main>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-(--border) bg-(--surface-soft) p-3">
      <div className="text-2xl font-bold text-(--text)">{value}</div>
      <div className="mt-1 text-xs text-(--muted)">{label}</div>
    </div>
  )
}
