CREATE TABLE IF NOT EXISTS "saas_sharepoint_configs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "authority_tenant_id" TEXT,
    "api_client_id" TEXT,
    "api_resource_uri" TEXT,
    "required_scope" TEXT NOT NULL DEFAULT 'access_as_user',
    "allowed_origins" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "allowed_client_ids" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "is_enabled" BOOLEAN NOT NULL DEFAULT false,
    "last_tested_at" TIMESTAMP(3),
    "last_test_status" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saas_sharepoint_configs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "saas_sharepoint_configs_tenant_id_idx"
    ON "saas_sharepoint_configs"("tenant_id");

CREATE INDEX IF NOT EXISTS "saas_sharepoint_configs_authority_tenant_id_idx"
    ON "saas_sharepoint_configs"("authority_tenant_id");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'saas_sharepoint_configs_tenant_id_fkey'
    ) THEN
        ALTER TABLE "saas_sharepoint_configs"
            ADD CONSTRAINT "saas_sharepoint_configs_tenant_id_fkey"
            FOREIGN KEY ("tenant_id") REFERENCES "saas_tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
