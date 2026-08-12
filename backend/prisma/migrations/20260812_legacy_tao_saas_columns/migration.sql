-- Safe tenant-legacy compatibility migration.
-- Adds columns/tables expected by the current SaaS application without dropping or rewriting existing data.

ALTER TABLE IF EXISTS public.users
    ADD COLUMN IF NOT EXISTS can_view_restricted_tao_fields BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE IF EXISTS public.tao_cost_centers
    ADD COLUMN IF NOT EXISTS linked_document TEXT;

ALTER TABLE IF EXISTS public.taos
    ADD COLUMN IF NOT EXISTS accepts_exception_payments BOOLEAN,
    ADD COLUMN IF NOT EXISTS accepts_exception_payments_notes TEXT,
    ADD COLUMN IF NOT EXISTS accepts_reimbursements BOOLEAN,
    ADD COLUMN IF NOT EXISTS accepts_reimbursements_notes TEXT,
    ADD COLUMN IF NOT EXISTS actual_end_date DATE,
    ADD COLUMN IF NOT EXISTS actual_start_date DATE,
    ADD COLUMN IF NOT EXISTS admin_financial_schedule_text TEXT,
    ADD COLUMN IF NOT EXISTS admin_notes TEXT,
    ADD COLUMN IF NOT EXISTS art_status TEXT,
    ADD COLUMN IF NOT EXISTS billing_model TEXT,
    ADD COLUMN IF NOT EXISTS budget_model TEXT,
    ADD COLUMN IF NOT EXISTS center_cost_allora TEXT,
    ADD COLUMN IF NOT EXISTS center_cost_client TEXT,
    ADD COLUMN IF NOT EXISTS client_contract_status TEXT,
    ADD COLUMN IF NOT EXISTS company_code TEXT,
    ADD COLUMN IF NOT EXISTS delivery_restriction_notes TEXT,
    ADD COLUMN IF NOT EXISTS duration_months INTEGER,
    ADD COLUMN IF NOT EXISTS extra_center_costs_client TEXT,
    ADD COLUMN IF NOT EXISTS financial_schedule_notes TEXT,
    ADD COLUMN IF NOT EXISTS has_architecture BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS has_budget_sheet BOOLEAN,
    ADD COLUMN IF NOT EXISTS has_delivery_restriction BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS has_invoice_cutoff BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS has_manager BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS hiring_regime_detail TEXT,
    ADD COLUMN IF NOT EXISTS invoice_cutoff_day TEXT,
    ADD COLUMN IF NOT EXISTS notes_to_finance_deadline TEXT,
    ADD COLUMN IF NOT EXISTS obra_cno TEXT,
    ADD COLUMN IF NOT EXISTS obra_sfobras TEXT,
    ADD COLUMN IF NOT EXISTS payment_after_report_terms TEXT,
    ADD COLUMN IF NOT EXISTS payment_terms_text TEXT,
    ADD COLUMN IF NOT EXISTS physical_delivery_address TEXT,
    ADD COLUMN IF NOT EXISTS project_code TEXT,
    ADD COLUMN IF NOT EXISTS project_group TEXT,
    ADD COLUMN IF NOT EXISTS proposal_number TEXT,
    ADD COLUMN IF NOT EXISTS report_frequency TEXT,
    ADD COLUMN IF NOT EXISTS report_send_day TEXT,
    ADD COLUMN IF NOT EXISTS reports_delivery_notes TEXT,
    ADD COLUMN IF NOT EXISTS requires_cno BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS requires_physical_delivery BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS restricted_admin_monthly_value NUMERIC(15,2),
    ADD COLUMN IF NOT EXISTS restricted_admin_percent NUMERIC(5,2),
    ADD COLUMN IF NOT EXISTS restricted_admin_total_estimated NUMERIC(15,2),
    ADD COLUMN IF NOT EXISTS restricted_engineer_monthly_value NUMERIC(15,2),
    ADD COLUMN IF NOT EXISTS restricted_master_monthly_value NUMERIC(15,2),
    ADD COLUMN IF NOT EXISTS restricted_notes TEXT,
    ADD COLUMN IF NOT EXISTS restricted_special_items_admin_text TEXT,
    ADD COLUMN IF NOT EXISTS restricted_tax_mode TEXT,
    ADD COLUMN IF NOT EXISTS restricted_team_monthly_value NUMERIC(15,2),
    ADD COLUMN IF NOT EXISTS work_insurance_status TEXT,
    ADD COLUMN IF NOT EXISTS work_insurance_validity TEXT;

CREATE TABLE IF NOT EXISTS public.tao_direct_billing_document_items (
    id TEXT PRIMARY KEY,
    tao_id TEXT NOT NULL,
    document_key TEXT NOT NULL,
    document_label TEXT NOT NULL,
    audience TEXT,
    is_checked BOOLEAN NOT NULL DEFAULT false,
    notes TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX IF NOT EXISTS tao_direct_billing_document_items_tao_id_document_key_key
    ON public.tao_direct_billing_document_items (tao_id, document_key);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tao_direct_billing_document_items_tao_id_fkey') THEN
        ALTER TABLE public.tao_direct_billing_document_items
            ADD CONSTRAINT tao_direct_billing_document_items_tao_id_fkey
            FOREIGN KEY (tao_id) REFERENCES public.taos(id) ON DELETE CASCADE;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.tao_initial_checklist_items (
    id TEXT PRIMARY KEY,
    tao_id TEXT NOT NULL,
    category TEXT,
    item_key TEXT NOT NULL,
    item_label TEXT NOT NULL,
    is_checked BOOLEAN NOT NULL DEFAULT false,
    selected_option TEXT,
    value_text TEXT,
    notes TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX IF NOT EXISTS tao_initial_checklist_items_tao_id_item_key_key
    ON public.tao_initial_checklist_items (tao_id, item_key);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tao_initial_checklist_items_tao_id_fkey') THEN
        ALTER TABLE public.tao_initial_checklist_items
            ADD CONSTRAINT tao_initial_checklist_items_tao_id_fkey
            FOREIGN KEY (tao_id) REFERENCES public.taos(id) ON DELETE CASCADE;
    END IF;
END $$;
