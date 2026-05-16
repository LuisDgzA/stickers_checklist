'use client'

import { useCallback, useEffect } from 'react'
import { TourHighlight } from './TourHighlight'
import { TourPortal } from './TourPortal'
import { TourStepCard } from './TourStepCard'
import { useTourAnalytics } from './useTourAnalytics'
import { useTourHighlight } from './useTourHighlight'
import { useScrollLock } from './useScrollLock'
import type { TourStep } from './types'

interface TourOverlayProps {
  tourId: string
  open: boolean
  steps: TourStep[]
  index: number
  onIndexChange: (index: number) => void
  onClose: () => void
  onFinish: () => void
  stepNumberOffset?: number
  totalSteps?: number
  previousHrefOnFirst?: string
}

export function TourOverlay({ tourId, open, steps, index, onIndexChange, onClose, onFinish, stepNumberOffset = 0, totalSteps, previousHrefOnFirst }: TourOverlayProps) {
  const track = useTourAnalytics()
  const step = steps[index]
  const onMissing = useCallback((selector: string) => {
    track('tutorial_selector_missing', { tourId, stepId: step?.id, stepIndex: index, selector })
  }, [index, step?.id, tourId, track])
  const { rect, missing, resolving } = useTourHighlight(step?.highlightSelector, open, onMissing)

  useScrollLock(open)

  const previous = useCallback(() => {
    if (!step) return
    if (index === 0 && previousHrefOnFirst) {
      track('tutorial_previous', { tourId, stepId: step.id, stepIndex: index })
      window.location.href = previousHrefOnFirst
      return
    }
    onIndexChange(Math.max(index - 1, 0))
    track('tutorial_previous', { tourId, stepId: step.id, stepIndex: index })
  }, [index, onIndexChange, previousHrefOnFirst, step, tourId, track])

  const next = useCallback(() => {
    if (!step) return
    if (step.requiresTargetAction) return
    if (step.actionHref) {
      track('tutorial_transitioned_to_sandbox', { tourId, stepId: step.id, stepIndex: index })
      window.location.href = step.actionHref
      return
    }
    if (index === steps.length - 1) {
      onFinish()
      track('tutorial_completed', { tourId, stepId: step.id, stepIndex: index })
      return
    }
    onIndexChange(Math.min(index + 1, steps.length - 1))
    track('tutorial_next', { tourId, stepId: step.id, stepIndex: index })
  }, [index, onFinish, onIndexChange, step, steps.length, tourId, track])

  useEffect(() => {
    if (!open || !step) return
    track('tutorial_step_viewed', { tourId, stepId: step.id, stepIndex: index })
  }, [index, open, step, tourId, track])

  useEffect(() => {
    if (!open || !step || !missing) return
    if (index < steps.length - 1) {
      onIndexChange(index + 1)
      return
    }
    onFinish()
  }, [index, missing, onFinish, onIndexChange, open, step, steps.length])

  useEffect(() => {
    if (!open) return
    const handleKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return
      if (
        event.target instanceof HTMLInputElement
        || event.target instanceof HTMLTextAreaElement
        || (event.target instanceof HTMLElement && event.target.isContentEditable)
      ) {
        return
      }

      if (event.key === 'Escape') {
        onClose()
        track('tutorial_closed', { tourId, stepId: step?.id, stepIndex: index, reason: 'escape' })
      }
      if (event.key === 'ArrowRight') next()
      if (event.key === 'ArrowLeft') previous()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [index, next, onClose, open, previous, step?.id, tourId, track])

  if (!open || !step || resolving || missing) return null

  const skip = () => {
    onFinish()
    track('tutorial_skipped', { tourId, stepId: step.id, stepIndex: index })
  }

  const close = () => {
    onClose()
    track('tutorial_closed', { tourId, stepId: step.id, stepIndex: index })
  }

  return (
    <TourPortal>
      <div className="fixed inset-0 z-50 pointer-events-none">
        <TourHighlight rect={rect} />
        <TourStepCard
          key={step.id}
          step={step}
          index={index}
          total={steps.length}
          targetRect={rect}
          preferredPlacement={step.placement ?? 'auto'}
          selectorMissing={missing}
          onClose={close}
          onNext={next}
          onPrevious={previous}
          onSkip={skip}
          onStepSelect={onIndexChange}
          stepNumberOffset={stepNumberOffset}
          totalSteps={totalSteps}
          canGoPreviousOnFirst={Boolean(previousHrefOnFirst)}
        />
      </div>
    </TourPortal>
  )
}
