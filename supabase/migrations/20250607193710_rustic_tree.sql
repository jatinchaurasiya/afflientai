/*
  # Create integration tables for the affiliate marketing platform

  1. New Tables
    - `website_monitoring` - Tracks website content monitoring
    - `content_monitoring` - Tracks content analysis status
    - `user_interactions` - Tracks all user interactions with the platform
    - `automation_executions` - Logs automation rule executions
    - `user_notifications` - Stores user notifications
    - `affiliate_products` - Stores products from affiliate networks
    - `popup_products` - Links products to popups
    - `user_behavior_profiles` - Stores user behavior patterns
    - `website_analytics` - Stores website-level analytics
    - `analytics_reports` - Stores generated analytics reports
  
  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for each table
*/

-- Website monitoring table
CREATE TABLE IF NOT EXISTS website_monitoring (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id uuid NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active',
  last_check timestamptz NOT NULL DEFAULT now(),
  check_interval integer NOT NULL DEFAULT 300000,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Content monitoring table
CREATE TABLE IF NOT EXISTS content_monitoring (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id uuid NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  domain text NOT NULL,
  last_check timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User interactions table
CREATE TABLE IF NOT EXISTS user_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id uuid REFERENCES websites(id) ON DELETE SET NULL,
  session_id text NOT NULL,
  user_id uuid,
  event_type text NOT NULL,
  product_id uuid,
  popup_id uuid,
  link_id uuid,
  event_value numeric(10,2),
  metadata jsonb DEFAULT '{}'::jsonb,
  timestamp timestamptz NOT NULL DEFAULT now()
);

-- Automation executions table
CREATE TABLE IF NOT EXISTS automation_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id uuid NOT NULL REFERENCES automation_rules(id) ON DELETE CASCADE,
  content_analysis_id uuid REFERENCES content_analysis(id) ON DELETE SET NULL,
  actions_executed jsonb NOT NULL DEFAULT '{}'::jsonb,
  executed_at timestamptz NOT NULL DEFAULT now()
);

-- User notifications table
CREATE TABLE IF NOT EXISTS user_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Affiliate products table
CREATE TABLE IF NOT EXISTS affiliate_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES affiliate_accounts(id) ON DELETE CASCADE,
  external_id text NOT NULL,
  name text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL,
  currency text DEFAULT 'USD',
  category text,
  image_url text,
  affiliate_url text NOT NULL,
  commission_rate numeric(5,2),
  last_updated timestamptz DEFAULT now(),
  UNIQUE(account_id, external_id)
);

-- Popup products table
CREATE TABLE IF NOT EXISTS popup_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  popup_id uuid NOT NULL REFERENCES popups(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES affiliate_products(id) ON DELETE CASCADE,
  position integer DEFAULT 0,
  custom_title text,
  custom_description text,
  created_at timestamptz DEFAULT now()
);

-- User behavior profiles table
CREATE TABLE IF NOT EXISTS user_behavior_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  session_id text,
  preferences jsonb DEFAULT '{}'::jsonb,
  behavior_patterns jsonb DEFAULT '{}'::jsonb,
  device_info jsonb DEFAULT '{}'::jsonb,
  geographic_info jsonb DEFAULT '{}'::jsonb,
  last_updated timestamptz DEFAULT now()
);

-- Website analytics table
CREATE TABLE IF NOT EXISTS website_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id uuid NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  date date NOT NULL,
  posts_analyzed integer DEFAULT 0,
  keywords_extracted integer DEFAULT 0,
  products_recommended integer DEFAULT 0,
  avg_buying_intent numeric(5,2) DEFAULT 0,
  UNIQUE(website_id, date)
);

-- Analytics reports table
CREATE TABLE IF NOT EXISTS analytics_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  report_type text NOT NULL,
  report_data jsonb NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE website_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE popup_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_behavior_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_reports ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Website monitoring policies
CREATE POLICY "Users can view their own website monitoring"
  ON website_monitoring
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM websites
    WHERE websites.id = website_monitoring.website_id
    AND websites.user_id = auth.uid()
  ));

-- Content monitoring policies
CREATE POLICY "Users can view their own content monitoring"
  ON content_monitoring
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM websites
    WHERE websites.id = content_monitoring.website_id
    AND websites.user_id = auth.uid()
  ));

-- User interactions policies
CREATE POLICY "Users can view interactions for their websites"
  ON user_interactions
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM websites
    WHERE websites.id = user_interactions.website_id
    AND websites.user_id = auth.uid()
  ));

CREATE POLICY "Anyone can insert interactions"
  ON user_interactions
  FOR INSERT
  WITH CHECK (true);

-- Automation executions policies
CREATE POLICY "Users can view their own automation executions"
  ON automation_executions
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM automation_rules
    WHERE automation_rules.id = automation_executions.rule_id
    AND automation_rules.user_id = auth.uid()
  ));

-- User notifications policies
CREATE POLICY "Users can manage their own notifications"
  ON user_notifications
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Affiliate products policies
CREATE POLICY "Users can view their own affiliate products"
  ON affiliate_products
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM affiliate_accounts
    WHERE affiliate_accounts.id = affiliate_products.account_id
    AND affiliate_accounts.user_id = auth.uid()
  ));

-- Popup products policies
CREATE POLICY "Users can view popup products for their popups"
  ON popup_products
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM popups
    JOIN websites ON websites.id = popups.website_id
    WHERE popups.id = popup_products.popup_id
    AND websites.user_id = auth.uid()
  ));

-- User behavior profiles policies
CREATE POLICY "Users can view their own behavior profiles"
  ON user_behavior_profiles
  FOR SELECT
  USING (user_id = auth.uid());

-- Website analytics policies
CREATE POLICY "Users can view analytics for their websites"
  ON website_analytics
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM websites
    WHERE websites.id = website_analytics.website_id
    AND websites.user_id = auth.uid()
  ));

-- Analytics reports policies
CREATE POLICY "Users can view their own analytics reports"
  ON analytics_reports
  FOR SELECT
  USING (user_id = auth.uid());

-- Create functions for analytics updates
CREATE OR REPLACE FUNCTION update_daily_metrics(
  p_website_id uuid,
  p_date date,
  p_metric_type text,
  p_increment integer,
  p_value numeric
) RETURNS void AS $$
BEGIN
  -- This function would update daily metrics in a real implementation
  -- For now, it's a placeholder
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update user preferences
CREATE OR REPLACE FUNCTION update_user_preferences(
  p_user_id uuid,
  p_interaction_type text,
  p_product_id uuid,
  p_value numeric
) RETURNS void AS $$
BEGIN
  -- This function would update user preferences in a real implementation
  -- For now, it's a placeholder
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_interactions_session ON user_interactions(session_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_timestamp ON user_interactions(timestamp);
CREATE INDEX IF NOT EXISTS idx_website_analytics_date ON website_analytics(date);
CREATE INDEX IF NOT EXISTS idx_affiliate_products_category ON affiliate_products(category);