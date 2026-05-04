import { useRef, useCallback, useEffect } from 'react'
import type { Options } from 'canvas-confetti'

type ConfettiFn = (opts?: Options) => unknown

const COOLDOWN_MS = 3000

export function useConfetti() {
  const lastFired = useRef(0)
  const confettiRef = useRef<ConfettiFn | null>(null)

  useEffect(() => {
    import('canvas-confetti').then(mod => {
      confettiRef.current = mod.default
    })
  }, [])

  const fire = useCallback(() => {
    const now = Date.now()
    if (!confettiRef.current) return
    if (now - lastFired.current < COOLDOWN_MS) return
    lastFired.current = now

    confettiRef.current({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#f59e0b', '#10b981', '#3b82f6', '#f43f5e', '#8b5cf6'],
    })
  }, [])

  return fire
}
