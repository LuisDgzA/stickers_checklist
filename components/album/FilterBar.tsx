'use client'

import type { StickerFilter } from '@/types/album'

interface FilterBarProps {
  activeFilter: StickerFilter
  onChange: (filter: StickerFilter) => void
}

const FILTERS: { value: StickerFilter; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'missing', label: 'Faltantes' },
  { value: 'complete', label: 'Completas' },
  { value: 'repeated', label: 'Repetidas' },
]

export function FilterBar({ activeFilter, onChange }: FilterBarProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar" aria-label="Filtros de estampas">
      {FILTERS.map(f => (
        <button
          key={f.value}
          onClick={() => onChange(f.value)}
          className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus) ${
            activeFilter === f.value
              ? 'border border-(--primary) bg-(--primary) text-white shadow-lg shadow-(--primary)/15'
              : 'border border-(--border) bg-(--surface-soft) text-(--muted) hover:border-(--accent)/40 hover:bg-(--surface-hover) hover:text-(--text)'
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  )
}
