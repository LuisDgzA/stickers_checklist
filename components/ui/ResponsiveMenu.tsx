'use client'

import { useEffect, useRef } from 'react'

interface ResponsiveMenuProps {
  label?: string
  targetAttribute?: Record<string, string>
  children: React.ReactNode
}

export function ResponsiveMenu({ label = 'Menú', targetAttribute, children }: ResponsiveMenuProps) {
  const detailsRef = useRef<HTMLDetailsElement | null>(null)

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const details = detailsRef.current
      if (!details?.open) return
      if (event.target instanceof Node && details.contains(event.target)) return
      details.open = false
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && detailsRef.current?.open) detailsRef.current.open = false
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  const closeOnAction = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target
    if (!(target instanceof HTMLElement)) return
    if (target.closest('[data-menu-keep-open="true"]')) return
    if (target.closest('a,button') && detailsRef.current) detailsRef.current.open = false
  }

  return (
    <details ref={detailsRef} className="group relative shrink-0 md:hidden">
      <summary
        {...targetAttribute}
        className="flex h-11 cursor-pointer list-none items-center gap-2 rounded-2xl border border-(--border) bg-(--surface) px-3 text-sm font-semibold text-(--text) shadow-sm transition hover:border-(--accent)/40 hover:bg-(--surface-hover) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus) [&::-webkit-details-marker]:hidden"
      >
        <span>{label}</span>
        <svg className="size-4 text-(--muted) transition group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 9l6 6 6-6" />
        </svg>
      </summary>
      <div
        onClick={closeOnAction}
        className="absolute right-0 top-[calc(100%+0.5rem)] z-30 w-[min(18rem,calc(100vw-1.5rem))] rounded-3xl border border-(--border) bg-(--surface)/95 p-2 text-(--text) shadow-2xl shadow-black/15 backdrop-blur-xl"
      >
        <div className="grid gap-2">{children}</div>
      </div>
    </details>
  )
}
