-- Add shared flag to categories table for split expenses functionality

-- Add is_shared column to categories table
ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_shared BOOLEAN NOT NULL DEFAULT FALSE;

-- Add index for querying shared categories
CREATE INDEX IF NOT EXISTS idx_categories_is_shared ON categories(is_shared);

-- Update existing categories - mark some common categories as shared if needed
-- This is optional and can be customized based on user preferences
-- UPDATE categories SET is_shared = TRUE WHERE name IN ('食費', '娯楽費');