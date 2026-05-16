'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function proposeExchange({
  collectionId,
  ownerId,
  shareToken,
  ownerGives,
  requesterGives,
}: {
  collectionId: string
  ownerId: string
  shareToken: string
  ownerGives: string[]
  requesterGives: string[]
}): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')
  if (user.id === ownerId) throw new Error('No puedes intercambiar contigo mismo')
  if (ownerGives.length === 0 && requesterGives.length === 0) throw new Error('Selecciona al menos una estampa')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('exchange_requests')
    .insert({
      collection_id: collectionId,
      requester_id: user.id,
      owner_id: ownerId,
      requester_gives: requesterGives,
      owner_gives: ownerGives,
      status: 'pending',
      share_token: shareToken,
    })
    .select('id')
    .single()

  if (error) throw error
  return data.id as string
}

export async function acceptExchange(exchangeId: string): Promise<void> {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).rpc('execute_exchange', { p_exchange_id: exchangeId })
  if (error) throw error
  revalidatePath('/exchanges')
  revalidatePath(`/exchange/${exchangeId}`)
}

export async function rejectExchange(exchangeId: string): Promise<void> {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('exchange_requests')
    .update({ status: 'rejected', updated_at: new Date().toISOString() })
    .eq('id', exchangeId)
  if (error) throw error
  revalidatePath('/exchanges')
  revalidatePath(`/exchange/${exchangeId}`)
}

export async function cancelExchange(exchangeId: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('exchange_requests')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', exchangeId)
    .eq('requester_id', user.id)
  if (error) throw error
  revalidatePath('/exchanges')
  revalidatePath(`/exchange/${exchangeId}`)
}
