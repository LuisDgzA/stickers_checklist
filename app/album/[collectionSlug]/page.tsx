import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AlbumClient } from './AlbumClient'
import { getCollectionBySlug, getGroups, getCountries, getSections, getStickers, mergeStickersWithQuantity } from '@/lib/collections'
import { loginPathForRedirect } from '@/lib/auth-redirect'
import { SITE_NAME, SITE_URL, collectionKeywords, truncateDescription } from '@/lib/seo'
import type { Metadata } from 'next'

interface PageProps {
  params: Promise<{ collectionSlug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { collectionSlug } = await params
  const collection = await getCollectionBySlug(collectionSlug)
  const title = collection ? `${collection.name} checklist` : 'Álbum'
  const description = truncateDescription(
    collection?.description
      ? `${collection.description}. Checklist privado para registrar progreso, faltantes y repetidas.`
      : 'Checklist privado para registrar progreso, faltantes y repetidas.'
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

export default async function AlbumPage({ params }: PageProps) {
  const { collectionSlug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect(loginPathForRedirect(`/album/${collectionSlug}`))

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

  const collection = await getCollectionBySlug(collectionSlug)
  if (!collection) redirect('/')

  const [groups, countries, sections, stickers, userStickersResult, achievementsResult, profileResult] = await Promise.all([
    getGroups(collection.id),
    getCountries(collection.id),
    getSections(collection.id),
    getStickers(collection.id),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from('user_stickers').select('sticker_id, quantity').eq('user_id', user.id).eq('collection_id', collection.id),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from('user_achievements').select('achievement_code').eq('user_id', user.id).eq('collection_id', collection.id),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from('profiles').select('nickname').eq('id', user.id).single(),
  ])

  const userStickers = userStickersResult.data ?? []

  const stickersWithQuantity = mergeStickersWithQuantity(stickers, userStickers)

  return (
    <AlbumClient
      user={{ id: user.id, email: user.email ?? '', nickname: profileResult.data?.nickname ?? user.email ?? '' }}
      collection={collection}
      groups={groups}
      countries={countries}
      sections={sections}
      stickersWithQuantity={stickersWithQuantity}
      unlockedAchievementCodes={(achievementsResult.data ?? []).map((row: { achievement_code: string }) => row.achievement_code)}
    />
  )
}
