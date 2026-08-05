ALTER TABLE public.taos
    ADD COLUMN IF NOT EXISTS client_code TEXT,
    ADD COLUMN IF NOT EXISTS duration_days INTEGER,
    ADD COLUMN IF NOT EXISTS billing_iptu_number TEXT,
    ADD COLUMN IF NOT EXISTS financial_notebook_send_rule TEXT,
    ADD COLUMN IF NOT EXISTS payment_methods TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    ADD COLUMN IF NOT EXISTS requires_purchase_order BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS purchase_order_process TEXT,
    ADD COLUMN IF NOT EXISTS supplier_portal_url TEXT,
    ADD COLUMN IF NOT EXISTS minimum_invoice_amount NUMERIC(15, 2),
    ADD COLUMN IF NOT EXISTS bonus_percent NUMERIC(5, 2),
    ADD COLUMN IF NOT EXISTS tax_conversion_percent NUMERIC(5, 2),
    ADD COLUMN IF NOT EXISTS direct_billing_control_notes TEXT,
    ADD COLUMN IF NOT EXISTS signal_payment_notes TEXT,
    ADD COLUMN IF NOT EXISTS invoice_cutoff_notes TEXT,
    ADD COLUMN IF NOT EXISTS service_invoice_cutoff_day INTEGER,
    ADD COLUMN IF NOT EXISTS material_invoice_cutoff_day INTEGER,
    ADD COLUMN IF NOT EXISTS architect_transfer_required BOOLEAN,
    ADD COLUMN IF NOT EXISTS scope_project_executive_status BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS scope_project_executive_text TEXT,
    ADD COLUMN IF NOT EXISTS scope_permit_execution_status BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS scope_permit_execution_text TEXT,
    ADD COLUMN IF NOT EXISTS scope_cno_status BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS scope_cno_text TEXT,
    ADD COLUMN IF NOT EXISTS insurance_guarantee_status BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS insurance_guarantee_text TEXT,
    ADD COLUMN IF NOT EXISTS insurance_guarantee_date DATE,
    ADD COLUMN IF NOT EXISTS insurance_construction_status BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS insurance_construction_text TEXT,
    ADD COLUMN IF NOT EXISTS insurance_construction_date DATE,
    ADD COLUMN IF NOT EXISTS avcb_date DATE,
    ADD COLUMN IF NOT EXISTS cnd_iss_status BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS cnd_iss_text TEXT,
    ADD COLUMN IF NOT EXISTS cnd_iss_date DATE,
    ADD COLUMN IF NOT EXISTS cnd_inss_status BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS cnd_inss_text TEXT,
    ADD COLUMN IF NOT EXISTS cnd_inss_date DATE,
    ADD COLUMN IF NOT EXISTS habite_se_text TEXT,
    ADD COLUMN IF NOT EXISTS habite_se_date DATE;

ALTER TABLE public.tao_installments
    ADD COLUMN IF NOT EXISTS issue_date DATE,
    ADD COLUMN IF NOT EXISTS percentage NUMERIC(5, 2),
    ADD COLUMN IF NOT EXISTS notes TEXT,
    ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.tao_team_members
    ALTER COLUMN email DROP NOT NULL,
    ADD COLUMN IF NOT EXISTS phone TEXT,
    ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

DROP INDEX IF EXISTS public.tao_cost_centers_tao_id_cost_center_code_key;
CREATE UNIQUE INDEX IF NOT EXISTS tao_cost_centers_tao_id_cost_center_code_purpose_key
    ON public.tao_cost_centers (tao_id, cost_center_code, purpose);

CREATE TABLE IF NOT EXISTS public.tao_financial_composition_items (
    id TEXT PRIMARY KEY,
    tao_id TEXT NOT NULL,
    item_key TEXT NOT NULL,
    label TEXT NOT NULL,
    category TEXT,
    amount NUMERIC(15, 2),
    percentage NUMERIC(5, 2),
    include_in_total BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT tao_financial_composition_items_tao_id_fkey
        FOREIGN KEY (tao_id) REFERENCES public.taos(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS tao_financial_composition_items_tao_id_item_key_key
    ON public.tao_financial_composition_items (tao_id, item_key);

CREATE TABLE IF NOT EXISTS public.tao_indirect_expense_items (
    id TEXT PRIMARY KEY,
    tao_id TEXT NOT NULL,
    item_key TEXT NOT NULL,
    label TEXT NOT NULL,
    monthly_value NUMERIC(15, 2),
    total_period NUMERIC(15, 2),
    person_name TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT tao_indirect_expense_items_tao_id_fkey
        FOREIGN KEY (tao_id) REFERENCES public.taos(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS tao_indirect_expense_items_tao_id_item_key_key
    ON public.tao_indirect_expense_items (tao_id, item_key);
