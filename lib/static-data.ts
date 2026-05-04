import { unstable_cache } from 'next/cache'
import { createClient } from '@/lib/supabase/client'
import type { Collection, Group, Country, Section, Sticker } from '@/types/album'

export const getCollections = unstable_cache(
  async (): Promise<Collection[]> => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true })
    if (error) throw error
    return data
  },
  ['collections'],
  { tags: ['collections'], revalidate: 604800 }
)

export const getCollectionBySlug = unstable_cache(
  async (slug: string): Promise<Collection | null> => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()
    if (error) return null
    return data
  },
  ['collection-by-slug'],
  { tags: ['collections'], revalidate: 604800 }
)

export const getGroups = unstable_cache(
  async (collectionId: string): Promise<Group[]> => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('collection_id', collectionId)
      .order('sort_order', { ascending: true })
    if (error) throw error
    return data
  },
  ['groups'],
  { tags: ['static-data'], revalidate: false }
)

export const getCountries = unstable_cache(
  async (collectionId: string): Promise<Country[]> => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('countries')
      .select('*')
      .eq('collection_id', collectionId)
      .order('sort_order', { ascending: true })
    if (error) throw error
    return data
  },
  ['countries'],
  { tags: ['static-data'], revalidate: false }
)

export const getSections = unstable_cache(
  async (collectionId: string): Promise<Section[]> => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('sections')
      .select('*')
      .eq('collection_id', collectionId)
      .order('sort_order', { ascending: true })
    if (error) throw error
    return data
  },
  ['sections'],
  { tags: ['static-data'], revalidate: false }
)

export const getStickers = unstable_cache(
  async (collectionId: string): Promise<Sticker[]> => {
    const supabase = createClient()
    const PAGE = 1000
    const all: Sticker[] = []
    let from = 0

    while (true) {
      const { data, error } = await supabase
        .from('stickers')
        .select('*')
        .eq('collection_id', collectionId)
        .order('sort_order', { ascending: true })
        .range(from, from + PAGE - 1)
      if (error) throw error
      all.push(...(data ?? []))
      if (!data || data.length < PAGE) break
      from += PAGE
    }

    return all
  },
  ['stickers'],
  { tags: ['static-data'], revalidate: false }
)
