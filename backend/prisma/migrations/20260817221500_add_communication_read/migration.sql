-- Add `read` column to Communication
ALTER TABLE "Communication" ADD COLUMN IF NOT EXISTS read boolean DEFAULT false;
