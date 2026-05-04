interface ProgressBarProps {
  percentage: number
  className?: string
}

export function ProgressBar({ percentage, className = '' }: ProgressBarProps) {
  const color = percentage === 100 ? 'bg-(--accent)' : percentage >= 50 ? 'bg-(--accent)' : 'bg-(--primary)'
  return (
    <div className={`progress-bar ${className}`} aria-label={`Progreso ${percentage}%`} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentage}>
      <div
        className={`progress-fill ${color} shadow-[0_0_18px_var(--progress-glow)]`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}
