export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  ZSM = 'ZSM',
  ASM = 'ASM',
  MR = 'MR',
  SALES_PERSON = 'SALES_PERSON',
}

/**
 * ASM and ZSM are treated exactly like an MR for now — same endpoints, same
 * permissions, and the same "own records only" scoping. They are senior titles
 * without any hierarchy behaviour yet.
 *
 * Every place that used to test `role === Role.MR` goes through this list, so
 * when the real reporting-line rules land there is one place to unpick.
 */
export const MR_ROLES = [Role.MR, Role.ASM, Role.ZSM];

export const isMrRole = (roleName?: string): boolean =>
  MR_ROLES.includes(roleName as Role);
