'use client'

import { useCallback } from 'react'

export function versionedTutorialKey(key: string, version: number) {
  return `${key}_v${version}`
}

export function useTourPersistence(key: string, version: number) {
  const storageKey = versionedTutorialKey(key, version)

  const hasSeen = useCallback(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem(storageKey) === 'true'
  }, [storageKey])

  const markSeen = useCallback(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(storageKey, 'true')
    window.localStorage.setItem(key, 'true')
  }, [key, storageKey])

  const reset = useCallback(() => {
    if (typeof window === 'undefined') return
    window.localStorage.removeItem(storageKey)
    window.localStorage.removeItem(key)
  }, [key, storageKey])

  return { hasSeen, markSeen, reset, storageKey }
}
