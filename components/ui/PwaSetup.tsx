'use client'

import { useEffect } from 'react'

export function PwaSetup() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    if (process.env.NODE_ENV === 'development') {
      navigator.serviceWorker.getRegistrations()
        .then(registrations => Promise.all(registrations.map(registration => registration.unregister())))
        .catch(() => undefined)

      if ('caches' in window) {
        caches.keys()
          .then(keys => Promise.all(keys.filter(key => key.startsWith('album-')).map(key => caches.delete(key))))
          .catch(() => undefined)
      }
      return
    }

    navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' })
  }, [])

  return null
}
