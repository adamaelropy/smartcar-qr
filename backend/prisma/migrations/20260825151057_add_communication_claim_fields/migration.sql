-- AlterTable
ALTER TABLE "Communication" ADD COLUMN IF NOT EXISTS "claimed_by_user_id" INTEGER;
ALTER TABLE "Communication" ADD COLUMN IF NOT EXISTS "conversation_id" BIGINT;
ALTER TABLE "Communication" ADD COLUMN IF NOT EXISTS "claimed_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Communication_source_idx" ON "Communication"("source");
CREATE INDEX IF NOT EXISTS "Communication_claimed_by_user_id_idx" ON "Communication"("claimed_by_user_id");
CREATE INDEX IF NOT EXISTS "Communication_conversation_id_idx" ON "Communication"("conversation_id");
CREATE INDEX IF NOT EXISTS "Communication_vehicle_id_source_idx" ON "Communication"("vehicle_id", "source");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "Communication" ADD CONSTRAINT "Communication_claimed_by_user_id_fkey" FOREIGN KEY ("claimed_by_user_id") REFERENCES "User"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "Communication" ADD CONSTRAINT "Communication_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "Conversation"("conversation_id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
