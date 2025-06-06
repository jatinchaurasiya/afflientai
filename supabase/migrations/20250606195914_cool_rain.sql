/*
  # Add Affiliate Link Management System

  1. New Tables
    - `affiliate_links` - Store generated affiliate links with tracking
    - `link_clicks` - Track individual clicks on affiliate links
    - `link_analytics` - Daily aggregated analytics for links
    - Update existing tables with new fields

  2. Security
    - Enable RLS on all new tables
    - Add policies for user data access
    - Add indexes for performance

  3. Functions
    - Add trigger functions for analytics updates
*/

-- Add affiliate links table
CREATE TABLE IF NOT EXISTS affiliate_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES affiliate_accounts(id) ON DELETE CASCADE,
  widget_id uuid REFERENCES widgets(id) ON DELETE SET NULL,
  product_id text NOT NULL,
  original_url text NOT NULL,
  affiliate_url text NOT NULL,
  short_url text UNIQUE,
  title text,
  description text,
  image_url text,
  price numeric(10,2),
  currency text DEFAULT 'USD',
  commission numeric(5,2),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add link clicks tracking table
CREATE TABLE IF NOT EXISTS link_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id uuid NOT NULL REFERENCES affiliate_links(id) ON DELETE CASCADE,
  ip_address inet,
  user_agent text,
  referrer text,
  country text,
  city text,
  device text,
  browser text,
  clicked_at timestamptz DEFAULT now(),
  converted boolean DEFAULT false,
  conversion_value numeric(10,2),
  session_id text
);

-- Add link analytics table
CREATE TABLE IF NOT EXISTS link_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES affiliate_accounts(id) ON DELETE CASCADE,
  link_id uuid REFERENCES affiliate_links(id) ON DELETE CASCADE,
  widget_id uuid REFERENCES widgets(id) ON DELETE SET NULL,
  date date NOT NULL,
  clicks integer DEFAULT 0,
  conversions integer DEFAULT 0,
  revenue numeric(10,2) DEFAULT 0,
  commissions numeric(10,2) DEFAULT 0,
  ctr numeric(5,2) DEFAULT 0,
  conversion_rate numeric(5,2) DEFAULT 0,
  UNIQUE(user_id, account_id, link_id, date)
);

-- Add new fields to existing tables
ALTER TABLE affiliate_accounts ADD COLUMN IF NOT EXISTS encrypted_credentials text;
ALTER TABLE affiliate_accounts ADD COLUMN IF NOT EXISTS last_sync_at timestamptz;

-- Enable RLS
ALTER TABLE affiliate_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for affiliate_links
CREATE POLICY "Users can manage their own affiliate links"
  ON affiliate_links
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for link_clicks
CREATE POLICY "Users can view clicks on their links"
  ON link_clicks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM affiliate_links 
      WHERE affiliate_links.id = link_clicks.link_id 
      AND affiliate_links.user_id = auth.uid()
    )
  );

CREATE POLICY "Allow anonymous click tracking"
  ON link_clicks
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- RLS Policies for link_analytics
CREATE POLICY "Users can view their own link analytics"
  ON link_analytics
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_affiliate_links_user_id ON affiliate_links(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_account_id ON affiliate_links(account_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_short_url ON affiliate_links(short_url);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_active ON affiliate_links(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_link_clicks_link_id ON link_clicks(link_id);
CREATE INDEX IF NOT EXISTS idx_link_clicks_clicked_at ON link_clicks(clicked_at);
CREATE INDEX IF NOT EXISTS idx_link_clicks_session ON link_clicks(session_id);

CREATE INDEX IF NOT EXISTS idx_link_analytics_user_date ON link_analytics(user_id, date);
CREATE INDEX IF NOT EXISTS idx_link_analytics_account_date ON link_analytics(account_id, date);
CREATE INDEX IF NOT EXISTS idx_link_analytics_link_date ON link_analytics(link_id, date);

-- Trigger for updated_at
CREATE TRIGGER update_affiliate_links_updated_at
  BEFORE UPDATE ON affiliate_links
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to generate short URL
CREATE OR REPLACE FUNCTION generate_short_url()
RETURNS text AS $$
BEGIN
  RETURN encode(gen_random_bytes(6), 'base64')::text;
END;
$$ LANGUAGE plpgsql;

-- Function to update daily analytics
CREATE OR REPLACE FUNCTION update_link_analytics(
  p_user_id uuid,
  p_account_id uuid,
  p_link_id uuid,
  p_widget_id uuid,
  p_metric text,
  p_value numeric DEFAULT 1
)
RETURNS void AS $$
DECLARE
  today date := CURRENT_DATE;
BEGIN
  INSERT INTO link_analytics (
    user_id, account_id, link_id, widget_id, date,
    clicks, conversions, revenue, commissions
  )
  VALUES (
    p_user_id, p_account_id, p_link_id, p_widget_id, today,
    CASE WHEN p_metric = 'clicks' THEN p_value ELSE 0 END,
    CASE WHEN p_metric = 'conversions' THEN p_value ELSE 0 END,
    CASE WHEN p_metric = 'revenue' THEN p_value ELSE 0 END,
    CASE WHEN p_metric = 'commissions' THEN p_value ELSE 0 END
  )
  ON CONFLICT (user_id, account_id, link_id, date)
  DO UPDATE SET
    clicks = link_analytics.clicks + CASE WHEN p_metric = 'clicks' THEN p_value ELSE 0 END,
    conversions = link_analytics.conversions + CASE WHEN p_metric = 'conversions' THEN p_value ELSE 0 END,
    revenue = link_analytics.revenue + CASE WHEN p_metric = 'revenue' THEN p_value ELSE 0 END,
    commissions = link_analytics.commissions + CASE WHEN p_metric = 'commissions' THEN p_value ELSE 0 END,
    ctr = CASE 
      WHEN (link_analytics.clicks + CASE WHEN p_metric = 'clicks' THEN p_value ELSE 0 END) > 0 
      THEN (link_analytics.clicks + CASE WHEN p_metric = 'clicks' THEN p_value ELSE 0 END) * 100.0 / GREATEST(link_analytics.clicks + CASE WHEN p_metric = 'clicks' THEN p_value ELSE 0 END, 1)
      ELSE 0 
    END,
    conversion_rate = CASE 
      WHEN (link_analytics.clicks + CASE WHEN p_metric = 'clicks' THEN p_value ELSE 0 END) > 0 
      THEN (link_analytics.conversions + CASE WHEN p_metric = 'conversions' THEN p_value ELSE 0 END) * 100.0 / (link_analytics.clicks + CASE WHEN p_metric = 'clicks' THEN p_value ELSE 0 END)
      ELSE 0 
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;