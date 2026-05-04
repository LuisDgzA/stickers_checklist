interface SectionHeaderProps {
  id?: string
  eyebrow?: string
  title: string
  description?: string
}

export function SectionHeader({ id, eyebrow, title, description }: SectionHeaderProps) {
  return (
    <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-(--accent)">
            {eyebrow}
          </p>
        )}
        <h2 id={id} className="text-2xl font-bold tracking-tight text-(--text)">{title}</h2>
        {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-(--muted)">{description}</p>}
      </div>
    </div>
  )
}
