import type { TourPlacement, TourRect, ViewportSize } from './types'

const SAFE_MARGIN = 12
const MOBILE_BREAKPOINT = 640

export function getViewportSize(): ViewportSize {
  if (typeof window === 'undefined') return { width: 390, height: 844 }
  const visualViewport = window.visualViewport
  return {
    width: Math.round(visualViewport?.width ?? window.innerWidth),
    height: Math.round(visualViewport?.height ?? window.innerHeight),
  }
}

export function getSafeAreaInsets() {
  if (typeof window === 'undefined') return { top: 0, right: 0, bottom: 0, left: 0 }
  const styles = window.getComputedStyle(document.documentElement)
  const read = (name: string) => Number.parseFloat(styles.getPropertyValue(name)) || 0
  return {
    top: read('--sat'),
    right: read('--sar'),
    bottom: read('--sab'),
    left: read('--sal'),
  }
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export function inflateRect(rect: DOMRect | TourRect, padding = 8, viewport = getViewportSize()): TourRect {
  return {
    top: clamp(rect.top - padding, SAFE_MARGIN, viewport.height - SAFE_MARGIN),
    left: clamp(rect.left - padding, SAFE_MARGIN, viewport.width - SAFE_MARGIN),
    width: clamp(rect.width + padding * 2, 0, viewport.width - SAFE_MARGIN * 2),
    height: clamp(rect.height + padding * 2, 0, viewport.height - SAFE_MARGIN * 2),
  }
}

export function resolvePlacement(
  preferred: TourPlacement,
  target: TourRect | null,
  viewport: ViewportSize,
  cardSize: { width: number; height: number }
): Exclude<TourPlacement, 'auto'> {
  if (preferred !== 'auto') return preferred
  if (!target) return viewport.width < MOBILE_BREAKPOINT ? 'bottom' : 'top'

  const space = {
    top: target.top,
    bottom: viewport.height - (target.top + target.height),
    left: target.left,
    right: viewport.width - (target.left + target.width),
  }

  if (viewport.width < MOBILE_BREAKPOINT) {
    return space.bottom >= Math.min(cardSize.height, viewport.height * 0.35) ? 'bottom' : 'top'
  }

  const candidates: Exclude<TourPlacement, 'auto'>[] = ['bottom', 'top', 'right', 'left']
  return candidates.sort((a, b) => space[b] - space[a])[0]
}

export function getCardPosition(
  placement: Exclude<TourPlacement, 'auto'>,
  target: TourRect | null,
  viewport: ViewportSize,
  cardSize: { width: number; height: number },
  margin = 12
) {
  const safeArea = getSafeAreaInsets()
  const minLeft = margin + safeArea.left
  const minTop = margin + safeArea.top
  const maxWidth = Math.max(0, viewport.width - minLeft - margin - safeArea.right)
  const width = Math.min(cardSize.width, maxWidth)
  const maxLeft = Math.max(minLeft, viewport.width - width - margin - safeArea.right)
  const maxTop = Math.max(minTop, viewport.height - cardSize.height - margin - safeArea.bottom)
  const fallbackLeft = clamp((viewport.width - width) / 2, minLeft, Math.max(minLeft, viewport.width - width - margin - safeArea.right))
  const fallbackTop = clamp((viewport.height - cardSize.height) / 2, minTop, maxTop)

  if (!target) {
    return {
      top: fallbackTop,
      left: fallbackLeft,
      width,
    }
  }

  if (viewport.width < MOBILE_BREAKPOINT) {
    const topSpace = target.top - minTop
    const bottomSpace = viewport.height - (target.top + target.height) - margin - safeArea.bottom
    const canFitAbove = topSpace >= Math.min(cardSize.height, viewport.height * 0.34)
    const canFitBelow = bottomSpace >= Math.min(cardSize.height, viewport.height * 0.34)
    const shouldUseTop = placement === 'top' || (!canFitBelow && canFitAbove) || target.top > viewport.height * 0.5
    const top = shouldUseTop
      ? target.top - cardSize.height - margin
      : target.top + target.height + margin
    return { top: clamp(top, minTop, maxTop), left: fallbackLeft, width }
  }

  const positions = {
    top: {
      top: target.top - cardSize.height - margin,
      left: target.left + target.width / 2 - width / 2,
    },
    bottom: {
      top: target.top + target.height + margin,
      left: target.left + target.width / 2 - width / 2,
    },
    left: {
      top: target.top + target.height / 2 - cardSize.height / 2,
      left: target.left - width - margin,
    },
    right: {
      top: target.top + target.height / 2 - cardSize.height / 2,
      left: target.left + target.width + margin,
    },
  }[placement]

  return {
    top: clamp(positions.top, minTop, maxTop),
    left: clamp(positions.left, minLeft, maxLeft),
    width,
  }
}
