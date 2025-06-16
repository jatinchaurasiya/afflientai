/*
  # Add buying_intent_score column to content_analysis table

  1. Changes
    - Add buying_intent_score column to content_analysis table
    - Add category column to content_analysis table
    - Add sentiment column to content_analysis table
*/

-- Add buying_intent_score column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_analysis' AND column_name = 'buying_intent_score'
  ) THEN
    ALTER TABLE content_analysis ADD COLUMN buying_intent_score numeric(3,2) DEFAULT 0;
  END IF;
END $$;

-- Add category column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_analysis' AND column_name = 'category'
  ) THEN
    ALTER TABLE content_analysis ADD COLUMN category text DEFAULT 'general'::text;
  END IF;
END $$;

-- Add sentiment column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_analysis' AND column_name = 'sentiment'
  ) THEN
    ALTER TABLE content_analysis ADD COLUMN sentiment text DEFAULT 'neutral'::text;
  END IF;
END $$;