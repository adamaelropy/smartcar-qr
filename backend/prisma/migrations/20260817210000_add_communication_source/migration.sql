-- Add `source` column to Communication
ALTER TABLE "Communication" ADD COLUMN IF NOT EXISTS source VARCHAR(255);
