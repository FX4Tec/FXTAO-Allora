ALTER TABLE "saas_sso_configs"
ADD COLUMN IF NOT EXISTS "client_secret_encrypted" TEXT;
