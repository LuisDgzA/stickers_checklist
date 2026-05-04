'use server'

import { revalidateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { loginPathForRedirect, sanitizeRedirectPath } from '@/lib/auth-redirect'

const NICKNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/

export async function updateProfileAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(loginPathForRedirect('/perfil'))

  const fullName = String(formData.get('full_name') ?? '').trim().slice(0, 80)
  const nickname = String(formData.get('nickname') ?? '').trim().toLowerCase()
  const back = sanitizeRedirectPath(String(formData.get('back') ?? '/perfil'))

  if (!fullName || !NICKNAME_REGEX.test(nickname)) {
    redirect(`${back}${back.includes('?') ? '&' : '?'}saved=0`)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('profiles')
    .update({
      full_name: fullName,
      nickname,
      email: user.email ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (!error) revalidateTag(`profile-${user.id}`, 'max')
  redirect(`${back}${back.includes('?') ? '&' : '?'}saved=${error ? '0' : '1'}`)
}
