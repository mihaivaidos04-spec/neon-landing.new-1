-- Global Pulse persisted messages (TTL cleanup in app every minute; index supports deleteMany).

CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "countryCode" VARCHAR(2),
    "message" VARCHAR(280) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ChatMessage_createdAt_idx" ON "ChatMessage"("createdAt");

-- Optional: schedule with pg_cron, e.g. SELECT cleanup_expired_chat_messages();
CREATE OR REPLACE FUNCTION cleanup_expired_chat_messages()
RETURNS bigint
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count bigint;
BEGIN
  DELETE FROM "ChatMessage"
  WHERE "createdAt" < NOW() - INTERVAL '5 minutes';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION cleanup_expired_chat_messages() IS 'Deletes ChatMessage rows older than 5 minutes (same rule as app cron).';
