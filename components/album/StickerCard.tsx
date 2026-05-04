'use client'

import { calcStickerState } from '@/lib/progress'
import type { StickerWithQuantity } from '@/types/album'

interface StickerCardProps {
  sticker: StickerWithQuantity
  onIncrement: (stickerId: string) => void
  onDecrement: (stickerId: string) => void
  isUpdating?: boolean
}

export function StickerCard({ sticker, onIncrement, onDecrement, isUpdating }: StickerCardProps) {
  const state = calcStickerState(sticker.quantity)
  const isObtained = state === 'obtained'
  const isRepeated = state === 'repeated'

  const cardStyles = {
    missing: 'sticker-card sticker-missing hover:border-(--border-hover) hover:bg-(--surface-hover)',
    obtained: 'sticker-card sticker-obtained shadow-[0_12px_30px_var(--sticker-obtained-shadow)]',
    repeated: 'sticker-card sticker-repeated shadow-[0_12px_30px_var(--sticker-repeated-shadow)]',
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${sticker.code}${sticker.name ? ` ${sticker.name}` : ''}. Cantidad ${sticker.quantity}`}
      className={`${cardStyles[state]} group min-h-[118px] gap-2 p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus) active:scale-[0.98] ${isUpdating ? 'pointer-events-none opacity-60' : ''}`}
      onClick={() => onIncrement(sticker.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onIncrement(sticker.id)
        }
      }}
    >
      <button
          onClick={(e) => { e.stopPropagation(); onDecrement(sticker.id) }}
          disabled={sticker.quantity === 0 || isUpdating}
          aria-label={`Restar ${sticker.code}`}
          className="absolute -left-2 -top-2 z-10 flex size-7 items-center justify-center rounded-full border border-(--border) bg-(--surface) text-sm font-bold text-(--muted) shadow-md transition hover:border-(--primary)/50 hover:text-(--primary) disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus)"
        >
          −
        </button>
      <div className="grid size-10 place-items-center rounded-2xl bg-(--surface-soft) ring-1 ring-inset ring-white/10 transition group-hover:scale-105">
        {isObtained || isRepeated ? (
          <svg className="size-5 text-(--accent)" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <span className="size-4 rounded-full border-2 border-dashed border-current opacity-50" />
        )}
      </div>
      <span className="font-mono text-xs font-bold tracking-wide">{sticker.code}</span>
      {sticker.name && (
        <span className="line-clamp-2 px-1 text-center text-[11px] leading-tight opacity-75">{sticker.name}</span>
      )}

      <span className="mt-auto rounded-full border border-current/15 px-2 py-0.5 text-[10px] font-semibold opacity-75">
        {state === 'missing' ? 'Pendiente' : state === 'obtained' ? 'Obtenida' : 'Repetida'}
      </span>

      {isRepeated && (
        <span className="absolute -right-1 -top-1 grid size-7 place-content-center rounded-full bg-(--primary) text-[10px] font-bold text-white shadow-lg shadow-(--primary)/30">
          x{sticker.quantity - 1}
        </span>
      )}
    </div>
  )
}
