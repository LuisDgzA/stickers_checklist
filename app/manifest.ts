import type { MetadataRoute } from 'next'
import { DEFAULT_DESCRIPTION, SITE_NAME } from '@/lib/seo'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} - Álbumes digitales`,
    short_name: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    start_url: '/',
    display: 'standalone',
    background_color: '#f5f7fb',
    theme_color: '#008f7a',
    categories: ['lifestyle', 'sports', 'utilities'],
    icons: [
      { src: '/icons/completalo_icono_app_oscuro_512.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/completalo_icono_app_oscuro_512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/completalo_icono_app_oscuro_512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
