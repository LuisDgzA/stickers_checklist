'use client'

import type { Group } from '@/types/album'

interface GroupNavProps {
  groups: Group[]
  selectedGroupId: string | null
  onChange: (groupId: string | null) => void
}

export function GroupNav({ groups, selectedGroupId, onChange }: GroupNavProps) {
  if (groups.length === 0) return null

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar" aria-label="Grupos">
      <button
        onClick={() => onChange(null)}
        className={`shrink-0 rounded-xl px-3 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus) ${
          selectedGroupId === null
            ? 'border border-(--accent) bg-(--accent) text-(--bg) shadow-lg shadow-(--accent)/15'
            : 'border border-(--border) bg-(--surface-soft) text-(--muted) hover:border-(--accent)/40 hover:bg-(--surface-hover) hover:text-(--text)'
        }`}
      >
        Todos
      </button>
      {groups.map(g => (
        <button
          key={g.id}
          onClick={() => onChange(g.id)}
          className={`shrink-0 rounded-xl px-3 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus) ${
            selectedGroupId === g.id
              ? 'border border-(--accent) bg-(--accent) text-(--bg) shadow-lg shadow-(--accent)/15'
              : 'border border-(--border) bg-(--surface-soft) text-(--muted) hover:border-(--accent)/40 hover:bg-(--surface-hover) hover:text-(--text)'
          }`}
        >
          {g.name}
        </button>
      ))}
    </div>
  )
}
