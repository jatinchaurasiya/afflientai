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
          full_name: string | null
          company_name: string | null
          website: string | null
          stripe_customer_id: string | null
          stripe_account_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          company_name?: string | null
          website?: string | null
          stripe_customer_id?: string | null
          stripe_account_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          company_name?: string | null
          website?: string | null
          stripe_customer_id?: string | null
          stripe_account_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      websites: {
        Row: {
          id: string
          user_id: string
          domain: string
          name: string | null
          integration_key: string
          status: 'active' | 'inactive' | 'pending'
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          domain: string
          name?: string | null
          integration_key?: string
          status?: 'active' | 'inactive' | 'pending'
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          domain?: string
          name?: string | null
          integration_key?: string
          status?: 'active' | 'inactive' | 'pending'
          settings?: Json
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
          verified: boolean
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
          verified?: boolean
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
          verified?: boolean
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
          encrypted_credentials: string | null
          status: 'active' | 'inactive' | 'pending'
          last_sync_at: string | null
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
          encrypted_credentials?: string | null
          status?: 'active' | 'inactive' | 'pending'
          last_sync_at?: string | null
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
          encrypted_credentials?: string | null
          status?: 'active' | 'inactive' | 'pending'
          last_sync_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      affiliate_links: {
        Row: {
          id: string
          user_id: string
          account_id: string
          widget_id: string | null
          product_id: string
          original_url: string
          affiliate_url: string
          short_url: string | null
          title: string | null
          description: string | null
          image_url: string | null
          price: number | null
          currency: string
          commission: number | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          account_id: string
          widget_id?: string | null
          product_id: string
          original_url: string
          affiliate_url: string
          short_url?: string | null
          title?: string | null
          description?: string | null
          image_url?: string | null
          price?: number | null
          currency?: string
          commission?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          account_id?: string
          widget_id?: string | null
          product_id?: string
          original_url?: string
          affiliate_url?: string
          short_url?: string | null
          title?: string | null
          description?: string | null
          image_url?: string | null
          price?: number | null
          currency?: string
          commission?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      link_clicks: {
        Row: {
          id: string
          link_id: string
          ip_address: string | null
          user_agent: string | null
          referrer: string | null
          country: string | null
          city: string | null
          device: string | null
          browser: string | null
          clicked_at: string
          converted: boolean
          conversion_value: number | null
          session_id: string | null
        }
        Insert: {
          id?: string
          link_id: string
          ip_address?: string | null
          user_agent?: string | null
          referrer?: string | null
          country?: string | null
          city?: string | null
          device?: string | null
          browser?: string | null
          clicked_at?: string
          converted?: boolean
          conversion_value?: number | null
          session_id?: string | null
        }
        Update: {
          id?: string
          link_id?: string
          ip_address?: string | null
          user_agent?: string | null
          referrer?: string | null
          country?: string | null
          city?: string | null
          device?: string | null
          browser?: string | null
          clicked_at?: string
          converted?: boolean
          conversion_value?: number | null
          session_id?: string | null
        }
      }
      link_analytics: {
        Row: {
          id: string
          user_id: string
          account_id: string
          link_id: string | null
          widget_id: string | null
          date: string
          clicks: number
          conversions: number
          revenue: number
          commissions: number
          ctr: number
          conversion_rate: number
        }
        Insert: {
          id?: string
          user_id: string
          account_id: string
          link_id?: string | null
          widget_id?: string | null
          date: string
          clicks?: number
          conversions?: number
          revenue?: number
          commissions?: number
          ctr?: number
          conversion_rate?: number
        }
        Update: {
          id?: string
          user_id?: string
          account_id?: string
          link_id?: string | null
          widget_id?: string | null
          date?: string
          clicks?: number
          conversions?: number
          revenue?: number
          commissions?: number
          ctr?: number
          conversion_rate?: number
        }
      }
      content_analysis: {
        Row: {
          id: string
          website_id: string
          content_url: string | null
          content_hash: string | null
          keywords: Json
          products_identified: Json
          analysis_score: number
          created_at: string
        }
        Insert: {
          id?: string
          website_id: string
          content_url?: string | null
          content_hash?: string | null
          keywords?: Json
          products_identified?: Json
          analysis_score?: number
          created_at?: string
        }
        Update: {
          id?: string
          website_id?: string
          content_url?: string | null
          content_hash?: string | null
          keywords?: Json
          products_identified?: Json
          analysis_score?: number
          created_at?: string
        }
      }
      user_behavior_patterns: {
        Row: {
          id: string
          website_id: string
          session_id: string
          page_url: string | null
          scroll_depth: number
          time_on_page: number
          interactions: Json
          device_type: string
          created_at: string
        }
        Insert: {
          id?: string
          website_id: string
          session_id: string
          page_url?: string | null
          scroll_depth?: number
          time_on_page?: number
          interactions?: Json
          device_type?: string
          created_at?: string
        }
        Update: {
          id?: string
          website_id?: string
          session_id?: string
          page_url?: string | null
          scroll_depth?: number
          time_on_page?: number
          interactions?: Json
          device_type?: string
          created_at?: string
        }
      }
      popups: {
        Row: {
          id: string
          website_id: string
          affiliate_link_id: string | null
          name: string
          config: Json
          trigger_rules: Json
          design_settings: Json
          targeting_rules: Json
          status: 'active' | 'inactive' | 'draft'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          website_id: string
          affiliate_link_id?: string | null
          name: string
          config: Json
          trigger_rules?: Json
          design_settings?: Json
          targeting_rules?: Json
          status?: 'active' | 'inactive' | 'draft'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          website_id?: string
          affiliate_link_id?: string | null
          name?: string
          config?: Json
          trigger_rules?: Json
          design_settings?: Json
          targeting_rules?: Json
          status?: 'active' | 'inactive' | 'draft'
          created_at?: string
          updated_at?: string
        }
      }
      popup_events: {
        Row: {
          id: string
          popup_id: string
          event_type: string
          user_session: string | null
          user_agent: string | null
          ip_address: string | null
          referrer: string | null
          page_url: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          popup_id: string
          event_type: string
          user_session?: string | null
          user_agent?: string | null
          ip_address?: string | null
          referrer?: string | null
          page_url?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          popup_id?: string
          event_type?: string
          user_session?: string | null
          user_agent?: string | null
          ip_address?: string | null
          referrer?: string | null
          page_url?: string | null
          metadata?: Json
          created_at?: string
        }
      }
      automation_rules: {
        Row: {
          id: string
          user_id: string
          website_id: string | null
          name: string
          conditions: Json
          actions: Json
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          website_id?: string | null
          name: string
          conditions: Json
          actions: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          website_id?: string | null
          name?: string
          conditions?: Json
          actions?: Json
          is_active?: boolean
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
      api_keys: {
        Row: {
          id: string
          user_id: string
          service: string
          api_key: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          service: string
          api_key: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          service?: string
          api_key?: string
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