'use client'

import { useCallback } from 'react'
import type { TourAnalyticsPayload } from './types'

declare global {
  interface Window {
    posthog?: { capture?: (event: string, payload?: Record<string, unknown>) => void }
    plausible?: (event: string, options?: { props?: Record<string, unknown> }) => void
  }
}

export type TourAnalyticsEvent =
  | 'tutorial_auto_opened'
  | 'tutorial_manual_opened'
  | 'tutorial_step_viewed'
  | 'tutorial_next'
  | 'tutorial_previous'
  | 'tutorial_skipped'
  | 'tutorial_closed'
  | 'tutorial_completed'
  | 'tutorial_transitioned_to_sandbox'
  | 'tutorial_selector_missing'

export function trackTourEvent(event: TourAnalyticsEvent, payload: TourAnalyticsPayload) {
  if (typeof window === 'undefined') return

  try {
    window.dispatchEvent(new CustomEvent(event, { detail: payload }))
  } catch {}

  try {
    window.posthog?.capture?.(event, payload as unknown as Record<string, unknown>)
  } catch {}

  try {
    window.plausible?.(event, { props: payload as unknown as Record<string, unknown> })
  } catch {}
}

export function useTourAnalytics() {
  return useCallback((event: TourAnalyticsEvent, payload: TourAnalyticsPayload) => {
    trackTourEvent(event, payload)
  }, [])
}
