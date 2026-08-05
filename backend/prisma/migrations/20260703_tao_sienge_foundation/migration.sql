DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TaoRegistrationType') THEN
        CREATE TYPE "TaoRegistrationType" AS ENUM (
            'SOMENTE_OBRA',
            'OBRA_E_CENTRO_CUSTO',
            'SOMENTE_CENTRO_CUSTO',
            'CENTRO_CUSTO_ASSOCIADO_OBRA'
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TaoLifecycleStatus') THEN
        CREATE TYPE "TaoLifecycleStatus" AS ENUM (
            'RASCUNHO',
            'EM_VALIDACAO',
            'APROVADA',
            'REPROVADA',
            'CADASTRADA_NO_SIENGE',
            'CANCELADA'
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ClientType') THEN
        CREATE TYPE "ClientType" AS ENUM (
            'PESSOA_FISICA',
            'PESSOA_JURIDICA',
            'OUTROS'
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CostCenterPurpose') THEN
        CREATE TYPE "CostCenterPurpose" AS ENUM (
            'CONSTRUTORA',
            'CLIENTE',
            'INVESTIDOR',
            'SPE',
            'ADMINISTRACAO_OBRA',
            'ASSISTENCIA_TECNICA',
            'OUTROS'
        );
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.companies (
    id TEXT PRIMARY KEY,
    legal_name TEXT NOT NULL,
    trade_name TEXT,
    document TEXT,
    document_normalized TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS companies_document_normalized_key
    ON public.companies (document_normalized)
    WHERE document_normalized IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.clients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    client_type "ClientType",
    document TEXT,
    document_normalized TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS clients_document_normalized_key
    ON public.clients (document_normalized)
    WHERE document_normalized IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.business_areas (
    id TEXT PRIMARY KEY,
    code TEXT,
    name TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS business_areas_code_key
    ON public.business_areas (code)
    WHERE code IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS business_areas_name_key
    ON public.business_areas (name);

CREATE TABLE IF NOT EXISTS public.cost_center_categories (
    id TEXT PRIMARY KEY,
    code TEXT,
    name TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS cost_center_categories_code_key
    ON public.cost_center_categories (code)
    WHERE code IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS cost_center_categories_name_key
    ON public.cost_center_categories (name);

ALTER TABLE public.taos
    ADD COLUMN IF NOT EXISTS updated_by_id TEXT,
    ADD COLUMN IF NOT EXISTS registration_type "TaoRegistrationType",
    ADD COLUMN IF NOT EXISTS tao_lifecycle_status "TaoLifecycleStatus",
    ADD COLUMN IF NOT EXISTS opening_date DATE,
    ADD COLUMN IF NOT EXISTS construction_situation TEXT,
    ADD COLUMN IF NOT EXISTS is_registration_consistent BOOLEAN,
    ADD COLUMN IF NOT EXISTS technical_responsible_name TEXT,
    ADD COLUMN IF NOT EXISTS delivery_address TEXT,
    ADD COLUMN IF NOT EXISTS client_link_notes TEXT,
    ADD COLUMN IF NOT EXISTS parent_tao_id TEXT,
    ADD COLUMN IF NOT EXISTS responsible_company_id TEXT,
    ADD COLUMN IF NOT EXISTS client_id TEXT,
    ADD COLUMN IF NOT EXISTS default_financial_bank_account_id TEXT,
    ADD COLUMN IF NOT EXISTS billing_issue_bank_account_id TEXT,
    ADD COLUMN IF NOT EXISTS engineering_supply_services_table TEXT,
    ADD COLUMN IF NOT EXISTS appropriation_level TEXT,
    ADD COLUMN IF NOT EXISTS area_measure_unit TEXT,
    ADD COLUMN IF NOT EXISTS planned_construction_units INTEGER,
    ADD COLUMN IF NOT EXISTS has_engineering_budget BOOLEAN,
    ADD COLUMN IF NOT EXISTS has_engineering_planning BOOLEAN,
    ADD COLUMN IF NOT EXISTS has_physical_progress_tracking BOOLEAN,
    ADD COLUMN IF NOT EXISTS engineering_responsible_name TEXT,
    ADD COLUMN IF NOT EXISTS financial_company_id TEXT,
    ADD COLUMN IF NOT EXISTS financial_business_area_id TEXT,
    ADD COLUMN IF NOT EXISTS financial_cost_center_category_id TEXT,
    ADD COLUMN IF NOT EXISTS compose_financial_availability BOOLEAN,
    ADD COLUMN IF NOT EXISTS export_to_client_portal BOOLEAN,
    ADD COLUMN IF NOT EXISTS financial_responsible_name TEXT,
    ADD COLUMN IF NOT EXISTS is_ret_regime BOOLEAN,
    ADD COLUMN IF NOT EXISTS enterprise_nature TEXT,
    ADD COLUMN IF NOT EXISTS real_estate_unit_type TEXT,
    ADD COLUMN IF NOT EXISTS generates_sped_efd_contributions BOOLEAN,
    ADD COLUMN IF NOT EXISTS fiscal_responsible_name TEXT,
    ADD COLUMN IF NOT EXISTS fiscal_notes TEXT,
    ADD COLUMN IF NOT EXISTS keys_delivery_date DATE,
    ADD COLUMN IF NOT EXISTS gross_sales_value NUMERIC(15, 2),
    ADD COLUMN IF NOT EXISTS units_grouping TEXT,
    ADD COLUMN IF NOT EXISTS uses_client_portal BOOLEAN,
    ADD COLUMN IF NOT EXISTS client_portal_links TEXT,
    ADD COLUMN IF NOT EXISTS commercial_responsible_name TEXT,
    ADD COLUMN IF NOT EXISTS requested_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS engineering_approver_user_id TEXT,
    ADD COLUMN IF NOT EXISTS financial_approver_user_id TEXT,
    ADD COLUMN IF NOT EXISTS fiscal_approver_user_id TEXT,
    ADD COLUMN IF NOT EXISTS board_approver_user_id TEXT,
    ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
    ADD COLUMN IF NOT EXISTS sienge_registered_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS taos_updated_by_id_idx ON public.taos (updated_by_id);
CREATE INDEX IF NOT EXISTS taos_parent_tao_id_idx ON public.taos (parent_tao_id);
CREATE INDEX IF NOT EXISTS taos_responsible_company_id_idx ON public.taos (responsible_company_id);
CREATE INDEX IF NOT EXISTS taos_client_id_idx ON public.taos (client_id);
CREATE INDEX IF NOT EXISTS taos_default_financial_bank_account_id_idx ON public.taos (default_financial_bank_account_id);
CREATE INDEX IF NOT EXISTS taos_billing_issue_bank_account_id_idx ON public.taos (billing_issue_bank_account_id);
CREATE INDEX IF NOT EXISTS taos_financial_company_id_idx ON public.taos (financial_company_id);
CREATE INDEX IF NOT EXISTS taos_financial_business_area_id_idx ON public.taos (financial_business_area_id);
CREATE INDEX IF NOT EXISTS taos_financial_cost_center_category_id_idx ON public.taos (financial_cost_center_category_id);
CREATE INDEX IF NOT EXISTS taos_engineering_approver_user_id_idx ON public.taos (engineering_approver_user_id);
CREATE INDEX IF NOT EXISTS taos_financial_approver_user_id_idx ON public.taos (financial_approver_user_id);
CREATE INDEX IF NOT EXISTS taos_fiscal_approver_user_id_idx ON public.taos (fiscal_approver_user_id);
CREATE INDEX IF NOT EXISTS taos_board_approver_user_id_idx ON public.taos (board_approver_user_id);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'taos_updated_by_id_fkey') THEN
        ALTER TABLE public.taos
            ADD CONSTRAINT taos_updated_by_id_fkey
            FOREIGN KEY (updated_by_id) REFERENCES public.users(id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'taos_parent_tao_id_fkey') THEN
        ALTER TABLE public.taos
            ADD CONSTRAINT taos_parent_tao_id_fkey
            FOREIGN KEY (parent_tao_id) REFERENCES public.taos(id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'taos_responsible_company_id_fkey') THEN
        ALTER TABLE public.taos
            ADD CONSTRAINT taos_responsible_company_id_fkey
            FOREIGN KEY (responsible_company_id) REFERENCES public.companies(id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'taos_client_id_fkey') THEN
        ALTER TABLE public.taos
            ADD CONSTRAINT taos_client_id_fkey
            FOREIGN KEY (client_id) REFERENCES public.clients(id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'taos_default_financial_bank_account_id_fkey') THEN
        ALTER TABLE public.taos
            ADD CONSTRAINT taos_default_financial_bank_account_id_fkey
            FOREIGN KEY (default_financial_bank_account_id) REFERENCES public.bank_accounts(id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'taos_billing_issue_bank_account_id_fkey') THEN
        ALTER TABLE public.taos
            ADD CONSTRAINT taos_billing_issue_bank_account_id_fkey
            FOREIGN KEY (billing_issue_bank_account_id) REFERENCES public.bank_accounts(id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'taos_financial_company_id_fkey') THEN
        ALTER TABLE public.taos
            ADD CONSTRAINT taos_financial_company_id_fkey
            FOREIGN KEY (financial_company_id) REFERENCES public.companies(id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'taos_financial_business_area_id_fkey') THEN
        ALTER TABLE public.taos
            ADD CONSTRAINT taos_financial_business_area_id_fkey
            FOREIGN KEY (financial_business_area_id) REFERENCES public.business_areas(id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'taos_financial_cost_center_category_id_fkey') THEN
        ALTER TABLE public.taos
            ADD CONSTRAINT taos_financial_cost_center_category_id_fkey
            FOREIGN KEY (financial_cost_center_category_id) REFERENCES public.cost_center_categories(id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'taos_engineering_approver_user_id_fkey') THEN
        ALTER TABLE public.taos
            ADD CONSTRAINT taos_engineering_approver_user_id_fkey
            FOREIGN KEY (engineering_approver_user_id) REFERENCES public.users(id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'taos_financial_approver_user_id_fkey') THEN
        ALTER TABLE public.taos
            ADD CONSTRAINT taos_financial_approver_user_id_fkey
            FOREIGN KEY (financial_approver_user_id) REFERENCES public.users(id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'taos_fiscal_approver_user_id_fkey') THEN
        ALTER TABLE public.taos
            ADD CONSTRAINT taos_fiscal_approver_user_id_fkey
            FOREIGN KEY (fiscal_approver_user_id) REFERENCES public.users(id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'taos_board_approver_user_id_fkey') THEN
        ALTER TABLE public.taos
            ADD CONSTRAINT taos_board_approver_user_id_fkey
            FOREIGN KEY (board_approver_user_id) REFERENCES public.users(id);
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.tao_cost_centers (
    id TEXT PRIMARY KEY,
    tao_id TEXT NOT NULL,
    cost_center_code TEXT NOT NULL,
    name TEXT NOT NULL,
    company_id TEXT,
    business_area_id TEXT,
    cost_center_category_id TEXT,
    purpose "CostCenterPurpose",
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    participates_financial BOOLEAN NOT NULL DEFAULT FALSE,
    participates_budget BOOLEAN NOT NULL DEFAULT FALSE,
    participates_supplies BOOLEAN NOT NULL DEFAULT FALSE,
    participates_measurements BOOLEAN NOT NULL DEFAULT FALSE,
    observations TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS tao_cost_centers_tao_id_cost_center_code_key
    ON public.tao_cost_centers (tao_id, cost_center_code);
CREATE INDEX IF NOT EXISTS tao_cost_centers_company_id_idx ON public.tao_cost_centers (company_id);
CREATE INDEX IF NOT EXISTS tao_cost_centers_business_area_id_idx ON public.tao_cost_centers (business_area_id);
CREATE INDEX IF NOT EXISTS tao_cost_centers_cost_center_category_id_idx ON public.tao_cost_centers (cost_center_category_id);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tao_cost_centers_tao_id_fkey') THEN
        ALTER TABLE public.tao_cost_centers
            ADD CONSTRAINT tao_cost_centers_tao_id_fkey
            FOREIGN KEY (tao_id) REFERENCES public.taos(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tao_cost_centers_company_id_fkey') THEN
        ALTER TABLE public.tao_cost_centers
            ADD CONSTRAINT tao_cost_centers_company_id_fkey
            FOREIGN KEY (company_id) REFERENCES public.companies(id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tao_cost_centers_business_area_id_fkey') THEN
        ALTER TABLE public.tao_cost_centers
            ADD CONSTRAINT tao_cost_centers_business_area_id_fkey
            FOREIGN KEY (business_area_id) REFERENCES public.business_areas(id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tao_cost_centers_cost_center_category_id_fkey') THEN
        ALTER TABLE public.tao_cost_centers
            ADD CONSTRAINT tao_cost_centers_cost_center_category_id_fkey
            FOREIGN KEY (cost_center_category_id) REFERENCES public.cost_center_categories(id);
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.tao_authorized_bank_accounts (
    id TEXT PRIMARY KEY,
    tao_id TEXT NOT NULL,
    bank_account_id TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS tao_authorized_bank_accounts_tao_id_bank_account_id_key
    ON public.tao_authorized_bank_accounts (tao_id, bank_account_id);
CREATE INDEX IF NOT EXISTS tao_authorized_bank_accounts_bank_account_id_idx
    ON public.tao_authorized_bank_accounts (bank_account_id);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tao_authorized_bank_accounts_tao_id_fkey') THEN
        ALTER TABLE public.tao_authorized_bank_accounts
            ADD CONSTRAINT tao_authorized_bank_accounts_tao_id_fkey
            FOREIGN KEY (tao_id) REFERENCES public.taos(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tao_authorized_bank_accounts_bank_account_id_fkey') THEN
        ALTER TABLE public.tao_authorized_bank_accounts
            ADD CONSTRAINT tao_authorized_bank_accounts_bank_account_id_fkey
            FOREIGN KEY (bank_account_id) REFERENCES public.bank_accounts(id);
    END IF;
END $$;
