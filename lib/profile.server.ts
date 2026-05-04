import { unstable_cache } from 'next/cache'
import { createClient } from '@/lib/supabase/client'

// Cached per user-id, 1 hour TTL, tag-invalidatable when profile updates
export function getOwnerNickname(userId: string): Promise<string | null> {
  return unstable_cache(
    async () => {
      const supabase = createClient()
      const { data } = await (supabase as any).rpc('get_user_nickname', { p_user_id: userId })
      return (data as string | null) ?? null
    },
    [`profile-nickname-${userId}`],
    { tags: [`profile-${userId}`], revalidate: 3600 }
  )()
}
