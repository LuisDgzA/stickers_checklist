import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AlbumClient } from './AlbumClient'
import { getCollectionBySlug, getGroups, getCountries, getSections, getStickers, mergeStickersWithQuantity } from '@/lib/collections'
import { DEMO_ALBUM_SLUG, demoCollection, demoCountries, demoGroups, demoSections, getDemoStickers } from '@/lib/demo-album'
import { SITE_NAME, SITE_URL, collectionKeywords, truncateDescription } from '@/lib/seo'
import type { Metadata } from 'next'

interface PageProps {
  params: Promise<{ collectionSlug: string }>
  searchParams?: Promise<{ onboarding?: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { collectionSlug } = await params
  const collection = collectionSlug === DEMO_ALBUM_SLUG ? demoCollection : await getCollectionBySlug(collectionSlug)
  const title = collection ? `${collection.name} checklist` : 'Colección'
  const description = truncateDescription(
    collection?.description
      ? `${collection.description}. Checklist privado para registrar progreso, pendientes y repetidos.`
      : 'Checklist privado para registrar progreso, pendientes y repetidos.'
  )

  return {
    title,
    description,
    keywords: collectionKeywords(collection?.name),
    alternates: { canonical: `${SITE_URL}/album/${collectionSlug}` },
    robots: { index: false, follow: false },
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      url: `${SITE_URL}/album/${collectionSlug}`,
      siteName: SITE_NAME,
      type: 'website',
      images: collection?.cover_image_url ? [{ url: collection.cover_image_url, alt: collection.name }] : undefined,
    },
  }
}

export default async function AlbumPage({ params, searchParams }: PageProps) {
  const { collectionSlug } = await params
  const query = await searchParams
  const continueOnboarding = query?.onboarding === 'album'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (collectionSlug === DEMO_ALBUM_SLUG) {
    const demoProfileResult = user
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? await (supabase as any).from('profiles').select('nickname').eq('id', user.id).single()
      : { data: null }

    return (
      <AlbumClient
        user={user ? { id: user.id, email: user.email ?? '', nickname: demoProfileResult.data?.nickname ?? user.user_metadata?.nickname ?? user.email ?? '' } : null}
        collection={demoCollection}
        groups={demoGroups}
        countries={demoCountries}
        sections={demoSections}
        stickersWithQuantity={getDemoStickers()}
        unlockedAchievementCodes={[]}
        mode="sandbox"
        continueOnboarding={continueOnboarding}
      />
    )
  }

  if (user) {
    // Garantiza que el perfil existe (puede no haberse creado si el trigger falló)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('profiles').upsert(
      {
        id: user.id,
        email: user.email ?? null,
        full_name: user.user_metadata?.full_name ?? '',
        nickname: user.user_metadata?.nickname ?? null,
        avatar_url: user.user_metadata?.avatar_url ?? null,
      },
      { onConflict: 'id', ignoreDuplicates: true }
    )
  }

  const collection = await getCollectionBySlug(collectionSlug)
  if (!collection) redirect('/')

  const [groups, countries, sections, stickers, userStickersResult, achievementsResult, profileResult] = await Promise.all([
    getGroups(collection.id),
    getCountries(collection.id),
    getSections(collection.id),
    getStickers(collection.id),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    user ? (supabase as any).from('user_stickers').select('sticker_id, quantity').eq('user_id', user.id).eq('collection_id', collection.id) : Promise.resolve({ data: [] }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    user ? (supabase as any).from('user_achievements').select('achievement_code').eq('user_id', user.id).eq('collection_id', collection.id) : Promise.resolve({ data: [] }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    user ? (supabase as any).from('profiles').select('nickname').eq('id', user.id).single() : Promise.resolve({ data: null }),
  ])

  const userStickers = userStickersResult.data ?? []

  const stickersWithQuantity = mergeStickersWithQuantity(stickers, userStickers)

  return (
    <AlbumClient
      user={user ? { id: user.id, email: user.email ?? '', nickname: profileResult.data?.nickname ?? user.email ?? '' } : null}
      collection={collection}
      groups={groups}
      countries={countries}
      sections={sections}
      stickersWithQuantity={stickersWithQuantity}
      unlockedAchievementCodes={(achievementsResult.data ?? []).map((row: { achievement_code: string }) => row.achievement_code)}
      mode={user ? 'authenticated' : 'preview'}
      continueOnboarding={continueOnboarding}
    />
  )
}
