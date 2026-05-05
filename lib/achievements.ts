import { createClient } from '@/lib/supabase/client'
import type { Country, Group, StickerWithQuantity } from '@/types/album'

export interface AchievementDefinition {
  code: string
  name: string
  description: string
  icon: string
  sort_order: number
}

export interface UserAchievement {
  id: string
  user_id: string
  collection_id: string
  achievement_code: string
  unlocked_at: string
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
  { code: 'first_sticker', name: 'Primer sticker', description: 'Marcaste tu primera estampa.', icon: 'sparkles', sort_order: 10 },
  { code: 'album_5_percent', name: 'Ya empezó la colección', description: 'Completaste el 5% del álbum.', icon: 'progress-5', sort_order: 20 },
  { code: 'album_25_percent', name: 'Coleccionista constante', description: 'Completaste el 25% del álbum.', icon: 'progress-25', sort_order: 30 },
  { code: 'album_50_percent', name: 'Medio álbum listo', description: 'Completaste la mitad del álbum.', icon: 'progress-50', sort_order: 40 },
  { code: 'album_75_percent', name: 'Casi completo', description: 'Completaste el 75% del álbum.', icon: 'progress-75', sort_order: 50 },
  { code: 'album_complete', name: 'Álbum completo', description: 'Completaste todas las estampas del álbum.', icon: 'trophy', sort_order: 60 },
  { code: 'last_sticker', name: 'Último sticker', description: 'Conseguiste la estampa que faltaba para cerrar el álbum.', icon: 'flag', sort_order: 70 },
  { code: 'first_team_completed', name: 'Primer equipo completado', description: 'Completaste tu primer país o equipo.', icon: 'shield', sort_order: 80 },
  { code: 'first_group_completed', name: 'Primer grupo completado', description: 'Completaste todos los países de un grupo.', icon: 'grid', sort_order: 90 },
  { code: 'first_duplicate', name: 'Primer repetido', description: 'Registraste tu primer sticker repetido.', icon: 'copy', sort_order: 100 },
  { code: 'market_open', name: 'Mercado abierto', description: 'Ya tienes repetidas para intercambiar.', icon: 'swap', sort_order: 110 },
]

const ACHIEVEMENT_MAP = new Map(ACHIEVEMENTS.map(achievement => [achievement.code, achievement]))

export function getAchievementDefinition(code: string): AchievementDefinition | null {
  return ACHIEVEMENT_MAP.get(code) ?? null
}

function percentage(stickers: StickerWithQuantity[]): number {
  if (stickers.length === 0) return 0
  const obtained = stickers.filter(sticker => sticker.quantity >= 1).length
  return Math.round((obtained / stickers.length) * 100)
}

function completedCountryCount(stickers: StickerWithQuantity[], countries: Country[]): number {
  return countries.filter(country => {
    const countryStickers = stickers.filter(sticker => sticker.country_id === country.id)
    return countryStickers.length > 0 && countryStickers.every(sticker => sticker.quantity >= 1)
  }).length
}

function completedGroupCount(stickers: StickerWithQuantity[], countries: Country[], groups: Group[]): number {
  return groups.filter(group => {
    const groupCountries = countries.filter(country => country.group_id === group.id)
    return groupCountries.length > 0 && groupCountries.every(country => {
      const countryStickers = stickers.filter(sticker => sticker.country_id === country.id)
      return countryStickers.length > 0 && countryStickers.every(sticker => sticker.quantity >= 1)
    })
  }).length
}

export function detectAchievementCodes({
  previous,
  next,
  countries,
  groups,
  changedSticker,
  unlockedCodes,
}: {
  previous: StickerWithQuantity[]
  next: StickerWithQuantity[]
  countries: Country[]
  groups: Group[]
  changedSticker: StickerWithQuantity
  unlockedCodes: Set<string>
}): string[] {
  const codes = new Set<string>()
  const previousObtained = previous.filter(sticker => sticker.quantity >= 1).length
  const nextObtained = next.filter(sticker => sticker.quantity >= 1).length
  const previousPercentage = percentage(previous)
  const nextPercentage = percentage(next)

  if (previousObtained === 0 && nextObtained > 0) codes.add('first_sticker')
  for (const [threshold, code] of [
    [5, 'album_5_percent'],
    [25, 'album_25_percent'],
    [50, 'album_50_percent'],
    [75, 'album_75_percent'],
    [100, 'album_complete'],
  ] as const) {
    if (previousPercentage < threshold && nextPercentage >= threshold) codes.add(code)
  }
  if (previousPercentage < 100 && nextPercentage === 100) codes.add('last_sticker')
  if (completedCountryCount(previous, countries) === 0 && completedCountryCount(next, countries) > 0) codes.add('first_team_completed')
  if (completedGroupCount(previous, countries, groups) === 0 && completedGroupCount(next, countries, groups) > 0) codes.add('first_group_completed')
  if (changedSticker.quantity <= 1 && (next.find(sticker => sticker.id === changedSticker.id)?.quantity ?? 0) > 1) {
    codes.add('first_duplicate')
    codes.add('market_open')
  }

  return Array.from(codes).filter(code => !unlockedCodes.has(code))
}

export function detectExistingAchievements({
  stickers,
  countries,
  groups,
  unlockedCodes,
}: {
  stickers: StickerWithQuantity[]
  countries: Country[]
  groups: Group[]
  unlockedCodes: Set<string>
}): string[] {
  const codes = new Set<string>()
  const obtained = stickers.filter(s => s.quantity >= 1).length
  const pct = percentage(stickers)
  const hasDuplicate = stickers.some(s => s.quantity > 1)

  if (obtained >= 1) codes.add('first_sticker')
  if (pct >= 5)   codes.add('album_5_percent')
  if (pct >= 25)  codes.add('album_25_percent')
  if (pct >= 50)  codes.add('album_50_percent')
  if (pct >= 75)  codes.add('album_75_percent')
  if (pct >= 100) { codes.add('album_complete'); codes.add('last_sticker') }
  if (completedCountryCount(stickers, countries) >= 1) codes.add('first_team_completed')
  if (completedGroupCount(stickers, countries, groups) >= 1) codes.add('first_group_completed')
  if (hasDuplicate) { codes.add('first_duplicate'); codes.add('market_open') }

  return Array.from(codes).filter(code => !unlockedCodes.has(code))
}

export async function unlockAchievements(
  userId: string,
  collectionId: string,
  codes: string[]
): Promise<AchievementDefinition[]> {
  if (codes.length === 0) return []
  const supabase = createClient()
  const rows = codes.map(code => ({
    user_id: userId,
    collection_id: collectionId,
    achievement_code: code,
  }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('user_achievements')
    .upsert(rows, { onConflict: 'user_id,collection_id,achievement_code', ignoreDuplicates: true })
    .select('achievement_code')

  if (error) return []
  const insertedCodes = new Set((data ?? []).map((row: { achievement_code: string }) => row.achievement_code))
  return codes
    .filter(code => insertedCodes.has(code))
    .map(code => getAchievementDefinition(code))
    .filter((achievement): achievement is AchievementDefinition => Boolean(achievement))
}
