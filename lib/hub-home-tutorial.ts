'use client'

import { createClient } from '@/lib/supabase/client'

const HUB_HOME_TUTORIAL_KEY = 'hub_home_tutorial_seen'
export const HUB_HOME_TUTORIAL_VERSION = 1
export const HUB_HOME_TUTORIAL_UPDATED_EVENT = 'hub-home-tutorial-updated'
export const HUB_HOME_TUTORIAL_ACTIVE_EVENT = 'hub-home-tutorial-active'
const HUB_HOME_TUTORIAL_VERSION_KEY = `${HUB_HOME_TUTORIAL_KEY}_version`

function localStorageSeen(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.localStorage.getItem(HUB_HOME_TUTORIAL_KEY) === 'true' &&
    Number(window.localStorage.getItem(HUB_HOME_TUTORIAL_VERSION_KEY) ?? '0') >= HUB_HOME_TUTORIAL_VERSION
  )
}

function markLocalStorageSeen() {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(HUB_HOME_TUTORIAL_KEY, 'true')
  window.localStorage.setItem(HUB_HOME_TUTORIAL_VERSION_KEY, String(HUB_HOME_TUTORIAL_VERSION))
  window.dispatchEvent(new CustomEvent(HUB_HOME_TUTORIAL_UPDATED_EVENT))
}

export async function hasSeenHubHomeTutorial(userId?: string | null): Promise<boolean> {
  if (!userId) return localStorageSeen()

  try {
    const supabase = createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('profiles')
      .select('hub_home_tutorial_seen, hub_home_tutorial_version')
      .eq('id', userId)
      .single()

    if (error) return localStorageSeen()
    const remoteSeen = Boolean(data?.hub_home_tutorial_seen) && Number(data?.hub_home_tutorial_version ?? 0) >= HUB_HOME_TUTORIAL_VERSION
    return remoteSeen || localStorageSeen()
  } catch {
    return localStorageSeen()
  }
}

export async function markHubHomeTutorialAsSeen(userId?: string | null): Promise<void> {
  markLocalStorageSeen()
  if (!userId) return

  try {
    const supabase = createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('profiles')
      .update({
        hub_home_tutorial_seen: true,
        hub_home_tutorial_version: HUB_HOME_TUTORIAL_VERSION,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
  } catch { }
}

export function resetHubHomeTutorialLocalState() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(HUB_HOME_TUTORIAL_KEY)
  window.localStorage.removeItem(HUB_HOME_TUTORIAL_VERSION_KEY)
  window.dispatchEvent(new CustomEvent(HUB_HOME_TUTORIAL_UPDATED_EVENT))
}

export function setHubHomeTutorialActive(active: boolean) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(HUB_HOME_TUTORIAL_ACTIVE_EVENT, { detail: { active } }))
}
