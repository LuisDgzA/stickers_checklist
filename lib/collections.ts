import { createClient } from '@/lib/supabase/client'
import type { Sticker, UserSticker, StickerWithQuantity } from '@/types/album'

export { getCollections, getCollectionBySlug, getGroups, getCountries, getSections, getStickers } from '@/lib/static-data'

export async function getUserStickers(userId: string, collectionId: string): Promise<UserSticker[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('user_stickers')
    .select('*')
    .eq('user_id', userId)
    .eq('collection_id', collectionId)
  if (error) throw error
  return data
}

export function mergeStickersWithQuantity(
  stickers: Sticker[],
  userStickers: { sticker_id: string; quantity: number }[]
): StickerWithQuantity[] {
  const quantityMap = new Map(userStickers.map(us => [us.sticker_id, us.quantity]))
  return stickers.map(s => ({
    ...s,
    quantity: quantityMap.get(s.id) ?? 0,
  }))
}
