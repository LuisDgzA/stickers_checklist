'use client'

import { createContext, useCallback, useContext, useEffect, useId, useMemo, useState } from 'react'
import { TourOverlay } from './TourOverlay'
import { useTourAnalytics } from './useTourAnalytics'
import type { TourStep } from './types'

interface TourContextValue {
  open: boolean
  index: number
  start: (options?: { manual?: boolean; index?: number }) => void
  close: () => void
  finish: () => void
  setIndex: (index: number) => void
}

const TourContext = createContext<TourContextValue | null>(null)
const TOUR_PROVIDER_STARTED_EVENT = 'tour-provider-started'

interface TourProviderProps {
  tourId: string
  steps: TourStep[]
  children: React.ReactNode
  onFinish?: () => Promise<void> | void
  onClose?: () => void
  stepNumberOffset?: number
  totalSteps?: number
  previousHrefOnFirst?: string
}

export function TourProvider({ tourId, steps, children, onFinish, onClose, stepNumberOffset = 0, totalSteps, previousHrefOnFirst }: TourProviderProps) {
  const [open, setOpen] = useState(false)
  const [index, setIndex] = useState(0)
  const instanceId = useId()
  const track = useTourAnalytics()

  const start = useCallback((options?: { manual?: boolean; index?: number }) => {
    setIndex(options?.index ?? 0)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(TOUR_PROVIDER_STARTED_EVENT, {
        detail: { tourId, instanceId },
      }))
    }
    setOpen(true)
    track(options?.manual ? 'tutorial_manual_opened' : 'tutorial_auto_opened', {
      tourId,
      stepId: steps[options?.index ?? 0]?.id,
      stepIndex: options?.index ?? 0,
    })
  }, [instanceId, steps, tourId, track])

  useEffect(() => {
    const handleTourStarted = (event: Event) => {
      const detail = event instanceof CustomEvent ? event.detail as { tourId?: string; instanceId?: string } : null
      if (detail?.tourId !== tourId || detail.instanceId === instanceId) return
      setOpen(false)
    }

    window.addEventListener(TOUR_PROVIDER_STARTED_EVENT, handleTourStarted)
    return () => window.removeEventListener(TOUR_PROVIDER_STARTED_EVENT, handleTourStarted)
  }, [instanceId, tourId])

  const close = useCallback(() => {
    setOpen(false)
    onClose?.()
  }, [onClose])

  const finish = useCallback(async () => {
    setOpen(false)
    await onFinish?.()
  }, [onFinish])

  const value = useMemo(() => ({ open, index, start, close, finish, setIndex }), [close, finish, index, open, start])

  return (
    <TourContext.Provider value={value}>
      {children}
      <TourOverlay
        tourId={tourId}
        open={open}
        steps={steps}
        index={index}
        onIndexChange={setIndex}
        onClose={close}
        onFinish={finish}
        stepNumberOffset={stepNumberOffset}
        totalSteps={totalSteps}
        previousHrefOnFirst={previousHrefOnFirst}
      />
    </TourContext.Provider>
  )
}

export function useTour() {
  const value = useContext(TourContext)
  if (!value) throw new Error('useTour must be used inside TourProvider')
  return value
}
