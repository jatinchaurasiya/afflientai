-- Create tables for the AffiliateAI platform

-- Profiles table (extends Supabase Auth)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  company_name TEXT,
  website TEXT,
  stripe_customer_id TEXT,
  stripe_account_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Blogs table
CREATE TABLE blogs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  title TEXT,
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'failed')),
  verification_token TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Affiliate accounts table
CREATE TABLE affiliate_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('amazon', 'ebay', 'walmart', 'other')),
  associate_tag TEXT,
  api_key TEXT,
  api_secret TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'inactive', 'pending')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Widgets table
CREATE TABLE widgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  blog_id UUID REFERENCES blogs(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics table
CREATE TABLE analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  widget_id UUID REFERENCES widgets(id) ON DELETE CASCADE NOT NULL,
  impressions INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  conversions INTEGER NOT NULL DEFAULT 0,
  revenue DECIMAL(10, 2) NOT NULL DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  UNIQUE(widget_id, date)
);

-- Payouts table
CREATE TABLE payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'failed')),
  stripe_payout_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security Policies

-- Profiles: Users can only read/write their own profile
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Blogs: Users can only read/write their own blogs
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own blogs" 
  ON blogs FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own blogs" 
  ON blogs FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own blogs" 
  ON blogs FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own blogs" 
  ON blogs FOR DELETE 
  USING (auth.uid() = user_id);

-- Affiliate Accounts: Users can only read/write their own accounts
ALTER TABLE affiliate_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own affiliate accounts" 
  ON affiliate_accounts FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own affiliate accounts" 
  ON affiliate_accounts FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own affiliate accounts" 
  ON affiliate_accounts FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own affiliate accounts" 
  ON affiliate_accounts FOR DELETE 
  USING (auth.uid() = user_id);

-- Widgets: Users can only read/write their own widgets
ALTER TABLE widgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own widgets" 
  ON widgets FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own widgets" 
  ON widgets FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own widgets" 
  ON widgets FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own widgets" 
  ON widgets FOR DELETE 
  USING (auth.uid() = user_id);

-- Analytics: Users can only read analytics for their own widgets
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view analytics for their own widgets" 
  ON analytics FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM widgets
    WHERE widgets.id = analytics.widget_id
    AND widgets.user_id = auth.uid()
  ));

-- Payouts: Users can only view their own payouts
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payouts" 
  ON payouts FOR SELECT 
  USING (auth.uid() = user_id);

-- Create functions and triggers

-- Function to update the 'updated_at' column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all tables with updated_at column
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blogs_updated_at
BEFORE UPDATE ON blogs
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_affiliate_accounts_updated_at
BEFORE UPDATE ON affiliate_accounts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_widgets_updated_at
BEFORE UPDATE ON widgets
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payouts_updated_at
BEFORE UPDATE ON payouts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for creating a profile when a new user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();