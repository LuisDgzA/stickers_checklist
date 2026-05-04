import { createClient } from '@/lib/supabase/client'

const NICKNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/

// Session-level cache: only stores "taken" results (stable within a session).
// "Available" results are never cached — another user could register the nick.
const takenCache = new Set<string>()

export function validateNicknameFormat(nickname: string): string | null {
  if (nickname.length < 3) return 'Mínimo 3 caracteres'
  if (nickname.length > 20) return 'Máximo 20 caracteres'
  if (!NICKNAME_REGEX.test(nickname)) return 'Solo letras, números y guiones bajos'
  return null
}

export async function checkNicknameAvailable(nickname: string): Promise<boolean> {
  const key = nickname.toLowerCase()
  if (takenCache.has(key)) return false

  const supabase = createClient()
  const { data, error } = await supabase.rpc('check_nickname_available', { p_nickname: nickname })
  if (error) return false

  const available = data as boolean
  if (!available) takenCache.add(key)
  return available
}
