import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/ui/ThemeProvider'
import { PwaSetup } from '@/components/ui/PwaSetup'
import { OfflineBanner } from '@/components/ui/OfflineBanner'
import './globals.css'
import 'flag-icons/css/flag-icons.min.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'stickers_checklist | Álbumes digitales y progreso de stickers',
  description: 'Crea, completa y comparte álbumes digitales de coleccionables.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.className} bg-[var(--bg)] text-[var(--text)] min-h-screen`} suppressHydrationWarning>
        <ThemeProvider>
          {children}
          <OfflineBanner />
        </ThemeProvider>
        <PwaSetup />
      </body>
    </html>
  )
}
