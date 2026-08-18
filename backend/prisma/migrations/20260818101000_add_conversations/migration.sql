-- CreateEnum
CREATE TYPE "MessageKind" AS ENUM ('TEXT', 'EMERGENCY');

-- CreateTable
CREATE TABLE "Conversation" (
    "conversation_id" BIGINT NOT NULL,
    "participant_a_id" INTEGER NOT NULL,
    "participant_b_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_message_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("conversation_id")
);

-- CreateTable
CREATE TABLE "ConversationMessage" (
    "message_id" BIGINT NOT NULL,
    "conversation_id" BIGINT NOT NULL,
    "sender_id" INTEGER NOT NULL,
    "recipient_id" INTEGER NOT NULL,
    "body" TEXT NOT NULL,
    "kind" "MessageKind" NOT NULL DEFAULT 'TEXT',
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversationMessage_pkey" PRIMARY KEY ("message_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_participant_a_id_participant_b_id_key" ON "Conversation"("participant_a_id", "participant_b_id");

-- CreateIndex
CREATE INDEX "Conversation_participant_a_id_idx" ON "Conversation"("participant_a_id");

-- CreateIndex
CREATE INDEX "Conversation_participant_b_id_idx" ON "Conversation"("participant_b_id");

-- CreateIndex
CREATE INDEX "Conversation_last_message_at_idx" ON "Conversation"("last_message_at");

-- CreateIndex
CREATE INDEX "ConversationMessage_conversation_id_created_at_idx" ON "ConversationMessage"("conversation_id", "created_at");

-- CreateIndex
CREATE INDEX "ConversationMessage_recipient_id_read_at_idx" ON "ConversationMessage"("recipient_id", "read_at");

-- CreateIndex
CREATE INDEX "ConversationMessage_sender_id_created_at_idx" ON "ConversationMessage"("sender_id", "created_at");

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_participant_a_id_fkey" FOREIGN KEY ("participant_a_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_participant_b_id_fkey" FOREIGN KEY ("participant_b_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationMessage" ADD CONSTRAINT "ConversationMessage_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "Conversation"("conversation_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationMessage" ADD CONSTRAINT "ConversationMessage_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationMessage" ADD CONSTRAINT "ConversationMessage_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
