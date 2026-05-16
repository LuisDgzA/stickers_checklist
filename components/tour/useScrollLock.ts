'use client'

import { useEffect } from 'react'

export const TOUR_PROGRAMMATIC_SCROLL_EVENT = 'tour-programmatic-scroll'

export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active || typeof window === 'undefined') return

    let lockedScrollY = window.scrollY
    let allowProgrammaticUntil = 0
    let restoreFrame: number | null = null

    const isInsideTourCard = (target: EventTarget | null) => (
      target instanceof HTMLElement && Boolean(target.closest('[data-tour-card="true"]'))
    )

    const isEditableTarget = (target: EventTarget | null) => (
      target instanceof HTMLElement
      && (
        target instanceof HTMLInputElement
        || target instanceof HTMLTextAreaElement
        || target.isContentEditable
        || target.closest('[contenteditable="true"]') !== null
      )
    )

    const allowProgrammaticScroll = (event: Event) => {
      const duration = event instanceof CustomEvent ? Number(event.detail?.duration ?? 900) : 900
      allowProgrammaticUntil = Date.now() + duration
    }

    const preventManualScroll = (event: Event) => {
      if (isInsideTourCard(event.target)) return
      if (Date.now() <= allowProgrammaticUntil) return
      event.preventDefault()
    }

    const preventPageScrollKeys = (event: KeyboardEvent) => {
      if (Date.now() <= allowProgrammaticUntil) return
      if (event.defaultPrevented) return
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return
      if (![' ', 'PageDown', 'PageUp', 'Home', 'End', 'ArrowDown', 'ArrowUp'].includes(event.key)) return
      if (isInsideTourCard(event.target)) return
      if (isEditableTarget(event.target)) return
      event.preventDefault()
    }

    const syncScrollPosition = () => {
      if (Date.now() <= allowProgrammaticUntil) {
        lockedScrollY = window.scrollY
        allowProgrammaticUntil = Date.now() + 250
        return
      }

      if (window.scrollY !== lockedScrollY && restoreFrame === null) {
        restoreFrame = window.requestAnimationFrame(() => {
          restoreFrame = null
          window.scrollTo(0, lockedScrollY)
        })
      }
    }

    const originalHtmlOverscroll = document.documentElement.style.overscrollBehavior
    const originalBodyOverscroll = document.body.style.overscrollBehavior

    document.documentElement.style.overscrollBehavior = 'none'
    document.body.style.overscrollBehavior = 'none'
    window.addEventListener(TOUR_PROGRAMMATIC_SCROLL_EVENT, allowProgrammaticScroll)
    window.addEventListener('wheel', preventManualScroll, { passive: false })
    window.addEventListener('touchmove', preventManualScroll, { passive: false })
    window.addEventListener('scroll', syncScrollPosition, true)
    window.addEventListener('keydown', preventPageScrollKeys)

    return () => {
      if (restoreFrame !== null) window.cancelAnimationFrame(restoreFrame)
      document.documentElement.style.overscrollBehavior = originalHtmlOverscroll
      document.body.style.overscrollBehavior = originalBodyOverscroll
      window.removeEventListener(TOUR_PROGRAMMATIC_SCROLL_EVENT, allowProgrammaticScroll)
      window.removeEventListener('wheel', preventManualScroll)
      window.removeEventListener('touchmove', preventManualScroll)
      window.removeEventListener('scroll', syncScrollPosition, true)
      window.removeEventListener('keydown', preventPageScrollKeys)
    }
  }, [active])
}
