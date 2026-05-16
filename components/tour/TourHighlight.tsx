'use client'

import type { TourRect } from './types'

export function TourHighlight({ rect }: { rect: TourRect | null }) {
  if (!rect) {
    return <div className="fixed inset-0 bg-black/55 backdrop-blur-[2px]" />
  }

  return (
    <div
      className="fixed rounded-3xl border-2 border-(--accent) bg-transparent shadow-[0_0_0_9999px_rgba(0,0,0,0.54),0_18px_60px_rgba(0,0,0,0.35)] transition-all duration-300 motion-reduce:transition-none"
      style={{
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      }}
    />
  )
}
