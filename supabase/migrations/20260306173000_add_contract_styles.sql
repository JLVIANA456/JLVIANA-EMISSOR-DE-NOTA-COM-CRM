-- Add style_config column to contracts table
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS style_config JSONB DEFAULT '{}'::jsonb;
