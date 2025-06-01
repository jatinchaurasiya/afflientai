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
          user_id: string
          company_name: string | null
          website: string | null
          stripe_customer_id: string | null
          stripe_account_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          company_name?: string | null
          website?: string | null
          stripe_customer_id?: string | null
          stripe_account_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          company_name?: string | null
          website?: string | null
          stripe_customer_id?: string | null
          stripe_account_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      blogs: {
        Row: {
          id: string
          user_id: string
          url: string
          title: string | null
          verification_status: 'pending' | 'verified' | 'failed'
          verification_token: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          url: string
          title?: string | null
          verification_status?: 'pending' | 'verified' | 'failed'
          verification_token?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          url?: string
          title?: string | null
          verification_status?: 'pending' | 'verified' | 'failed'
          verification_token?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      affiliate_accounts: {
        Row: {
          id: string
          user_id: string
          platform: 'amazon' | 'ebay' | 'walmart' | 'other'
          associate_tag: string | null
          api_key: string | null
          api_secret: string | null
          status: 'active' | 'inactive' | 'pending'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          platform: 'amazon' | 'ebay' | 'walmart' | 'other'
          associate_tag?: string | null
          api_key?: string | null
          api_secret?: string | null
          status?: 'active' | 'inactive' | 'pending'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          platform?: 'amazon' | 'ebay' | 'walmart' | 'other'
          associate_tag?: string | null
          api_key?: string | null
          api_secret?: string | null
          status?: 'active' | 'inactive' | 'pending'
          created_at?: string
          updated_at?: string
        }
      }
      widgets: {
        Row: {
          id: string
          user_id: string
          blog_id: string
          name: string
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          blog_id: string
          name: string
          settings: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          blog_id?: string
          name?: string
          settings?: Json
          created_at?: string
          updated_at?: string
        }
      }
      analytics: {
        Row: {
          id: string
          widget_id: string
          impressions: number
          clicks: number
          conversions: number
          revenue: number
          date: string
        }
        Insert: {
          id?: string
          widget_id: string
          impressions?: number
          clicks?: number
          conversions?: number
          revenue?: number
          date: string
        }
        Update: {
          id?: string
          widget_id?: string
          impressions?: number
          clicks?: number
          conversions?: number
          revenue?: number
          date?: string
        }
      }
      payouts: {
        Row: {
          id: string
          user_id: string
          amount: number
          status: 'pending' | 'processing' | 'paid' | 'failed'
          stripe_payout_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          status?: 'pending' | 'processing' | 'paid' | 'failed'
          stripe_payout_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          status?: 'pending' | 'processing' | 'paid' | 'failed'
          stripe_payout_id?: string | null
          created_at?: string
          updated_at?: string
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