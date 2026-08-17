-- Adds the `read` boolean column to the Communication table (default false)
ALTER TABLE "Communication" ADD COLUMN IF NOT EXISTS read boolean DEFAULT false;

-- You can run this directly against your database, for example:
-- psql "${DATABASE_URL}" -f add-read-column.sql
