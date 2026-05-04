import type { CollectionProgress } from '@/types/album'
import { ProgressBar } from '@/components/ui/ProgressBar'

interface StatsBarProps {
  progress: CollectionProgress
  collectionName: string
}

export function StatsBar({ progress, collectionName }: StatsBarProps) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-(--border) bg-(--surface) p-5 shadow-xl shadow-black/5 sm:p-6 dark:shadow-black/20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,var(--hero-glow),transparent_30%),linear-gradient(135deg,transparent,var(--surface-soft))]" />
      <div className="relative">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex rounded-full border border-(--accent)/30 bg-(--accent)/10 px-3 py-1 text-xs font-semibold text-(--accent)">
              Álbum activo
            </span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-(--text) sm:text-4xl">{collectionName}</h2>
            <p className="mt-2 text-sm text-(--muted)">
              {progress.obtained} de {progress.total} estampas registradas
            </p>
          </div>
          <div className="rounded-3xl border border-(--border) bg-(--surface)/80 px-5 py-4 text-left sm:text-right">
            <div className="text-4xl font-bold text-(--accent)">{progress.percentage}%</div>
            <div className="mt-1 text-xs font-medium text-(--muted)">completado</div>
          </div>
        </div>

        <ProgressBar percentage={progress.percentage} className="mt-5" />

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatItem label="Total" value={progress.total} />
          <StatItem label="Obtenidas" value={progress.obtained} color="text-(--accent)" />
          <StatItem label="Faltantes" value={progress.missing} color="text-(--muted)" />
          <StatItem label="Duplicados" value={progress.duplicates} color="text-(--amber)" />
        </div>

        <div className="mt-4 rounded-2xl border border-(--border) bg-(--surface-soft) px-4 py-3">
          <span className="text-sm text-(--muted)">
            Países completos: <span className="font-semibold text-(--accent)">{progress.completedCountries}</span>
            <span className="opacity-60"> / {progress.totalCountries}</span>
          </span>
        </div>
      </div>
    </section>
  )
}

function StatItem({ label, value, color = 'text-(--text)' }: { label: string; value: number; color?: string }) {
  return (
    <div className="rounded-2xl border border-(--border) bg-(--surface-soft) p-3">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="mt-1 text-xs text-(--muted)">{label}</div>
    </div>
  )
}
