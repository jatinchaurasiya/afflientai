/*
  # Fix website_analytics RLS policies

  1. Security Updates
    - Update RLS policies to allow users to insert/update analytics for their own websites
    - Add proper policy for upsert operations

  2. Changes
    - Add INSERT policy for website analytics
    - Add UPDATE policy for website analytics
    - Ensure policies check website ownership
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert analytics for their websites" ON website_analytics;
DROP POLICY IF EXISTS "Users can update analytics for their websites" ON website_analytics;

-- Create INSERT policy for website analytics
CREATE POLICY "Users can insert analytics for their websites"
  ON website_analytics
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM websites
      WHERE websites.id = website_analytics.website_id
      AND websites.user_id = auth.uid()
    )
  );

-- Create UPDATE policy for website analytics
CREATE POLICY "Users can update analytics for their websites"
  ON website_analytics
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM websites
      WHERE websites.id = website_analytics.website_id
      AND websites.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM websites
      WHERE websites.id = website_analytics.website_id
      AND websites.user_id = auth.uid()
    )
  );