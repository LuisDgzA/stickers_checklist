'use client'

import { useTheme } from 'next-themes'
import { useSyncExternalStore } from 'react'
import Image from 'next/image'

function subscribe() { return () => {} }

export function ThemedLogo() {
  const { theme } = useTheme()
  const mounted = useSyncExternalStore(subscribe, () => true, () => false)

  if (!mounted) return <div className="h-9 w-48" />

  return (
    <div className="relative h-9 w-48">
      <Image
        src={theme === 'dark'
          ? '/icons/completalo_logo_horizontal_oscuro.png'
          : '/icons/completalo_logo_horizontal_claro.png'
        }
        alt="completalo.app"
        fill
        className="object-contain object-left"
        priority
      />
    </div>
  )
}
