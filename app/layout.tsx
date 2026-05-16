import type { Metadata } from 'next'
import { Fredoka } from 'next/font/google'
import { ThemeProvider } from '@/components/ui/ThemeProvider'
import { PwaSetup } from '@/components/ui/PwaSetup'
import { OfflineBanner } from '@/components/ui/OfflineBanner'
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE, SITE_NAME, SITE_URL } from '@/lib/seo'
import './globals.css'
import 'flag-icons/css/flag-icons.min.css'

const fredoka = Fredoka({ subsets: ['latin'], weight: ['300', '400', '500', '600', '700'] })

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: {
    default: DEFAULT_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  keywords: [
    'completalo.app',
    'checklist de colecciones',
    'álbum digital',
    'checklist de coleccionables',
    'coleccionables',
    'intercambio de coleccionables',
    'QR de colección',
  ],
  alternates: { canonical: '/' },
  manifest: '/manifest.webmanifest',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'es_MX',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
  icons: {
    icon: [
      { url: '/icons/completalo_icono_app_oscuro_512.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/completalo_icono_app_oscuro_512.png', sizes: '192x192', type: 'image/png' },
    ],
    shortcut: '/icons/completalo_icono_app_oscuro_512.png',
    apple: '/icons/completalo_icono_app_oscuro_512.png',
  },
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: 'default',
  },
  formatDetection: {
    telephone: false,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${fredoka.className} bg-[var(--bg)] text-[var(--text)] min-h-screen`} suppressHydrationWarning>
        <ThemeProvider>
          {children}
          <footer className="border-t border-(--border) bg-(--bg) px-4 py-6 text-(--muted)">
            <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-2 text-center text-sm sm:flex-row">
              <span>Hecho con ❤️ por</span>
              <a
                href="https://brosvalley.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-xl px-2 py-1 transition hover:bg-(--surface-hover) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus)"
                aria-label="Visitar Bros Valley"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://brosvalley.com/_astro/logotipo.C9wBWoss_17U3AP.svg"
                  alt="Bros Valley"
                  className="h-6 w-auto transition duration-200 dark:brightness-0 dark:invert [&:not(.dark_*)]:brightness-100 [&:not(.dark_*)]:invert-0"
                />
              </a>
            </div>
          </footer>
          <OfflineBanner />
        </ThemeProvider>
        <PwaSetup />
      </body>
    </html>
  )
}
