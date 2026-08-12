ALTER TABLE "taos"
    ADD COLUMN IF NOT EXISTS "is_public_map_enabled" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS "public_slug" TEXT,
    ADD COLUMN IF NOT EXISTS "public_image_url" TEXT,
    ADD COLUMN IF NOT EXISTS "public_description" TEXT,
    ADD COLUMN IF NOT EXISTS "public_status_override" TEXT,
    ADD COLUMN IF NOT EXISTS "public_client_name" TEXT,
    ADD COLUMN IF NOT EXISTS "public_address_number" TEXT,
    ADD COLUMN IF NOT EXISTS "geocoded_at" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "taos_is_public_map_enabled_updated_at_idx"
    ON "taos"("is_public_map_enabled", "updated_at");

CREATE INDEX IF NOT EXISTS "taos_public_slug_idx"
    ON "taos"("public_slug");

CREATE INDEX IF NOT EXISTS "taos_status_updated_at_idx"
    ON "taos"("status", "updated_at");

CREATE TABLE IF NOT EXISTS "public_map_audit_logs" (
    "id" TEXT NOT NULL,
    "client_key" TEXT,
    "request_ip" TEXT,
    "origin" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "status_code" INTEGER NOT NULL,
    "result_count" INTEGER,
    "error_code" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "public_map_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "public_map_audit_logs_created_at_idx"
    ON "public_map_audit_logs"("created_at");

CREATE INDEX IF NOT EXISTS "public_map_audit_logs_client_key_created_at_idx"
    ON "public_map_audit_logs"("client_key", "created_at");
