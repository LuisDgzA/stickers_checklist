export const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://completalo.app'
export const SITE_NAME = 'completalo.app'
export const DEFAULT_TITLE = 'completalo.app | Hub digital para completar colecciones'
export const DEFAULT_DESCRIPTION = 'Crea, completa y comparte colecciones digitales. Sigue tu progreso, detecta repetidos y comparte tu avance con QR.'

export function absoluteUrl(path = '/') {
  return new URL(path, SITE_URL).toString()
}

export function truncateDescription(value: string, maxLength = 155) {
  if (value.length <= maxLength) return value
  return `${value.slice(0, maxLength - 1).trimEnd()}…`
}

export function collectionKeywords(collectionName?: string) {
  return [
    'completalo.app',
    'checklist de colecciones',
    'álbum digital',
    'coleccionables',
    'progreso de colección',
    'repetidos',
    'intercambio de coleccionables',
    'compartir colección QR',
    ...(collectionName ? [collectionName, `${collectionName} checklist`, `${collectionName} colección`] : []),
  ]
}
