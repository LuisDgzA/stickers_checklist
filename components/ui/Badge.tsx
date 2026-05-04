interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'missing' | 'obtained' | 'repeated' | 'success'
}

export function Badge({ children, variant = 'default' }: BadgeProps) {
  const styles = {
    default: 'bg-slate-700 text-slate-300',
    missing: 'bg-slate-700 text-slate-400',
    obtained: 'bg-blue-900/50 text-blue-300 border border-blue-500/30',
    repeated: 'bg-amber-900/50 text-amber-300 border border-amber-500/30',
    success: 'bg-green-900/50 text-green-300 border border-green-500/30',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${styles[variant]}`}>
      {children}
    </span>
  )
}
