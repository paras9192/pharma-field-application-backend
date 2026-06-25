-- Add ASM and ZSM to RoleName enum
ALTER TYPE "RoleName" ADD VALUE IF NOT EXISTS 'ASM';
ALTER TYPE "RoleName" ADD VALUE IF NOT EXISTS 'ZSM';

-- Insert role records
INSERT INTO "roles" (name, description) VALUES ('ASM', 'Area Sales Manager') ON CONFLICT (name) DO NOTHING;
INSERT INTO "roles" (name, description) VALUES ('ZSM', 'Zonal Sales Manager') ON CONFLICT (name) DO NOTHING;
