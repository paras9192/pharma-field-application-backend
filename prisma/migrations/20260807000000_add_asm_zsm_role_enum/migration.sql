-- Adds ASM and ZSM to the RoleName enum.
--
-- This is deliberately a migration of its own: Postgres will not let a newly
-- added enum value be *used* in the same transaction that adds it, and Prisma
-- runs each migration in one transaction. The role rows that reference these
-- values are inserted by the next migration.
--
-- Both values already exist in environments where an earlier `db push` added
-- them (production, as of 2026-08-07), so this is written to be re-runnable.

ALTER TYPE "RoleName" ADD VALUE IF NOT EXISTS 'ASM';
ALTER TYPE "RoleName" ADD VALUE IF NOT EXISTS 'ZSM';
