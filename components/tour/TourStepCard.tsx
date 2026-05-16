'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { getCardPosition, getViewportSize, resolvePlacement } from './tour-utils'
import type { TourPlacement, TourRect, TourStep } from './types'

interface TourStepCardProps {
  step: TourStep
  index: number
  total: number
  targetRect: TourRect | null
  preferredPlacement: TourPlacement
  selectorMissing: boolean
  onClose: () => void
  onNext: () => void
  onPrevious: () => void
  onSkip: () => void
  onStepSelect: (index: number) => void
  stepNumberOffset?: number
  totalSteps?: number
  canGoPreviousOnFirst?: boolean
}

const CARD_SIZE = { width: 432, height: 292 }

export function TourStepCard({
  step,
  index,
  total,
  targetRect,
  preferredPlacement,
  selectorMissing,
  onClose,
  onNext,
  onPrevious,
  onSkip,
  onStepSelect,
  stepNumberOffset = 0,
  totalSteps,
  canGoPreviousOnFirst = false,
}: TourStepCardProps) {
  const cardRef = useRef<HTMLElement | null>(null)
  const firstButtonRef = useRef<HTMLButtonElement | null>(null)
  const [cardSize, setCardSize] = useState(CARD_SIZE)
  const [viewport, setViewport] = useState(getViewportSize)
  const isFirst = index === 0
  const isLast = index === total - 1
  const targetActionRequired = Boolean(step.requiresTargetAction)
  const placement = resolvePlacement(preferredPlacement, targetRect, viewport, cardSize)
  const position = getCardPosition(placement, targetRect, viewport, cardSize, 12)

  const displayIndex = index + 1 + stepNumberOffset
  const displayTotal = totalSteps ?? total + stepNumberOffset
  const progressLabel = useMemo(() => `${displayIndex} de ${displayTotal}`, [displayIndex, displayTotal])

  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    firstButtonRef.current?.focus({ preventScroll: true })
    return () => previous?.focus({ preventScroll: true })
  }, [])

  useEffect(() => {
    const updateViewport = () => setViewport(getViewportSize())
    updateViewport()
    window.addEventListener('resize', updateViewport)
    window.visualViewport?.addEventListener('resize', updateViewport)
    window.visualViewport?.addEventListener('scroll', updateViewport)
    window.addEventListener('orientationchange', updateViewport)
    return () => {
      window.removeEventListener('resize', updateViewport)
      window.visualViewport?.removeEventListener('resize', updateViewport)
      window.visualViewport?.removeEventListener('scroll', updateViewport)
      window.removeEventListener('orientationchange', updateViewport)
    }
  }, [])

  useEffect(() => {
    const element = cardRef.current
    if (!element) return
    const updateSize = () => {
      const rect = element.getBoundingClientRect()
      setCardSize({
        width: Math.min(Math.ceil(rect.width || CARD_SIZE.width), CARD_SIZE.width),
        height: Math.ceil(rect.height || CARD_SIZE.height),
      })
    }
    updateSize()
    const observer = new ResizeObserver(updateSize)
    observer.observe(element)
    return () => observer.disconnect()
  }, [step.id])

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        const focusable = cardRef.current?.querySelectorAll<HTMLElement>('button,a,[tabindex]:not([tabindex="-1"])')
        if (!focusable || focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  return (
    <section
      key={step.id}
      ref={cardRef}
      data-tour-card="true"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-step-title"
      aria-describedby="tour-step-description"
      className="pointer-events-auto fixed max-h-[min(32dvh,19rem,calc(100dvh-var(--sat)-var(--sab)-1rem))] overflow-y-auto rounded-2xl border border-(--border) bg-(--surface)/98 p-2.5 text-(--text) shadow-2xl outline-none backdrop-blur-xl transition-[top,left,width,transform,opacity] duration-300 ease-out animate-[tour-card-in_220ms_ease-out] motion-reduce:animate-none motion-reduce:transition-none sm:max-h-[calc(100dvh-var(--sat)-var(--sab)-1rem)] sm:rounded-3xl sm:p-5"
      style={{
        top: position.top,
        left: position.left,
        width: position.width,
      }}
    >
      <div className="flex items-start justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-(--accent)">Tutorial</p>
          <p className="mt-0.5 text-[11px] text-(--muted) sm:mt-1 sm:text-xs" aria-live="polite">{progressLabel}</p>
        </div>
        <button
          ref={firstButtonRef}
          type="button"
          onClick={onClose}
          aria-label="Cerrar tutorial"
          className="grid min-h-10 min-w-10 shrink-0 place-items-center rounded-xl text-(--muted) transition hover:bg-(--surface-hover) hover:text-(--text) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus) sm:min-h-11 sm:min-w-11"
        >
          ×
        </button>
      </div>

      <div className="mt-2 sm:mt-4">
        <h2 id="tour-step-title" className="text-sm font-bold leading-tight tracking-tight text-(--text) sm:text-2xl">
          {step.title}
        </h2>
        <p id="tour-step-description" className="mt-1.5 text-xs leading-5 text-(--muted) sm:mt-3 sm:text-sm sm:leading-6">
          {step.description}
        </p>
        {selectorMissing && (
          <p className="mt-3 rounded-2xl border border-(--border) bg-(--surface-soft) px-3 py-2 text-xs text-(--muted)">
            Esta parte no está visible ahora mismo, pero puedes continuar el recorrido.
          </p>
        )}
      </div>

      <div className="mt-3 flex gap-1 sm:mt-5" aria-label="Pasos del tutorial">
        {Array.from({ length: total }).map((_, itemIndex) => (
          <button
            type="button"
            key={itemIndex}
            onClick={() => onStepSelect(itemIndex)}
            aria-label={`Ir al paso ${itemIndex + 1}`}
            className={`h-1 min-w-2 flex-1 rounded-full transition hover:scale-y-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus) sm:h-2 sm:min-w-8 ${itemIndex <= index ? 'bg-(--accent)' : 'bg-(--surface-soft)'}`}
          />
        ))}
      </div>

      <div className="mt-2.5 flex flex-col-reverse gap-2 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between sm:mt-4">
        <button
          type="button"
          onClick={onSkip}
          className="min-h-10 rounded-2xl px-3 py-2 text-xs font-semibold text-(--muted) transition hover:bg-(--surface-hover) hover:text-(--text) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus) sm:min-h-11 sm:px-4 sm:py-2.5 sm:text-sm"
        >
          Saltar
        </button>
        <div className="grid grid-cols-2 gap-2 min-[420px]:flex">
          <button
            type="button"
            onClick={onPrevious}
            disabled={isFirst && !canGoPreviousOnFirst}
            className="min-h-10 rounded-2xl border border-(--border) bg-(--surface-soft) px-3 py-2 text-xs font-semibold text-(--text) transition hover:bg-(--surface-hover) disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus) sm:min-h-11 sm:px-4 sm:py-2.5 sm:text-sm"
          >
            Anterior
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={targetActionRequired}
            className="min-h-10 rounded-2xl bg-(--primary) px-3 py-2 text-xs font-semibold text-white transition hover:bg-(--primary-hover) disabled:cursor-not-allowed disabled:bg-(--surface-soft) disabled:text-(--muted) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus) sm:min-h-11 sm:px-4 sm:py-2.5 sm:text-sm"
          >
            {targetActionRequired ? (step.actionLabel ?? 'Usa el botón resaltado') : step.actionLabel ?? (isLast ? 'Finalizar' : 'Siguiente')}
          </button>
        </div>
      </div>
    </section>
  )
}
