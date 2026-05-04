import { createClient } from '@/lib/supabase/client'
import { getStickers, mergeStickersWithQuantity } from '@/lib/collections'
import type { ShareLink, StickerWithQuantity, MatchResult } from '@/types/album'
import type { Database } from '@/types/database'

type StickerRow = Database['public']['Tables']['stickers']['Row']
type UserStickerRow = Database['public']['Tables']['user_stickers']['Row']

function generateToken(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 16)
}

export async function getOrCreateShareLink(userId: string, collectionId: string): Promise<ShareLink> {
  const supabase = createClient()

  const { data: existing } = await supabase
    .from('share_links')
    .select('*')
    .eq('user_id', userId)
    .eq('collection_id', collectionId)
    .eq('is_active', true)
    .single()

  if (existing) return existing

  const token = generateToken()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('share_links')
    .insert({ user_id: userId, collection_id: collectionId, token, is_active: true })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getShareLinkByToken(token: string): Promise<ShareLink | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('share_links')
    .select('*')
    .eq('token', token)
    .eq('is_active', true)
    .single()
  if (error) return null
  return data
}

export async function getUserStickersForMatch(userId: string, collectionId: string): Promise<StickerWithQuantity[]> {
  const supabase = createClient()
  const [stickers, userStickersResult] = await Promise.all([
    getStickers(collectionId),
    supabase
      .from('user_stickers')
      .select('sticker_id, quantity')
      .eq('user_id', userId)
      .eq('collection_id', collectionId),
  ])
  return mergeStickersWithQuantity(stickers, userStickersResult.data ?? [])
}

export function calcMatchResult(
  ownerStickers: StickerWithQuantity[],
  visitorStickers: StickerWithQuantity[]
): MatchResult {
  const visitorMap = new Map(visitorStickers.map(s => [s.id, s.quantity]))
  const ownerMap = new Map(ownerStickers.map(s => [s.id, s.quantity]))

  const ownerCanGive = ownerStickers.filter(s => {
    const visitorQty = visitorMap.get(s.id) ?? 0
    return s.quantity > 1 && visitorQty === 0
  })

  const visitorCanGive = visitorStickers.filter(s => {
    const ownerQty = ownerMap.get(s.id) ?? 0
    return s.quantity > 1 && ownerQty === 0
  })

  const possibleExchanges = Math.min(ownerCanGive.length, visitorCanGive.length)

  return { ownerCanGive, visitorCanGive, possibleExchanges }
}

export function getShareUrl(token: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? (typeof window !== 'undefined' ? window.location.origin : '')
  return `${base}/share/${token}`
}
