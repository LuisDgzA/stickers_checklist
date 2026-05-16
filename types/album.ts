export interface Collection {
  id: string
  name: string
  slug: string
  description: string | null
  cover_image_url: string | null
  emojis: string | null
  is_active: boolean
}

export interface Group {
  id: string
  collection_id: string
  name: string
  slug: string
  sort_order: number
}

export interface Country {
  id: string
  collection_id: string
  group_id: string | null
  name: string
  code: string
  slug: string
  flag_url: string | null
  sort_order: number
}

export interface Section {
  id: string
  collection_id: string
  name: string
  slug: string
  type: string
  sort_order: number
}

export interface Sticker {
  id: string
  collection_id: string
  section_id: string | null
  country_id: string | null
  code: string
  number: number
  name: string | null
  image_url: string | null
  sort_order: number
  max_quantity: number
}

export interface UserSticker {
  id: string
  user_id: string
  collection_id: string
  sticker_id: string
  quantity: number
}

export interface StickerWithQuantity extends Sticker {
  quantity: number
}

export interface CountryProgress {
  country: Country
  stickers: StickerWithQuantity[]
  total: number
  obtained: number
  missing: number
  duplicates: number
  percentage: number
  isComplete: boolean
}

export interface CollectionProgress {
  total: number
  obtained: number
  missing: number
  duplicates: number
  percentage: number
  completedCountries: number
  totalCountries: number
}

export type StickerFilter = 'all' | 'missing' | 'complete' | 'repeated' | 'special'

export interface ShareLink {
  id: string
  user_id: string
  collection_id: string
  token: string
  is_active: boolean
}

export interface MatchResult {
  ownerCanGive: StickerWithQuantity[]
  visitorCanGive: StickerWithQuantity[]
  possibleExchanges: number
}

export type ExchangeStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled'

export interface ExchangeRequest {
  id: string
  collection_id: string
  requester_id: string
  owner_id: string
  requester_gives: string[]
  owner_gives: string[]
  status: ExchangeStatus
  share_token: string
  created_at: string
  updated_at: string
}
