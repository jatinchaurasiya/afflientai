/*
  # Automation System Database Schema

  1. New Tables
    - `websites` - Store user websites for automation
    - `content_analysis` - Store content analysis results
    - `user_behavior_patterns` - Track user behavior for optimization
    - `popups` - Store popup configurations
    - `popup_events` - Track popup interactions
    - `automation_rules` - Store automation rules and conditions

  2. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users to manage their own data
*/

-- Websites table
CREATE TABLE IF NOT EXISTS websites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  domain text NOT NULL,
  name text,
  integration_key text UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  settings jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Content analysis table
CREATE TABLE IF NOT EXISTS content_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id uuid NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  content_url text,
  content_hash text,
  keywords jsonb DEFAULT '[]',
  products_identified jsonb DEFAULT '[]',
  analysis_score numeric(3,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- User behavior patterns table
CREATE TABLE IF NOT EXISTS user_behavior_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id uuid NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  page_url text,
  scroll_depth integer DEFAULT 0,
  time_on_page integer DEFAULT 0,
  interactions jsonb DEFAULT '{}',
  device_type text DEFAULT 'desktop',
  created_at timestamptz DEFAULT now()
);

-- Popups table
CREATE TABLE IF NOT EXISTS popups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id uuid NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  affiliate_link_id uuid REFERENCES affiliate_links(id) ON DELETE CASCADE,
  name text NOT NULL,
  config jsonb NOT NULL DEFAULT '{}',
  trigger_rules jsonb DEFAULT '{}',
  design_settings jsonb DEFAULT '{}',
  targeting_rules jsonb DEFAULT '{}',
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Popup events table
CREATE TABLE IF NOT EXISTS popup_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  popup_id uuid NOT NULL REFERENCES popups(id) ON DELETE CASCADE,
  event_type text NOT NULL, -- 'displayed', 'clicked', 'closed', 'converted'
  user_session text,
  user_agent text,
  ip_address inet,
  referrer text,
  page_url text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Automation rules table (already exists, but adding if not)
CREATE TABLE IF NOT EXISTS automation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  website_id uuid REFERENCES websites(id) ON DELETE CASCADE,
  name text NOT NULL,
  conditions jsonb NOT NULL DEFAULT '{}',
  actions jsonb NOT NULL DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_behavior_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE popups ENABLE ROW LEVEL SECURITY;
ALTER TABLE popup_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for websites
CREATE POLICY "Users can manage their own websites"
  ON websites
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for content_analysis
CREATE POLICY "Users can view content analysis for their websites"
  ON content_analysis
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM websites 
      WHERE websites.id = content_analysis.website_id 
      AND websites.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM websites 
      WHERE websites.id = content_analysis.website_id 
      AND websites.user_id = auth.uid()
    )
  );

-- RLS Policies for user_behavior_patterns
CREATE POLICY "Users can view behavior patterns for their websites"
  ON user_behavior_patterns
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM websites 
      WHERE websites.id = user_behavior_patterns.website_id 
      AND websites.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM websites 
      WHERE websites.id = user_behavior_patterns.website_id 
      AND websites.user_id = auth.uid()
    )
  );

-- Allow anonymous behavior tracking
CREATE POLICY "Allow anonymous behavior tracking"
  ON user_behavior_patterns
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- RLS Policies for popups
CREATE POLICY "Users can manage popups for their websites"
  ON popups
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM websites 
      WHERE websites.id = popups.website_id 
      AND websites.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM websites 
      WHERE websites.id = popups.website_id 
      AND websites.user_id = auth.uid()
    )
  );

-- RLS Policies for popup_events
CREATE POLICY "Users can view popup events for their popups"
  ON popup_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM popups 
      JOIN websites ON websites.id = popups.website_id
      WHERE popups.id = popup_events.popup_id 
      AND websites.user_id = auth.uid()
    )
  );

-- Allow anonymous popup event tracking
CREATE POLICY "Allow anonymous popup event tracking"
  ON popup_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- RLS Policies for automation_rules
CREATE POLICY "Users can manage their own automation rules"
  ON automation_rules
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_websites_user_id ON websites(user_id);
CREATE INDEX IF NOT EXISTS idx_websites_domain ON websites(domain);
CREATE INDEX IF NOT EXISTS idx_content_analysis_website_id ON content_analysis(website_id);
CREATE INDEX IF NOT EXISTS idx_content_analysis_content_hash ON content_analysis(content_hash);
CREATE INDEX IF NOT EXISTS idx_user_behavior_website_id ON user_behavior_patterns(website_id);
CREATE INDEX IF NOT EXISTS idx_user_behavior_session ON user_behavior_patterns(session_id);
CREATE INDEX IF NOT EXISTS idx_popups_website_id ON popups(website_id);
CREATE INDEX IF NOT EXISTS idx_popup_events_popup_id ON popup_events(popup_id);
CREATE INDEX IF NOT EXISTS idx_popup_events_event_type ON popup_events(event_type);
CREATE INDEX IF NOT EXISTS idx_automation_rules_user_id ON automation_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_automation_rules_website_id ON automation_rules(website_id);

-- Triggers for updated_at
CREATE TRIGGER update_websites_updated_at
  BEFORE UPDATE ON websites
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_popups_updated_at
  BEFORE UPDATE ON popups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_automation_rules_updated_at
  BEFORE UPDATE ON automation_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to analyze content and extract keywords
CREATE OR REPLACE FUNCTION extract_keywords_from_content(content_text text)
RETURNS jsonb AS $$
DECLARE
  words text[];
  word_counts jsonb := '{}';
  word text;
  keywords jsonb := '[]';
BEGIN
  -- Simple keyword extraction (in production, you'd use AI/ML)
  words := string_to_array(
    regexp_replace(
      lower(content_text), 
      '[^a-zA-Z\s]', 
      '', 
      'g'
    ), 
    ' '
  );
  
  -- Count word frequencies
  FOREACH word IN ARRAY words
  LOOP
    IF length(word) > 3 THEN
      word_counts := jsonb_set(
        word_counts, 
        ARRAY[word], 
        to_jsonb(COALESCE((word_counts->word)::int, 0) + 1)
      );
    END IF;
  END LOOP;
  
  -- Return top 10 keywords
  SELECT jsonb_agg(key ORDER BY value::int DESC)
  INTO keywords
  FROM (
    SELECT key, value
    FROM jsonb_each(word_counts)
    LIMIT 10
  ) t;
  
  RETURN COALESCE(keywords, '[]');
END;
$$ LANGUAGE plpgsql;

-- Function to get optimal popup trigger based on behavior data
CREATE OR REPLACE FUNCTION get_optimal_popup_trigger(website_uuid uuid)
RETURNS jsonb AS $$
DECLARE
  avg_scroll_depth numeric;
  avg_time_on_page numeric;
  optimal_trigger jsonb;
BEGIN
  -- Calculate average user behavior
  SELECT 
    AVG(scroll_depth),
    AVG(time_on_page)
  INTO avg_scroll_depth, avg_time_on_page
  FROM user_behavior_patterns
  WHERE website_id = website_uuid
    AND created_at > NOW() - INTERVAL '30 days';
  
  -- Set defaults if no data
  avg_scroll_depth := COALESCE(avg_scroll_depth, 60);
  avg_time_on_page := COALESCE(avg_time_on_page, 30);
  
  -- Determine optimal trigger
  optimal_trigger := jsonb_build_object(
    'type', CASE 
      WHEN avg_scroll_depth > 70 THEN 'scroll_percentage'
      WHEN avg_time_on_page > 60 THEN 'time_delay'
      ELSE 'exit_intent'
    END,
    'value', CASE 
      WHEN avg_scroll_depth > 70 THEN GREATEST(avg_scroll_depth - 10, 40)
      WHEN avg_time_on_page > 60 THEN GREATEST(avg_time_on_page / 2, 15)
      ELSE 0
    END,
    'delay', GREATEST(avg_time_on_page / 4, 5)
  );
  
  RETURN optimal_trigger;
END;
$$ LANGUAGE plpgsql;

-- Function to track popup performance
CREATE OR REPLACE FUNCTION calculate_popup_performance(popup_uuid uuid)
RETURNS jsonb AS $$
DECLARE
  total_displays integer;
  total_clicks integer;
  total_conversions integer;
  ctr numeric;
  conversion_rate numeric;
  performance jsonb;
BEGIN
  -- Get popup event counts
  SELECT 
    COUNT(*) FILTER (WHERE event_type = 'displayed'),
    COUNT(*) FILTER (WHERE event_type = 'clicked'),
    COUNT(*) FILTER (WHERE event_type = 'converted')
  INTO total_displays, total_clicks, total_conversions
  FROM popup_events
  WHERE popup_id = popup_uuid;
  
  -- Calculate rates
  ctr := CASE WHEN total_displays > 0 THEN (total_clicks::numeric / total_displays) * 100 ELSE 0 END;
  conversion_rate := CASE WHEN total_clicks > 0 THEN (total_conversions::numeric / total_clicks) * 100 ELSE 0 END;
  
  performance := jsonb_build_object(
    'displays', total_displays,
    'clicks', total_clicks,
    'conversions', total_conversions,
    'ctr', round(ctr, 2),
    'conversion_rate', round(conversion_rate, 2)
  );
  
  RETURN performance;
END;
$$ LANGUAGE plpgsql;