export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Functions: {
      check_nickname_available: {
        Args: { p_nickname: string }
        Returns: boolean
      }
      get_user_nickname: {
        Args: { p_user_id: string }
        Returns: string | null
      }
      get_user_display_name: {
        Args: { p_user_id: string }
        Returns: string | null
      }
    }
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
      achievements: {
        Row: {
          code: string
          name: string
          description: string
          icon: string
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          code: string
          name: string
          description: string
          icon: string
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          description?: string
          icon?: string
          sort_order?: number
          updated_at?: string
        }
      }
      user_achievements: {
        Row: {
          id: string
          user_id: string
          collection_id: string
          achievement_code: string
          unlocked_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          collection_id: string
          achievement_code: string
          unlocked_at?: string
          created_at?: string
        }
        Update: {
          unlocked_at?: string
        }
      }
    }
  }
}
