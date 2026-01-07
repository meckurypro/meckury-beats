import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})

// Database Types
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
      beats: {
        Row: {
          id: string
          created_at: string
          title: string
          slug: string
          description: string | null
          bpm: number | null
          key: string | null
          mood: string | null
          genre: string | null
          type_beat: string | null
          cover_art_url: string
          mp3_url: string
          wav_url: string
          stems_drive_link: string | null
          lease_price: number
          exclusive_price: number
          exclusive_sold: boolean
          exclusive_buyer_id: string | null
          play_count: number
          lease_count: number
          featured: boolean
          active: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          title: string
          slug: string
          description?: string | null
          bpm?: number | null
          key?: string | null
          mood?: string | null
          genre?: string | null
          type_beat?: string | null
          cover_art_url: string
          mp3_url: string
          wav_url: string
          stems_drive_link?: string | null
          lease_price?: number
          exclusive_price?: number
          exclusive_sold?: boolean
          exclusive_buyer_id?: string | null
          play_count?: number
          lease_count?: number
          featured?: boolean
          active?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          title?: string
          slug?: string
          description?: string | null
          bpm?: number | null
          key?: string | null
          mood?: string | null
          genre?: string | null
          type_beat?: string | null
          cover_art_url?: string
          mp3_url?: string
          wav_url?: string
          stems_drive_link?: string | null
          lease_price?: number
          exclusive_price?: number
          exclusive_sold?: boolean
          exclusive_buyer_id?: string | null
          play_count?: number
          lease_count?: number
          featured?: boolean
          active?: boolean
        }
      }
      purchases: {
        Row: {
          id: string
          created_at: string
          user_id: string
          beat_id: string
          license_type: 'lease' | 'exclusive'
          amount: number
          payment_reference: string
          payment_status: 'pending' | 'completed' | 'failed'
          mp3_downloaded: boolean
          wav_downloaded: boolean
          stems_downloaded: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          beat_id: string
          license_type: 'lease' | 'exclusive'
          amount: number
          payment_reference: string
          payment_status?: 'pending' | 'completed' | 'failed'
          mp3_downloaded?: boolean
          wav_downloaded?: boolean
          stems_downloaded?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          beat_id?: string
          license_type?: 'lease' | 'exclusive'
          amount?: number
          payment_reference?: string
          payment_status?: 'pending' | 'completed' | 'failed'
          mp3_downloaded?: boolean
          wav_downloaded?: boolean
          stems_downloaded?: boolean
        }
      }
      stems_requests: {
        Row: {
          id: string
          created_at: string
          beat_id: string
          buyer_id: string
          purchase_id: string
          status: 'pending_upload' | 'ready' | 'downloaded' | 'expired'
          file_url: string | null
          uploaded_at: string | null
          expires_at: string | null
          downloaded_at: string | null
          download_attempts: number
        }
        Insert: {
          id?: string
          created_at?: string
          beat_id: string
          buyer_id: string
          purchase_id: string
          status?: 'pending_upload' | 'ready' | 'downloaded' | 'expired'
          file_url?: string | null
          uploaded_at?: string | null
          expires_at?: string | null
          downloaded_at?: string | null
          download_attempts?: number
        }
        Update: {
          id?: string
          created_at?: string
          beat_id?: string
          buyer_id?: string
          purchase_id?: string
          status?: 'pending_upload' | 'ready' | 'downloaded' | 'expired'
          file_url?: string | null
          uploaded_at?: string | null
          expires_at?: string | null
          downloaded_at?: string | null
          download_attempts?: number
        }
      }
      portfolio: {
        Row: {
          id: string
          created_at: string
          title: string
          artist_name: string
          cover_art_url: string
          audio_url: string | null
          video_url: string | null
          spotify_url: string | null
          apple_music_url: string | null
          youtube_url: string | null
          release_date: string | null
          description: string | null
          featured: boolean
          order_index: number
        }
        Insert: {
          id?: string
          created_at?: string
          title: string
          artist_name: string
          cover_art_url: string
          audio_url?: string | null
          video_url?: string | null
          spotify_url?: string | null
          apple_music_url?: string | null
          youtube_url?: string | null
          release_date?: string | null
          description?: string | null
          featured?: boolean
          order_index?: number
        }
        Update: {
          id?: string
          created_at?: string
          title?: string
          artist_name?: string
          cover_art_url?: string
          audio_url?: string | null
          video_url?: string | null
          spotify_url?: string | null
          apple_music_url?: string | null
          youtube_url?: string | null
          release_date?: string | null
          description?: string | null
          featured?: boolean
          order_index?: number
        }
      }
      song_submissions: {
        Row: {
          id: string
          created_at: string
          user_id: string
          beat_id: string
          song_title: string
          artist_name: string
          platform: 'spotify' | 'youtube' | 'apple_music' | 'audiomack'
          external_url: string
          embed_url: string | null
          cover_art_url: string | null
          status: 'pending' | 'approved' | 'rejected'
          featured: boolean
          admin_notes: string | null
          approved_at: string | null
          rejected_at: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          beat_id: string
          song_title: string
          artist_name: string
          platform: 'spotify' | 'youtube' | 'apple_music' | 'audiomack'
          external_url: string
          embed_url?: string | null
          cover_art_url?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          featured?: boolean
          admin_notes?: string | null
          approved_at?: string | null
          rejected_at?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          beat_id?: string
          song_title?: string
          artist_name?: string
          platform?: 'spotify' | 'youtube' | 'apple_music' | 'audiomack'
          external_url?: string
          embed_url?: string | null
          cover_art_url?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          featured?: boolean
          admin_notes?: string | null
          approved_at?: string | null
          rejected_at?: string | null
        }
      }
      song_submissions: {
        Row: {
          id: string
          created_at: string
          user_id: string
          beat_id: string
          song_title: string
          artist_name: string
          platform: 'spotify' | 'youtube' | 'apple_music' | 'audiomack'
          external_url: string
          embed_url: string
          cover_art_url: string | null
          status: 'pending' | 'approved' | 'rejected'
          featured: boolean
          admin_notes: string | null
          approved_at: string | null
          approved_by: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          beat_id: string
          song_title: string
          artist_name: string
          platform: 'spotify' | 'youtube' | 'apple_music' | 'audiomack'
          external_url: string
          embed_url: string
          cover_art_url?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          featured?: boolean
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          beat_id?: string
          song_title?: string
          artist_name?: string
          platform?: 'spotify' | 'youtube' | 'apple_music' | 'audiomack'
          external_url?: string
          embed_url?: string
          cover_art_url?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          featured?: boolean
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
        }
      }
      profiles: {
        Row: {
          id: string
          created_at: string
          email: string
          full_name: string | null
          avatar_url: string | null
          is_admin: boolean
        }
        Insert: {
          id: string
          created_at?: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          is_admin?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          is_admin?: boolean
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
