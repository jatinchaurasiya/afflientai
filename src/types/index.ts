export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  company_name?: string;
  website?: string;
  stripe_customer_id?: string;
  stripe_account_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Blog {
  id: string;
  user_id: string;
  url: string;
  title?: string;
  verification_status: 'pending' | 'verified' | 'failed';
  verification_token?: string;
  created_at: string;
  updated_at: string;
}

export interface AffiliateAccount {
  id: string;
  user_id: string;
  platform: 'amazon' | 'ebay' | 'walmart' | 'other';
  associate_tag?: string;
  api_key?: string;
  api_secret?: string;
  status: 'active' | 'inactive' | 'pending';
  created_at: string;
  updated_at: string;
}

export interface Widget {
  id: string;
  user_id: string;
  blog_id: string;
  name: string;
  settings: WidgetSettings;
  created_at: string;
  updated_at: string;
}

export interface WidgetSettings {
  theme: 'light' | 'dark' | 'auto';
  max_products: number;
  categories?: string[];
  price_range?: {
    min?: number;
    max?: number;
  };
  custom_css?: string;
}

export interface AnalyticsData {
  id: string;
  widget_id: string;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  date: string;
}

export interface Payout {
  id: string;
  user_id: string;
  amount: number;
  status: 'pending' | 'processing' | 'paid' | 'failed';
  stripe_payout_id?: string;
  created_at: string;
  updated_at: string;
}