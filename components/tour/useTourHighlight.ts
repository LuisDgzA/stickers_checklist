'use client'

import { useEffect, useState } from 'react'
import { getViewportSize, inflateRect } from './tour-utils'
import { TOUR_PROGRAMMATIC_SCROLL_EVENT } from './useScrollLock'
import type { TourRect } from './types'

interface HighlightState {
  rect: TourRect | null
  missing: boolean
  resolving: boolean
}

export function useTourHighlight(selector: string | undefined, active: boolean, onMissing?: (selector: string) => void) {
  const [state, setState] = useState<HighlightState>({ rect: null, missing: false, resolving: false })

  useEffect(() => {
    if (!active || !selector) {
      window.queueMicrotask(() => setState({ rect: null, missing: false, resolving: false }))
      return
    }

    window.queueMicrotask(() => setState({ rect: null, missing: false, resolving: true }))

    let disposed = false
    let attempts = 0
    let retryTimer: number | null = null
    let measureTimer: number | null = null
    let hasScrolledToTarget = false
    let missingReported = false
    let activeElement: Element | null = null

    const setActiveElement = (element: Element | null) => {
      if (activeElement && activeElement !== element) activeElement.removeAttribute('data-tour-active-target')
      activeElement = element
      activeElement?.setAttribute('data-tour-active-target', 'true')
    }

    const measure = (element: Element) => {
      if (measureTimer) window.clearTimeout(measureTimer)
      measureTimer = window.setTimeout(() => {
        if (disposed) return
        const rect = element.getBoundingClientRect()
        setState({ rect: inflateRect(rect, 8, getViewportSize()), missing: false, resolving: false })
      }, hasScrolledToTarget ? 80 : 220)
    }

    const update = () => {
      if (disposed) return
      const candidates = Array.from(document.querySelectorAll(selector))
      const element = candidates.find(candidate => {
        const rect = candidate.getBoundingClientRect()
        const style = window.getComputedStyle(candidate)
        return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none'
      }) ?? candidates[0]
      if (!element) {
        setActiveElement(null)
        attempts += 1
        if (attempts >= 8) {
          setState({ rect: null, missing: true, resolving: false })
          if (!missingReported) {
            missingReported = true
            onMissing?.(selector)
          }
          return
        }
        retryTimer = window.setTimeout(update, 120)
        return
      }

      attempts = 0
      missingReported = false
      setActiveElement(element)

      if (!hasScrolledToTarget) {
        hasScrolledToTarget = true
        const scrollTarget = element.closest('[data-tour-scroll-target="true"]') ?? element
        window.dispatchEvent(new CustomEvent(TOUR_PROGRAMMATIC_SCROLL_EVENT, { detail: { duration: 1200 } }))
        scrollTarget.scrollIntoView({
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
          block: 'center',
          inline: 'center',
        })
      }

      measure(element)
    }

    const measureCurrentTarget = () => {
      const candidates = Array.from(document.querySelectorAll(selector))
      const element = candidates.find(candidate => {
        const rect = candidate.getBoundingClientRect()
        const style = window.getComputedStyle(candidate)
        return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none'
      }) ?? candidates[0]
      if (element) measure(element)
    }

    const observer = new MutationObserver(() => measureCurrentTarget())
    observer.observe(document.body, { childList: true, subtree: true })

    update()
    window.addEventListener('resize', measureCurrentTarget)
    window.visualViewport?.addEventListener('resize', measureCurrentTarget)
    window.visualViewport?.addEventListener('scroll', measureCurrentTarget)
    window.addEventListener('orientationchange', measureCurrentTarget)
    window.addEventListener('scroll', measureCurrentTarget, true)

    return () => {
      disposed = true
      if (retryTimer) window.clearTimeout(retryTimer)
      if (measureTimer) window.clearTimeout(measureTimer)
      setActiveElement(null)
      observer.disconnect()
      window.removeEventListener('resize', measureCurrentTarget)
      window.visualViewport?.removeEventListener('resize', measureCurrentTarget)
      window.visualViewport?.removeEventListener('scroll', measureCurrentTarget)
      window.removeEventListener('orientationchange', measureCurrentTarget)
      window.removeEventListener('scroll', measureCurrentTarget, true)
    }
  }, [active, onMissing, selector])

  return state
}
