interface AdSlotProps {
  variant?: 'banner' | 'card' | 'footer'
  title?: string
  description?: string
}

export function AdSlot({}: AdSlotProps) {
  // Hidden temporarily to avoid showing placeholder monetization blocks to users.
  return null
}
