export const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://stickers-checklist.com'
export const SITE_NAME = 'stickers_checklist'
export const DEFAULT_TITLE = 'stickers_checklist | Álbumes digitales, checklist y progreso de stickers'
export const DEFAULT_DESCRIPTION = 'Crea, completa y comparte álbumes digitales de coleccionables. Sigue tu progreso, detecta repetidas y comparte tu checklist con QR.'

export function absoluteUrl(path = '/') {
  return new URL(path, SITE_URL).toString()
}

export function truncateDescription(value: string, maxLength = 155) {
  if (value.length <= maxLength) return value
  return `${value.slice(0, maxLength - 1).trimEnd()}…`
}

export function collectionKeywords(collectionName?: string) {
  return [
    'stickers checklist',
    'álbum digital',
    'checklist de stickers',
    'estampas coleccionables',
    'progreso de álbum',
    'repetidas',
    'intercambio de stickers',
    'compartir álbum QR',
    ...(collectionName ? [collectionName, `${collectionName} checklist`, `${collectionName} stickers`] : []),
  ]
}
