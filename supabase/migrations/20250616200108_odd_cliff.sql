/*
  # Update website_analytics RLS policies

  1. Security
    - Add RLS policy for INSERT operations on website_analytics
    - Add RLS policy for UPDATE operations on website_analytics
    - Ensure users can only modify analytics for their own websites
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert analytics for their websites" ON website_analytics;
DROP POLICY IF EXISTS "Users can update analytics for their websites" ON website_analytics;

-- Create INSERT policy
CREATE POLICY "Users can insert analytics for their websites"
ON website_analytics
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM websites
    WHERE websites.id = website_analytics.website_id
    AND websites.user_id = auth.uid()
  )
);

-- Create UPDATE policy
CREATE POLICY "Users can update analytics for their websites"
ON website_analytics
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM websites
    WHERE websites.id = website_analytics.website_id
    AND websites.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM websites
    WHERE websites.id = website_analytics.website_id
    AND websites.user_id = auth.uid()
  )
);