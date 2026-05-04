interface AdSlotProps {
  variant?: 'banner' | 'card' | 'footer'
  title?: string
  description?: string
}

export function AdSlot({
  variant = 'banner',
  title = 'Espacio para marca coleccionable',
  description = 'Promociona álbumes, sobres, accesorios o experiencias relacionadas con colecciones.',
}: AdSlotProps) {
  const isCard = variant === 'card'

  return (
    <aside
      aria-label="Contenido patrocinado"
      className={`relative overflow-hidden border border-(--border) bg-(--surface) shadow-sm ${
        isCard ? 'min-h-[300px] rounded-3xl p-5' : 'rounded-3xl p-5 sm:p-6'
      }`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,var(--hero-glow-secondary),transparent_30%),linear-gradient(135deg,transparent,var(--surface-soft))]" />
      <div className="relative flex h-full flex-col justify-between gap-6">
        <span className="w-fit rounded-full border border-(--border) bg-(--surface-soft) px-3 py-1 text-xs font-semibold text-(--muted)">
          Patrocinado
        </span>
        <div>
          <h3 className="text-lg font-bold tracking-tight text-(--text)">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-(--muted)">{description}</p>
        </div>
        <div className="flex items-center justify-between border-t border-(--border) pt-4 text-xs text-(--muted)">
          <span>Formato no invasivo</span>
          <span className="font-semibold text-(--accent)">Ad-ready</span>
        </div>
      </div>
    </aside>
  )
}
