ALTER TABLE public.taos
    ADD COLUMN IF NOT EXISTS tax_cbs_percent DECIMAL(5, 2),
    ADD COLUMN IF NOT EXISTS tax_ibs_percent DECIMAL(5, 2),
    ADD COLUMN IF NOT EXISTS split_payment_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS financial_construction_company_text TEXT,
    ADD COLUMN IF NOT EXISTS financial_business_area_text TEXT,
    ADD COLUMN IF NOT EXISTS default_financial_bank_account_text TEXT,
    ADD COLUMN IF NOT EXISTS billing_issue_bank_account_text TEXT;
