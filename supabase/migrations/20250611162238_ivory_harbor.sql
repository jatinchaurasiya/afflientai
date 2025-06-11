/*
  # Add missing columns to content_analysis table

  1. New Columns
    - `buying_intent_score` (numeric) - Score indicating buying intent (0-1)
    - `category` (text) - Primary category of the content
    - `sentiment` (text) - Sentiment analysis result

  2. Security
    - No changes to existing RLS policies
*/

-- Add missing columns to content_analysis table
DO $$
BEGIN
  -- Add buying_intent_score column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_analysis' AND column_name = 'buying_intent_score'
  ) THEN
    ALTER TABLE content_analysis ADD COLUMN buying_intent_score numeric(3,2) DEFAULT 0;
  END IF;

  -- Add category column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_analysis' AND column_name = 'category'
  ) THEN
    ALTER TABLE content_analysis ADD COLUMN category text DEFAULT 'general';
  END IF;

  -- Add sentiment column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_analysis' AND column_name = 'sentiment'
  ) THEN
    ALTER TABLE content_analysis ADD COLUMN sentiment text DEFAULT 'neutral';
  END IF;
END $$;