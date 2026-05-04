import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AlbumClient } from './AlbumClient'
import { getCollectionBySlug, getGroups, getCountries, getSections, getStickers, mergeStickersWithQuantity } from '@/lib/collections'

interface PageProps {
  params: Promise<{ collectionSlug: string }>
}

export default async function AlbumPage({ params }: PageProps) {
  const { collectionSlug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Garantiza que el perfil existe (puede no haberse creado si el trigger falló)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from('profiles').upsert(
    {
      id: user.id,
      email: user.email ?? null,
      full_name: user.user_metadata?.full_name ?? null,
      avatar_url: user.user_metadata?.avatar_url ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  )

  const collection = await getCollectionBySlug(collectionSlug)
  if (!collection) redirect('/')

  const [groups, countries, sections, stickers, userStickersResult] = await Promise.all([
    getGroups(collection.id),
    getCountries(collection.id),
    getSections(collection.id),
    getStickers(collection.id),
    supabase.from('user_stickers').select('sticker_id, quantity').eq('user_id', user.id).eq('collection_id', collection.id),
  ])

  const userStickers = userStickersResult.data ?? []

  const stickersWithQuantity = mergeStickersWithQuantity(stickers, userStickers)

  return (
    <AlbumClient
      user={{ id: user.id, email: user.email ?? '' }}
      collection={collection}
      groups={groups}
      countries={countries}
      sections={sections}
      stickersWithQuantity={stickersWithQuantity}
    />
  )
}
