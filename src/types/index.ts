// User types
export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
}

// Website types
export interface Website {
  id: string;
  user_id: string;
  domain: string;
  name: string | null;
  integration_key: string;
  status: 'active' | 'inactive' | 'pending';
  settings: any;
  created_at: string;
  updated_at: string;
}

// Affiliate Account types
export interface AffiliateAccount {
  id: string;
  user_id: string;
  platform: 'amazon' | 'ebay' | 'walmart' | 'other';
  associate_tag: string | null;
  api_key: string | null;
  api_secret: string | null;
  encrypted_credentials: string | null;
  status: 'active' | 'inactive' | 'pending';
  last_sync_at: string | null;
  created_at: string;
  updated_at: string;
}

// Affiliate Link types
export interface AffiliateLink {
  id: string;
  user_id: string;
  account_id: string;
  widget_id: string | null;
  product_id: string;
  original_url: string;
  affiliate_url: string;
  short_url: string | null;
  title: string | null;
  description: string | null;
  image_url: string | null;
  price: number | null;
  currency: string;
  commission: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  affiliate_accounts?: {
    platform: string;
    associate_tag: string;
  };
}

// Analytics types
export interface LinkAnalytics {
  id: string;
  user_id: string;
  account_id: string;
  link_id: string | null;
  widget_id: string | null;
  date: string;
  clicks: number;
  conversions: number;
  revenue: number;
  commissions: number;
  ctr: number;
  conversion_rate: number;
}

// Popup types
export interface Popup {
  id: string;
  website_id: string;
  affiliate_link_id: string | null;
  name: string;
  config: any;
  trigger_rules: any;
  design_settings: any;
  targeting_rules: any;
  status: 'active' | 'inactive' | 'draft';
  created_at: string;
  updated_at: string;
}

// Automation types
export interface AutomationRule {
  id: string;
  user_id: string;
  website_id: string | null;
  name: string;
  conditions: any;
  actions: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Content Analysis types
export interface ContentAnalysis {
  id: string;
  website_id: string;
  content_url: string | null;
  content_hash: string | null;
  keywords: string[];
  products_identified: any[];
  analysis_score: number;
  created_at: string;
}

// User Behavior types
export interface UserBehavior {
  id: string;
  website_id: string;
  session_id: string;
  page_url: string | null;
  scroll_depth: number;
  time_on_page: number;
  interactions: any;
  device_type: string;
  created_at: string;
}

// Predictive Models types
export interface PredictionModel {
  name: string;
  type: string;
  accuracy: number;
  features: string[];
  lastUpdated: string;
}

export interface ConversionPrediction {
  user_id: string;
  conversion_probability: number;
  confidence_interval: [number, number];
  contributing_factors: {
    factor: string;
    importance: number;
  }[];
  recommendation: {
    action: string;
    popup_type: string;
    urgency: string;
    offer_type: string;
  };
  timestamp: string;
}

export interface UserLTVPrediction {
  user_id: string;
  predicted_ltv: number;
  confidence_interval: [number, number];
  time_horizon_days: number;
  contributing_factors: {
    purchase_probability: number;
    expected_frequency: number;
    average_order_value: number;
    churn_probability: number;
  };
  ltv_segment: {
    segment: 'high_value' | 'medium_value' | 'developing' | 'low_value';
    priority: 'premium' | 'standard' | 'nurture' | 'acquisition';
  };
  prediction_date: string;
}

export interface ChurnPrediction {
  user_id: string;
  churn_probability: number;
  risk_level: 'high' | 'medium' | 'low';
  risk_factors: {
    factor: string;
    contribution: number;
  }[];
  prevention_plan: {
    strategies: string[];
    success_probability: number;
  };
  estimated_time_to_churn: number; // days
  timestamp: string;
}