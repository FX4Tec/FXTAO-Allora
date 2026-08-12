CREATE TABLE IF NOT EXISTS "tao_access_permissions" (
    "id" TEXT NOT NULL,
    "tao_id" TEXT NOT NULL,
    "user_email" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "scope" TEXT NOT NULL DEFAULT 'tao',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tao_access_permissions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "tao_access_permissions_tao_id_user_email_key"
    ON "tao_access_permissions"("tao_id", "user_email");

CREATE INDEX IF NOT EXISTS "tao_access_permissions_user_email_idx"
    ON "tao_access_permissions"("user_email");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'tao_access_permissions_tao_id_fkey'
    ) THEN
        ALTER TABLE "tao_access_permissions"
            ADD CONSTRAINT "tao_access_permissions_tao_id_fkey"
            FOREIGN KEY ("tao_id") REFERENCES "taos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'tao_access_permissions_user_email_fkey'
    ) THEN
        ALTER TABLE "tao_access_permissions"
            ADD CONSTRAINT "tao_access_permissions_user_email_fkey"
            FOREIGN KEY ("user_email") REFERENCES "users"("email") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;
