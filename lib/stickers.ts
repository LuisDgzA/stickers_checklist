import { createClient } from '@/lib/supabase/client'
import { enqueueUpdate, getPendingUpdates, removeUpdate } from '@/lib/offline-queue'

const MIN_QUANTITY = 0
const MAX_QUANTITY = 1000

export async function updateStickerQuantity(
  userId: string,
  collectionId: string,
  stickerId: string,
  quantity: number
): Promise<void> {
  const clamped = Math.min(MAX_QUANTITY, Math.max(MIN_QUANTITY, quantity))

  if (!navigator.onLine) {
    await enqueueUpdate({ userId, collectionId, stickerId, quantity: clamped })
    return
  }

  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('user_stickers')
    .upsert(
      { user_id: userId, collection_id: collectionId, sticker_id: stickerId, quantity: clamped, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,sticker_id' }
    )

  if (error) throw error
}

export async function syncOfflineQueue(): Promise<number> {
  const pending = await getPendingUpdates()
  if (!pending.length) return 0

  const supabase = createClient()
  let synced = 0

  await Promise.all(
    pending.map(async (update) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('user_stickers')
        .upsert(
          {
            user_id: update.userId,
            collection_id: update.collectionId,
            sticker_id: update.stickerId,
            quantity: update.quantity,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,sticker_id' }
        )
      if (!error) {
        await removeUpdate(update.id)
        synced++
      }
    })
  )

  return synced
}

export { MIN_QUANTITY, MAX_QUANTITY }
