export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          avatar_url: string | null
          nickname: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          nickname?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          nickname?: string | null
          updated_at?: string
        }
      }
      collections: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          cover_image_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          cover_image_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          slug?: string
          description?: string | null
          cover_image_url?: string | null
          is_active?: boolean
          updated_at?: string
        }
      }
      sections: {
        Row: {
          id: string
          collection_id: string
          name: string
          slug: string
          type: string
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          collection_id: string
          name: string
          slug: string
          type?: string
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          slug?: string
          type?: string
          sort_order?: number
          updated_at?: string
        }
      }
      groups: {
        Row: {
          id: string
          collection_id: string
          name: string
          slug: string
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          collection_id: string
          name: string
          slug: string
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
      }
      countries: {
        Row: {
          id: string
          collection_id: string
          group_id: string | null
          name: string
          code: string
          slug: string
          flag_url: string | null
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          collection_id: string
          group_id?: string | null
          name: string
          code: string
          slug: string
          flag_url?: string | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          group_id?: string | null
          name?: string
          code?: string
          slug?: string
          flag_url?: string | null
          sort_order?: number
          updated_at?: string
        }
      }
      stickers: {
        Row: {
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
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          collection_id: string
          section_id?: string | null
          country_id?: string | null
          code: string
          number: number
          name?: string | null
          image_url?: string | null
          sort_order?: number
          max_quantity?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          section_id?: string | null
          country_id?: string | null
          code?: string
          number?: number
          name?: string | null
          image_url?: string | null
          sort_order?: number
          max_quantity?: number
          updated_at?: string
        }
      }
      user_stickers: {
        Row: {
          id: string
          user_id: string
          collection_id: string
          sticker_id: string
          quantity: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          collection_id: string
          sticker_id: string
          quantity?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          quantity?: number
          updated_at?: string
        }
      }
      share_links: {
        Row: {
          id: string
          user_id: string
          collection_id: string
          token: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          collection_id: string
          token: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          is_active?: boolean
          updated_at?: string
        }
      }
    }
  }
}
