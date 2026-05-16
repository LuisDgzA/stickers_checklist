import type { Collection, Country, Group, Section, Sticker, StickerWithQuantity } from '@/types/album'

export const DEMO_ALBUM_SLUG = 'demo'

export const demoCollection: Collection = {
  id: 'demo-collection',
  name: 'Colección demo',
  slug: DEMO_ALBUM_SLUG,
  description: 'Espacio de práctica para explorar filtros, progreso, repetidos y navegación.',
  cover_image_url: null,
  emojis: '🧪✨',
  is_active: true,
}

export const demoGroups: Group[] = [
  { id: 'demo-group-a', collection_id: demoCollection.id, name: 'Grupo A', slug: 'grupo-a', sort_order: 1 },
  { id: 'demo-group-b', collection_id: demoCollection.id, name: 'Grupo B', slug: 'grupo-b', sort_order: 2 },
]

export const demoCountries: Country[] = [
  { id: 'demo-country-1', collection_id: demoCollection.id, group_id: 'demo-group-a', name: 'Equipo Norte', code: 'NOR', slug: 'equipo-norte', flag_url: null, sort_order: 1 },
  { id: 'demo-country-2', collection_id: demoCollection.id, group_id: 'demo-group-a', name: 'Equipo Sur', code: 'SUR', slug: 'equipo-sur', flag_url: null, sort_order: 2 },
  { id: 'demo-country-3', collection_id: demoCollection.id, group_id: 'demo-group-b', name: 'Equipo Este', code: 'EST', slug: 'equipo-este', flag_url: null, sort_order: 3 },
  { id: 'demo-country-4', collection_id: demoCollection.id, group_id: 'demo-group-b', name: 'Equipo Oeste', code: 'OES', slug: 'equipo-oeste', flag_url: null, sort_order: 4 },
]

export const demoSections: Section[] = [
  { id: 'demo-section-special', collection_id: demoCollection.id, name: 'Especiales', slug: 'especiales', type: 'special', sort_order: 13 },
]

function countrySticker(country: Country, index: number, quantity: number): StickerWithQuantity {
  return {
    id: `${country.id}-sticker-${index}`,
    collection_id: demoCollection.id,
    section_id: null,
    country_id: country.id,
    code: `${country.code}-${index}`,
    number: index,
    name: index === 1 ? 'Escudo' : index === 2 ? 'Figura principal' : `Item ${index}`,
    image_url: null,
    sort_order: country.sort_order * 100 + index,
    max_quantity: 99,
    quantity,
  }
}

function specialSticker(index: number, quantity: number): StickerWithQuantity {
  return {
    id: `demo-special-${index}`,
    collection_id: demoCollection.id,
    section_id: 'demo-section-special',
    country_id: null,
    code: `ESP-${index}`,
    number: 100 + index,
    name: index === 1 ? 'Edición limitada' : `Especial ${index}`,
    image_url: null,
    sort_order: 1000 + index,
    max_quantity: 99,
    quantity,
  }
}

export function getDemoStickers(): StickerWithQuantity[] {
  const quantities = [1, 0, 2, 0, 1]
  return [
    ...demoCountries.flatMap(country => quantities.map((quantity, index) => countrySticker(country, index + 1, quantity))),
    specialSticker(1, 1),
    specialSticker(2, 0),
    specialSticker(3, 2),
    specialSticker(4, 0),
  ]
}

export function getDemoBaseStickers(): Sticker[] {
  return getDemoStickers().map(sticker => ({
    id: sticker.id,
    collection_id: sticker.collection_id,
    section_id: sticker.section_id,
    country_id: sticker.country_id,
    code: sticker.code,
    number: sticker.number,
    name: sticker.name,
    image_url: sticker.image_url,
    sort_order: sticker.sort_order,
    max_quantity: sticker.max_quantity,
  }))
}
