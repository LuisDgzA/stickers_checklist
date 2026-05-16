import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCountries, getStickers, mergeStickersWithQuantity } from '@/lib/collections'
import { getOwnerNickname } from '@/lib/profile.server'
import { ExchangeDetailClient } from './ExchangeDetailClient'
import type { ExchangeRequest, UserSticker } from '@/types/album'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ExchangePage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rawRequest } = await (supabase as any)
    .from('exchange_requests')
    .select('*')
    .eq('id', id)
    .single()

  const request = rawRequest as ExchangeRequest | null
  if (!request) notFound()

  const isOwner = user.id === request.owner_id
  const isRequester = user.id === request.requester_id
  if (!isOwner && !isRequester) notFound()

  const [countries, stickers, ownerNickname, requesterNickname] = await Promise.all([
    getCountries(request.collection_id),
    getStickers(request.collection_id),
    getOwnerNickname(request.owner_id),
    getOwnerNickname(request.requester_id),
  ])

  // Fetch quantities for both users to show sticker details
  const [ownerUserStickersResult, requesterUserStickersResult] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('user_stickers')
      .select('*')
      .eq('user_id', request.owner_id)
      .eq('collection_id', request.collection_id),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('user_stickers')
      .select('*')
      .eq('user_id', request.requester_id)
      .eq('collection_id', request.collection_id),
  ])

  const ownerStickerRows = (ownerUserStickersResult.data ?? []) as UserSticker[]
  const requesterStickerRows = (requesterUserStickersResult.data ?? []) as UserSticker[]
  const ownerQuantitiesReadable = ownerStickerRows.length > 0 || request.owner_gives.length === 0
  const requesterQuantitiesReadable = requesterStickerRows.length > 0 || request.requester_gives.length === 0

  const ownerStickers = mergeStickersWithQuantity(stickers, ownerStickerRows)
  const requesterStickers = mergeStickersWithQuantity(stickers, requesterStickerRows)

  const ownerGivesStickers = ownerStickers.filter(s => request.owner_gives.includes(s.id))
  const requesterGivesStickers = requesterStickers.filter(s => request.requester_gives.includes(s.id))

  // Stickers que ya no tienen suficientes repetidas (quantity < 2) para completar el intercambio
  const ownerStickerMap = new Map(ownerStickers.map(s => [s.id, s]))
  const requesterStickerMap = new Map(requesterStickers.map(s => [s.id, s]))
  const unavailableOwnerGives = request.owner_gives.filter(id => {
    if (!ownerQuantitiesReadable) return false
    const s = ownerStickerMap.get(id)
    return !s || s.quantity < 2
  })
  const unavailableRequesterGives = request.requester_gives.filter(id => {
    if (!requesterQuantitiesReadable) return false
    const s = requesterStickerMap.get(id)
    return !s || s.quantity < 2
  })

  const ownerName = ownerNickname ? `@${ownerNickname}` : 'El dueño'
  const requesterName = requesterNickname ? `@${requesterNickname}` : 'El solicitante'

  return (
    <ExchangeDetailClient
      exchangeId={request.id}
      status={request.status}
      isOwner={isOwner}
      requesterName={requesterName}
      ownerName={ownerName}
      ownerGives={ownerGivesStickers}
      requesterGives={requesterGivesStickers}
      unavailableOwnerGives={unavailableOwnerGives}
      unavailableRequesterGives={unavailableRequesterGives}
      countries={countries}
      shareToken={request.share_token}
    />
  )
}
