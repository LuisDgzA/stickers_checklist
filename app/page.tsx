import { createClient } from '@/lib/supabase/server'
import { getCollections, getCountries, getStickers, mergeStickersWithQuantity } from '@/lib/collections'
import { calcCollectionProgress } from '@/lib/progress'
import { AdSlot } from '@/components/ads/AdSlot'
import { AlbumGrid, type AlbumGridItem } from '@/components/collections/AlbumGrid'
import { SandboxTutorialAlbumCard } from '@/components/collections/SandboxTutorialAlbumCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { SectionHeader } from '@/components/home/SectionHeader'
import { HubHomeTutorialController } from '@/components/home/HubHomeTutorial'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { NotificationBell } from '@/components/ui/NotificationBell'
import { ThemedLogo } from '@/components/ui/ThemedLogo'
import { ResponsiveMenu } from '@/components/ui/ResponsiveMenu'
import { LogoutButton } from '@/components/auth/LogoutButton'
import { HUB_HOME_TUTORIAL_VERSION } from '@/lib/hub-home-tutorial'
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE, SITE_NAME, SITE_URL, collectionKeywords } from '@/lib/seo'
import type { Metadata } from 'next'
import Link from 'next/link'

export async function generateMetadata(): Promise<Metadata> {
  const collections = await getCollections().catch(() => [])
  const featured = collections[0]

  return {
    title: { absolute: DEFAULT_TITLE },
    description: DEFAULT_DESCRIPTION,
    keywords: collectionKeywords(featured?.name),
    alternates: { canonical: SITE_URL },
    openGraph: {
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
      url: SITE_URL,
      siteName: SITE_NAME,
      type: 'website',
      locale: 'es_MX',
      images: featured?.cover_image_url ? [{ url: featured.cover_image_url, alt: featured.name }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
      images: featured?.cover_image_url ? [featured.cover_image_url] : undefined,
    },
  }
}

interface HomePageProps {
  searchParams?: Promise<{ onboarding?: string; code?: string }>
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams

  // Supabase email confirmation lands here if /auth/callback isn't whitelisted yet
  if (params?.code) {
    const { redirect } = await import('next/navigation')
    redirect(`/auth/callback?code=${params.code}`)
  }

  const isHomeOnboarding = params?.onboarding === 'home'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = user
    ? await (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase as any
    )
      .from('profiles')
      .select('nickname, hub_home_tutorial_seen, hub_home_tutorial_version')
      .eq('id', user.id)
      .single()
    : { data: null }
  const collections = await getCollections().catch(() => [])
  const albumItems: AlbumGridItem[] = await Promise.all(collections.map(async collection => {
    if (!user) return { collection }

    try {
      const [countries, stickers, userStickersResult] = await Promise.all([
        getCountries(collection.id),
        getStickers(collection.id),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any).from('user_stickers').select('*').eq('user_id', user.id).eq('collection_id', collection.id),
      ])
      const stickersWithQuantity = mergeStickersWithQuantity(stickers, userStickersResult.data ?? [])
      return { collection, progress: calcCollectionProgress(stickersWithQuantity, countries) }
    } catch {
      return { collection }
    }
  }))
  const continueItems = albumItems.filter(item => item.progress && item.progress.percentage > 0 && item.progress.percentage < 100)
  const popularItems = albumItems.slice(0, 3)
  const displayNickname = profile?.nickname ? `@${profile.nickname}` : null
  const hasSeenHubTutorial = Boolean(profile?.hub_home_tutorial_seen) && Number(profile?.hub_home_tutorial_version ?? 0) >= HUB_HOME_TUTORIAL_VERSION
  const shouldMountSandboxTutorialCard = isHomeOnboarding || !hasSeenHubTutorial
  const shouldShowSandboxTutorialCard = isHomeOnboarding
  const hasLibraryContent = albumItems.length > 0 || shouldMountSandboxTutorialCard

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}#website`,
        name: SITE_NAME,
        url: SITE_URL,
        description: DEFAULT_DESCRIPTION,
        inLanguage: 'es-MX',
      },
      {
        '@type': 'WebApplication',
        '@id': `${SITE_URL}#app`,
        name: SITE_NAME,
        applicationCategory: 'LifestyleApplication',
        operatingSystem: 'Web',
        url: SITE_URL,
        description: DEFAULT_DESCRIPTION,
      },
      {
        '@type': 'CollectionPage',
        name: SITE_NAME,
        description: DEFAULT_DESCRIPTION,
        url: SITE_URL,
        mainEntity: {
          '@type': 'ItemList',
          itemListElement: collections.map((collection, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            url: `${SITE_URL}/album/${collection.slug}`,
            name: collection.name,
            description: collection.description ?? undefined,
          })),
        },
      },
    ],
  }

  return (
    <div className="min-h-screen bg-(--bg) text-(--text)">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,var(--hero-glow),transparent_34%),radial-gradient(circle_at_80%_0%,var(--hero-glow-secondary),transparent_30%)]" />

      <nav className="sticky top-0 z-20 border-b border-(--border) bg-(--bg)/85 px-3 py-2.5 backdrop-blur-xl sm:px-4 sm:py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 sm:gap-4">
          <Link href="/" className="flex min-w-0 shrink-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus)">
            <ThemedLogo />
          </Link>

          <div className="flex items-center gap-2">
            {user && <NotificationBell />}

            <div className="hidden items-center gap-2 md:flex">
              <ThemeToggle />
              <HubHomeTutorialController userId={user?.id ?? null} initialSeen={user ? hasSeenHubTutorial : null} />
              {user ? (
                <>
                  <Link data-tutorial="achievements-link" href="/logros?back=/" className="h-10 shrink-0 rounded-xl border border-(--border) bg-(--surface) px-3 py-2 text-sm font-medium text-(--muted) transition hover:border-(--accent)/50 hover:text-(--text) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus)">
                    Logros
                  </Link>
                  <Link data-tutorial="profile-link" href="/perfil" className="h-10 shrink-0 rounded-xl border border-(--border) bg-(--surface) px-3 py-2 text-sm font-medium text-(--muted) transition hover:border-(--accent)/50 hover:text-(--text) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus)">
                    Perfil
                  </Link>
                  <LogoutButton className="h-10 shrink-0 whitespace-nowrap rounded-xl border border-(--border) bg-(--surface) px-3 py-2 text-sm font-medium text-(--muted) transition hover:border-(--primary)/50 hover:text-(--text) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus) disabled:cursor-wait disabled:opacity-70" />
                </>
              ) : (
                <Link data-tutorial="login-entry" href="/login" className="h-10 shrink-0 whitespace-nowrap rounded-xl bg-(--primary) px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-(--primary)/20 transition hover:bg-(--primary-hover) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus)">
                  Iniciar sesión
                </Link>
              )}
            </div>

            {!user && <Link data-tutorial="login-entry" href="/login" className="flex items-center rounded-xl bg-(--primary) px-3 py-2 text-sm font-semibold text-white md:hidden">
              Iniciar sesión
            </Link>}

            <ResponsiveMenu targetAttribute={{ 'data-tutorial': 'home-menu-button' }}>
              <div data-menu-keep-open="true" className="flex items-center justify-between rounded-2xl bg-(--surface-soft) px-3 py-2">
                <span className="text-sm font-semibold text-(--muted)">Tema</span>
                <ThemeToggle />
              </div>
              <HubHomeTutorialController userId={user?.id ?? null} initialSeen={user ? hasSeenHubTutorial : null} />
            {user ? (
              <>
                <Link data-tutorial="achievements-link" href="/logros?back=/" className="flex min-h-11 items-center rounded-2xl border border-(--border) bg-(--surface) px-3 py-2 text-sm font-semibold text-(--muted) transition hover:border-(--accent)/50 hover:bg-(--surface-hover) hover:text-(--text) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus)">
                  Logros
                </Link>
                <Link data-tutorial="profile-link" href={`/perfil`} className="flex min-h-11 items-center rounded-2xl border border-(--border) bg-(--surface) px-3 py-2 text-sm font-semibold text-(--muted) transition hover:border-(--accent)/50 hover:bg-(--surface-hover) hover:text-(--text) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus)">
                  Perfil
                </Link>
                <LogoutButton className="flex min-h-11 w-full items-center rounded-2xl border border-(--border) bg-(--surface) px-3 py-2 text-left text-sm font-semibold text-(--muted) transition hover:border-(--primary)/50 hover:bg-(--surface-hover) hover:text-(--text) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus) disabled:cursor-wait disabled:opacity-70" />
              </>
            ) : (
              <Link data-tutorial="login-entry" href="/login" className="flex min-h-11 items-center justify-center rounded-2xl bg-(--primary) px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-(--primary)/20 transition hover:bg-(--primary-hover) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus)">
                Iniciar sesión
              </Link>
            )}
            </ResponsiveMenu>
          </div>
        </div>
      </nav>

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-12">
        <section data-tutorial="hub-hero" className="mb-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <span className="inline-flex items-center rounded-full border border-(--accent)/30 bg-(--accent)/10 px-3 py-1 text-md font-semibold text-(--accent)">
              {displayNickname ? `Hola, ${displayNickname}` : 'Plataforma de colecciones'}
            </span>
            <h1 className="mt-4 max-w-3xl text-3xl font-bold leading-tight tracking-tight text-(--text) min-[380px]:text-4xl sm:text-5xl">
              {displayNickname ? 'Tus colecciones, progreso y cambios en un solo lugar.' : 'Álbumes, progreso y cambios en un solo lugar.'}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-(--muted)">
              Explora colecciones digitales, marca lo que ya tienes y comparte tu avance para encontrar intercambios más rápido.
            </p>
          </div>

          {/* <div data-tutorial="hub-actions" className="grid grid-cols-3 gap-3 rounded-3xl border border-(--border) bg-(--surface)/80 p-4 shadow-sm backdrop-blur">
            <div>
              <div className="text-2xl font-bold text-(--text)">{collections.length}</div>
              <div className="mt-1 text-xs text-(--muted)">Colecciones</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-(--text)">QR</div>
              <div className="mt-1 text-xs text-(--muted)">Comparte</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-(--text)">Progreso</div>
              <div className="mt-1 text-xs text-(--muted)">por álbum</div>
            </div>
          </div> */}
        </section>

        {!hasLibraryContent ? (
          <EmptyState
            title="No hay colecciones disponibles"
            description="Cuando agregues álbumes activos aparecerán aquí como tarjetas listas para abrir y compartir."
          />
        ) : (
          <div className="space-y-12">
            {continueItems.length > 0 && (
              <section aria-labelledby="continue-heading">
                <SectionHeader
                  id="continue-heading"
                  eyebrow="Tu progreso"
                  title="Continúa donde lo dejaste"
                  description="Accede rápido a los álbumes que ya empezaste y comparte tu avance con QR."
                />
                <AlbumGrid items={continueItems} userId={user?.id ?? null} />
              </section>
            )}

            <AdSlot
              title="Monetización preparada sin interrumpir"
              description="Banner elegante para patrocinios, tiendas o campañas relacionadas con coleccionables."
            />

            <section data-tutorial="album-library" aria-labelledby="available-heading">
              <SectionHeader
                id="available-heading"
                eyebrow="Biblioteca"
                title="Álbumes disponibles"
                description="Elige una colección, revisa sus items y empieza a construir tu checklist digital."
              />
              <AlbumGrid
                items={albumItems}
                userId={user?.id ?? null}
                leadingContent={shouldMountSandboxTutorialCard ? (
                    <SandboxTutorialAlbumCard
                      userId={user?.id ?? null}
                      initialVisible={shouldShowSandboxTutorialCard}
                    />
                ) : null}
                withSponsoredCard
              />
            </section>

            <section aria-labelledby="popular-heading">
              <SectionHeader
                id="popular-heading"
                eyebrow="Descubrimiento"
                title="Populares"
                description="Colecciones destacadas para empezar rápido o compartir con amigos."
              />
              <AlbumGrid items={popularItems} userId={user?.id ?? null} />
            </section>

            <AdSlot
              variant="footer"
              title="Planes premium listos para crecer"
              description="Espacio futuro para destacar beneficios como álbumes sin anuncios, estadísticas avanzadas, privacidad y exportación de progreso."
            />
          </div>
        )}
      </main>
    </div>
  )
}
