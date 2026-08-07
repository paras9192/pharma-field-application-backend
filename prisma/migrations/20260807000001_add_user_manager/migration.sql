-- Reporting line for users: MR / Sales Person -> ASM -> ZSM.
--
-- The manager_id column and the ASM/ZSM role rows already exist in environments
-- where an earlier `db push` added them (production, as of 2026-08-07), so every
-- step here is idempotent and safe to re-run.

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "manager_id" TEXT;

CREATE INDEX IF NOT EXISTS "users_manager_id_idx" ON "users"("manager_id");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_manager_id_fkey') THEN
    ALTER TABLE "users"
      ADD CONSTRAINT "users_manager_id_fkey"
      FOREIGN KEY ("manager_id") REFERENCES "users"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Without these rows a role change to ASM/ZSM passes validation and then fails
-- with "Role ASM not found", because the service resolves the role by name.
INSERT INTO "roles" ("name", "description") VALUES
  ('ASM', 'Area Sales Manager - field manager with MRs/Sales Persons reporting to them'),
  ('ZSM', 'Zonal Sales Manager - field manager with ASMs reporting to them')
ON CONFLICT ("name") DO NOTHING;
