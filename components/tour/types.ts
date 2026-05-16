'use client'

export type TourPlacement = 'top' | 'bottom' | 'left' | 'right' | 'auto'

export interface TourStep {
  id: string
  title: string
  description: string
  highlightSelector?: string
  placement?: TourPlacement
  actionHref?: string
  actionLabel?: string
  requiresTargetAction?: boolean
  imageSrc?: string
  imageAlt?: string
  imageDarkSrc?: string
  imageLightSrc?: string
}

export interface TourRect {
  top: number
  left: number
  width: number
  height: number
}

export interface ViewportSize {
  width: number
  height: number
}

export interface TourAnalyticsPayload {
  tourId: string
  stepId?: string
  stepIndex?: number
  reason?: string
  selector?: string
}
