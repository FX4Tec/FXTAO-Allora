ALTER TABLE "taos"
    ADD COLUMN IF NOT EXISTS "approval_flow_enabled" BOOLEAN NOT NULL DEFAULT false;

UPDATE "taos" AS t
SET "approval_flow_enabled" = true
WHERE EXISTS (
    SELECT 1
    FROM "tao_approvers" AS a
    WHERE a."tao_id" = t."id"
      AND a."scope" IN ('tao', 'both')
);

UPDATE "taos" AS t
SET
    "approval_status" = 'draft',
    "current_approval_level" = 0,
    "approval_flow_enabled" = false,
    "tao_lifecycle_status" = CASE
        WHEN "tao_lifecycle_status" = 'EM_VALIDACAO' THEN NULL
        ELSE "tao_lifecycle_status"
    END
WHERE t."approval_status" = 'pending'
  AND NOT EXISTS (
      SELECT 1
      FROM "tao_approvers" AS a
      WHERE a."tao_id" = t."id"
        AND a."scope" IN ('tao', 'both')
  );

CREATE INDEX IF NOT EXISTS "taos_approval_flow_enabled_idx"
    ON "taos"("approval_flow_enabled");
