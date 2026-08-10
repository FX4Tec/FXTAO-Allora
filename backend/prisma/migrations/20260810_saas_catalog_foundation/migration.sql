CREATE TABLE IF NOT EXISTS public.saas_tenants (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    legal_name TEXT,
    document TEXT,
    primary_domain TEXT,
    app_subdomain TEXT,
    plan_code TEXT,
    commercial_status TEXT NOT NULL DEFAULT 'active',
    operational_status TEXT NOT NULL DEFAULT 'active',
    database_url TEXT,
    database_label TEXT,
    local_login_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    microsoft_login_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    branding_logo_url TEXT,
    support_notes TEXT,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.saas_tenant_domains (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES public.saas_tenants(id) ON DELETE CASCADE,
    hostname TEXT NOT NULL UNIQUE,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    proxy_status TEXT NOT NULL DEFAULT 'pending',
    ssl_status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS saas_tenant_domains_tenant_id_idx ON public.saas_tenant_domains(tenant_id);

CREATE TABLE IF NOT EXISTS public.saas_plans (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    monthly_value DECIMAL(15,2),
    annual_value DECIMAL(15,2),
    user_limit INTEGER,
    work_limit INTEGER,
    integration_limit INTEGER,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.saas_plan_features (
    id TEXT PRIMARY KEY,
    plan_id TEXT NOT NULL REFERENCES public.saas_plans(id) ON DELETE CASCADE,
    feature_key TEXT NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    limit_value INTEGER,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT saas_plan_features_plan_id_feature_key_key UNIQUE (plan_id, feature_key)
);

CREATE TABLE IF NOT EXISTS public.saas_sso_configs (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES public.saas_tenants(id) ON DELETE CASCADE,
    provider TEXT NOT NULL DEFAULT 'microsoft',
    authority_tenant_id TEXT,
    client_id TEXT,
    client_secret_ref TEXT,
    redirect_uri TEXT,
    allowed_domains TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    last_tested_at TIMESTAMP(3),
    last_test_status TEXT,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS saas_sso_configs_tenant_id_idx ON public.saas_sso_configs(tenant_id);

CREATE TABLE IF NOT EXISTS public.saas_audit_logs (
    id TEXT PRIMARY KEY,
    tenant_id TEXT REFERENCES public.saas_tenants(id) ON DELETE SET NULL,
    user_email TEXT,
    ip_address TEXT,
    user_agent TEXT,
    action TEXT NOT NULL,
    resource TEXT,
    before_data JSONB,
    after_data JSONB,
    result TEXT NOT NULL DEFAULT 'success',
    trace_id TEXT,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS saas_audit_logs_tenant_id_idx ON public.saas_audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS saas_audit_logs_user_email_idx ON public.saas_audit_logs(user_email);
CREATE INDEX IF NOT EXISTS saas_audit_logs_created_at_idx ON public.saas_audit_logs(created_at);
