import { createClient } from '@/lib/supabase/server'
import { getCollections, getCountries, getStickers, mergeStickersWithQuantity } from '@/lib/collections'
import { calcCollectionProgress } from '@/lib/progress'
import { AdSlot } from '@/components/ads/AdSlot'
import { AlbumGrid, type AlbumGridItem } from '@/components/collections/AlbumGrid'
import { EmptyState } from '@/components/ui/EmptyState'
import { SectionHeader } from '@/components/home/SectionHeader'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
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

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = user
    ? await (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase as any
    )
      .from('profiles')
      .select('nickname')
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

      <nav className="sticky top-0 z-20 border-b border-(--border) bg-(--bg)/85 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus)">
            <span className="grid size-9 place-items-center rounded-2xl bg-[linear-gradient(135deg,var(--primary),var(--accent))] text-white shadow-lg shadow-(--accent)/15">
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V7z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9h8M8 13h5" />
              </svg>
            </span>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-(--text)">stickers_checklist</h1>
              <p className="hidden text-xs text-(--muted) sm:block">Álbumes digitales</p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            {user ? (
              <>
                <Link href="/logros?back=/" className="hidden rounded-xl border border-(--border) bg-(--surface) px-3 py-2 text-sm font-medium text-(--muted) transition hover:border-(--accent)/50 hover:text-(--text) sm:inline-flex">
                  Logros
                </Link>
                <Link href="/perfil?back=/" className="hidden rounded-xl border border-(--border) bg-(--surface) px-3 py-2 text-sm font-medium text-(--muted) transition hover:border-(--accent)/50 hover:text-(--text) sm:inline-flex">
                  Perfil
                </Link>
                <span className="hidden text-sm text-(--muted) sm:block">{profile?.nickname ? `@${profile.nickname}` : user.email}</span>
                <form action="/auth/signout" method="post">
                  <button className="rounded-xl border border-(--border) bg-(--surface) px-3 py-2 text-sm font-medium text-(--muted) transition hover:border-(--primary)/50 hover:text-(--text) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus)">
                    Cerrar sesión
                  </button>
                </form>
              </>
            ) : (
              <Link href="/login" className="rounded-xl bg-(--primary) px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-(--primary)/20 transition hover:bg-(--primary-hover) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus)">
                Iniciar sesión
              </Link>
            )}
          </div>
        </div>
      </nav>

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-12">
        <section className="mb-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <span className="inline-flex items-center rounded-full border border-(--accent)/30 bg-(--accent)/10 px-3 py-1 text-xs font-semibold text-(--accent)">
              Plataforma de colecciones
            </span>
            <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight text-(--text) sm:text-5xl">
              Tus álbumes, progreso y cambios en un solo lugar.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-(--muted)">
              Explora colecciones digitales, marca lo que ya tienes y comparte tu avance para encontrar intercambios más rápido.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 rounded-3xl border border-(--border) bg-(--surface)/80 p-4 shadow-sm backdrop-blur">
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
          </div>
        </section>

        {albumItems.length === 0 ? (
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

            <section aria-labelledby="available-heading">
              <SectionHeader
                id="available-heading"
                eyebrow="Biblioteca"
                title="Álbumes disponibles"
                description="Elige una colección, revisa sus items y empieza a construir tu checklist digital."
              />
              <AlbumGrid items={albumItems} userId={user?.id ?? null} withSponsoredCard />
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
