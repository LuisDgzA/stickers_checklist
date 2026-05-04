interface EmptyStateProps {
  title: string
  description: string
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="rounded-3xl border border-dashed border-(--border) bg-(--surface-soft) px-6 py-14 text-center shadow-sm">
      <div className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl border border-(--border) bg-(--surface)">
        <svg className="size-5 text-(--accent)" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V7a2 2 0 00-2-2h-5l-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2h6" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 19l2 2 4-4" />
        </svg>
      </div>
      <h2 className="text-base font-semibold text-(--text)">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-(--muted)">{description}</p>
    </div>
  )
}
