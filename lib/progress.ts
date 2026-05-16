import type { StickerWithQuantity, CountryProgress, CollectionProgress, Country } from '@/types/album'

export function calcStickerState(quantity: number): 'missing' | 'obtained' | 'repeated' {
  if (quantity === 0) return 'missing'
  if (quantity === 1) return 'obtained'
  return 'repeated'
}

export function calcCountryProgress(country: Country, stickers: StickerWithQuantity[]): CountryProgress {
  const total = stickers.length
  const obtained = stickers.filter(s => s.quantity >= 1).length
  const missing = total - obtained
  const duplicates = stickers.reduce((acc, s) => acc + Math.max(0, s.quantity - 1), 0)
  const percentage = total === 0 ? 0 : Math.round((obtained / total) * 100)
  const isComplete = total > 0 && obtained === total

  return { country, stickers, total, obtained, missing, duplicates, percentage, isComplete }
}

export function calcCollectionProgress(
  stickers: StickerWithQuantity[],
  countries: Country[]
): CollectionProgress {
  const total = stickers.length
  const obtained = stickers.filter(s => s.quantity >= 1).length
  const missing = total - obtained
  const duplicates = stickers.reduce((acc, s) => acc + Math.max(0, s.quantity - 1), 0)
  const percentage = total === 0 ? 0 : Math.round((obtained / total) * 100)

  const completedCountries = countries.filter(country => {
    const countryStickers = stickers.filter(s => s.country_id === country.id)
    return countryStickers.length > 0 && countryStickers.every(s => s.quantity >= 1)
  }).length

  return { total, obtained, missing, duplicates, percentage, completedCountries, totalCountries: countries.length }
}

export function filterStickers(
  stickers: StickerWithQuantity[],
  filter: 'all' | 'missing' | 'complete' | 'repeated' | 'special'
): StickerWithQuantity[] {
  switch (filter) {
    case 'missing': return stickers.filter(s => s.quantity === 0)
    case 'complete': return stickers.filter(s => s.quantity >= 1)
    case 'repeated': return stickers.filter(s => s.quantity > 1)
    case 'special': return stickers.filter(s => s.section_id && !s.country_id)
    default: return stickers
  }
}

export function sortStickersForDisplay(stickers: StickerWithQuantity[]): StickerWithQuantity[] {
  return [...stickers].sort((a, b) =>
    a.number - b.number ||
    a.sort_order - b.sort_order ||
    a.code.localeCompare(b.code, 'es-MX', { numeric: true })
  )
}

export function searchStickers(
  stickers: StickerWithQuantity[],
  query: string
): StickerWithQuantity[] {
  if (!query.trim()) return stickers
  const q = query.toLowerCase()
  return stickers.filter(s =>
    s.code.toLowerCase().includes(q) ||
    (s.name?.toLowerCase().includes(q) ?? false)
  )
}
