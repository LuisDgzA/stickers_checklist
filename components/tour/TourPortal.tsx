'use client'

import { useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'

function subscribe() {
  return () => {}
}

export function TourPortal({ children }: { children: React.ReactNode }) {
  const mounted = useSyncExternalStore(subscribe, () => true, () => false)

  if (!mounted) return null

  return createPortal(children, document.body)
}
