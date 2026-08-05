ALTER TABLE IF EXISTS public.tao_cost_centers
    ADD COLUMN IF NOT EXISTS linked_document TEXT;
