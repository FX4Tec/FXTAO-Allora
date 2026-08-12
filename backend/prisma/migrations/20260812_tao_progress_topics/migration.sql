ALTER TABLE "taos"
    ADD COLUMN IF NOT EXISTS "is_public_progress_enabled" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "tao_progress_topics" (
    "id" TEXT NOT NULL,
    "tao_id" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "percentage" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tao_progress_topics_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'tao_progress_topics_tao_id_fkey'
    ) THEN
        ALTER TABLE "tao_progress_topics"
            ADD CONSTRAINT "tao_progress_topics_tao_id_fkey"
            FOREIGN KEY ("tao_id") REFERENCES "taos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS "tao_progress_topics_tao_id_idx"
    ON "tao_progress_topics"("tao_id");

CREATE INDEX IF NOT EXISTS "tao_progress_topics_tao_id_is_active_sort_order_idx"
    ON "tao_progress_topics"("tao_id", "is_active", "sort_order");

CREATE INDEX IF NOT EXISTS "taos_is_public_progress_enabled_updated_at_idx"
    ON "taos"("is_public_progress_enabled", "updated_at");
